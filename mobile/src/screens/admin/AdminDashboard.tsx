import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOrientation } from '../../hooks/useOrientation';
import api from '../../services/api';

const PIE_COLORS = ['#22c55e', '#3b82f6', '#f43f5e'];

export default function AdminDashboard() {
  const { width, height, isLandscape } = useOrientation();
  const isTablet = width >= 768;

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [admissionView, setAdmissionView] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  // Responsive padding
  const paddingHorizontal = isLandscape ? 12 : 16;

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const { data } = await api.get('/admin/dashboard');
        setStats(data.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const statCards = [
    {
      label: 'Total Patients',
      value: stats?.totalPatients ?? 0,
      sub: 'Total registered patients',
      bg: '#eff6ff',
      color: '#3b82f6',
      icon: 'account-multiple',
    },
    {
      label: 'Active Patients',
      value: stats?.activePatients ?? 0,
      sub: 'Currently admitted patients',
      bg: '#fdf4ff',
      color: '#d946ef',
      icon: 'hand-heart',
    },
    {
      label: 'Total Doctors',
      value: stats?.totalDoctors ?? 0,
      sub: 'Registered doctors',
      bg: '#f0fdf4',
      color: '#22c55e',
      icon: 'doctor',
    },
    {
      label: 'Total Nurses',
      value: stats?.totalNurses ?? 0,
      sub: 'Registered nurses',
      bg: '#fff7ed',
      color: '#f97316',
      icon: 'hospital-box',
    },
  ];

  const cardWidth = isTablet ? '48%' : '100%';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={styles.pageTitle}>KPI Cards</Text>

      {/* ── Stat Cards ── */}
      <View style={styles.statsGrid}>
        {statCards.map((card) => (
          <View key={card.label} style={[styles.statCard, { width: cardWidth }]}>
            <View style={styles.statCardTop}>
              <View style={[styles.statCardIcon, { backgroundColor: card.bg, borderLeftWidth: 4, borderLeftColor: card.color }]}>
                <MaterialCommunityIcons name={card.icon} size={22} color={card.color} />
              </View>
              <View style={styles.statCardInfo}>
                <Text style={styles.statCardLabel}>{card.label}</Text>
                <Text style={styles.statCardValue}>{card.value}</Text>
              </View>
            </View>
            <Text style={styles.statCardSub}>{card.sub}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.pageTitle}>Charts</Text>

      {/* ── 1. Monthly Medication Adherence Trend (Line) ── */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Medication Adherence Trend</Text>
        </View>
        <LineChart data={stats?.adherenceTrend || []} />
      </View>

      {/* ── 2. Medication Status Distribution (Donut) ── */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Medication Status Distribution</Text>
        </View>
        <DonutChart data={stats?.medicationDistribution || []} />
      </View>

      {/* ── 3. Patient Admission Trend (Bar with toggle) ── */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeaderWithToggle}>
          <View style={styles.chartHeaderLeft}>
            <Text style={styles.chartTitle}>Patient Admission Trend</Text>
          </View>
        </View>

        {/* Toggle buttons */}
        <View style={styles.toggleBar}>
          {(['daily', 'weekly', 'monthly'] as const).map((view) => (
            <TouchableOpacity
              key={view}
              onPress={() => setAdmissionView(view)}
              style={[
                styles.toggleBtn,
                admissionView === view && styles.toggleBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  admissionView === view && styles.toggleBtnTextActive,
                ]}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <BarChart data={stats?.admissionTrend?.[admissionView] || []} />
      </View>

      {/* ── 4. Overall Medication Adherence (Big % + mini line) ── */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Overall Medication Adherence</Text>
        </View>
        <Text style={styles.chartSubtext}>
          Current tracking of patient adherence percentage.
        </Text>

        <View style={styles.overallRow}>
          <Text style={styles.overallValue}>{stats?.adherenceRate ?? 0}%</Text>
          <View style={{ flex: 1, height: 100, marginLeft: 12 }}>
            <MiniLineChart data={stats?.adherenceTrend || []} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LINE CHART (Adherence Trend) - Simplified version
// ═══════════════════════════════════════════════════════════════════════════
function LineChart({ data }: { data: any[] }) {
  if (!data.length) {
    return <Text style={styles.emptyText}>No adherence data available.</Text>;
  }

  return (
    <View style={styles.chartPlaceholder}>
      <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 16 }}>
        {data.map((d, i) => {
          const rate = d.rate ?? d.adherence_rate ?? 0;
          const height = (rate / 100) * 150;
          return (
            <View key={i} style={{ alignItems: 'center', marginHorizontal: 4 }}>
              <View
                style={{
                  width: 30,
                  height: height,
                  backgroundColor: '#3b82f6',
                  borderRadius: 4,
                  marginBottom: 8,
                }}
              />
              <Text style={{ fontSize: 10, color: '#94a3b8' }}>{d.month || `M${i}`}</Text>
            </View>
          );
        })}
      </View>
      <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 8 }}>
        Adherence Rate (%)
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DONUT CHART (Medication Status Distribution) - Simplified version
// ═══════════════════════════════════════════════════════════════════════════
function DonutChart({ data }: { data: any[] }) {
  const PIE_COLORS = ['#22c55e', '#3b82f6', '#f43f5e'];

  if (!data.length) {
    return <Text style={styles.emptyText}>No distribution data available.</Text>;
  }

  const total = data.reduce((sum, d) => sum + (d.value || 0), 0) || 1;

  return (
    <View style={{ alignItems: 'center', paddingVertical: 16 }}>
      {/* Simple bar representation */}
      <View style={{ width: '100%', gap: 12 }}>
        {data.map((d, i) => {
          const percentage = (d.value / total) * 100;
          return (
            <View key={i}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600' }}>{d.name}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#1e293b' }}>{d.value}%</Text>
              </View>
              <View style={{ height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                <View
                  style={{
                    height: '100%',
                    width: `${percentage}%`,
                    backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BAR CHART (Admission Trend) - Simplified version
// ═══════════════════════════════════════════════════════════════════════════
function BarChart({ data }: { data: any[] }) {
  if (!data.length) {
    return <Text style={styles.emptyText}>No admission data available.</Text>;
  }

  const maxVal = Math.max(...data.map((d) => d.value || 0), 1);

  return (
    <View style={styles.chartPlaceholder}>
      <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 16, flexDirection: 'row' }}>
        {data.map((d, i) => {
          const value = d.value || 0;
          const height = (value / maxVal) * 150;
          return (
            <View key={i} style={{ alignItems: 'center', marginHorizontal: 4, flex: 1 }}>
              <View
                style={{
                  width: '60%',
                  height: height,
                  backgroundColor: '#6366f1',
                  borderRadius: 4,
                  marginBottom: 8,
                }}
              />
              <Text style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>{d.label}</Text>
            </View>
          );
        })}
      </View>
      <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 8 }}>
        Admissions
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MINI LINE CHART (Overall Adherence) - Simplified version
// ═══════════════════════════════════════════════════════════════════════════
function MiniLineChart({ data }: { data: any[] }) {
  if (!data.length) return null;

  const maxVal = Math.max(...data.map((d) => d.rate ?? 0), 100);
  const minVal = Math.min(...data.map((d) => d.rate ?? 0), 0);

  return (
    <View style={{ height: 100, justifyContent: 'flex-end', flexDirection: 'row', gap: 2 }}>
      {data.map((d, i) => {
        const rate = d.rate ?? 0;
        const height = ((rate - minVal) / (maxVal - minVal)) * 80;
        return (
          <View
            key={i}
            style={{
              flex: 1,
              height: Math.max(height, 5),
              backgroundColor: '#a855f7',
              borderRadius: 3,
            }}
          />
        );
      })}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  contentContainer: { paddingBottom: 40 },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748b' },

  pageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 14,
    marginTop: 6,
    paddingHorizontal: 16,
  },

  // Stat cards
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  statCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardInfo: { flex: 1 },
  statCardLabel: { fontSize: 12, color: '#64748b', marginBottom: 2 },
  statCardValue: { fontSize: 26, fontWeight: '800', color: '#0f172a', lineHeight: 30 },
  statCardSub: { fontSize: 11, color: '#94a3b8', margin: 0 },

  // Chart card
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartHeaderWithToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  chartTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  chartSubtext: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },

  // Toggle
  toggleBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 3,
    borderRadius: 7,
    marginBottom: 12,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 5,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleBtnText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  toggleBtnTextActive: { color: '#0f172a' },

  // Overall adherence
  overallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  overallValue: {
    fontSize: 38,
    fontWeight: '800',
    color: '#1e293b',
  },

  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 28,
  },
  chartPlaceholder: {
    height: 180,
    backgroundColor: '#f8fafc',
    borderRadius: 7,
    padding: 12,
    marginVertical: 8,
    justifyContent: 'center',
  },
});