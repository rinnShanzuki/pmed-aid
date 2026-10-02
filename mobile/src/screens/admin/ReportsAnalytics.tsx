import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import api from '../../services/api';

interface ReportStats {
  totalPatients: number;
  totalDoctors: number;
  totalNurses: number;
  activePatients: number;
  adherenceRate: number;
  adherenceTrend?: any[];
  medicationDistribution?: any[];
  admissionTrend?: { daily: any[]; weekly: any[]; monthly: any[] };
}

export default function ReportsAnalytics() {
  const [loading, setLoading] = useState(true);
  const [admissionView, setAdmissionView] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [stats, setStats] = useState<ReportStats>({
    totalPatients: 0,
    totalDoctors: 0,
    totalNurses: 0,
    activePatients: 0,
    adherenceRate: 0,
    adherenceTrend: [],
    medicationDistribution: [],
    admissionTrend: { daily: [], weekly: [], monthly: [] },
  });

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard');
      setStats(res.data.data || {
        totalPatients: 0,
        totalDoctors: 0,
        totalNurses: 0,
        activePatients: 0,
        adherenceRate: 0,
      });
    } catch (err: any) {
      console.error('Fetch reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>📊</Text>
        <Text style={styles.headerTitle}>Reports & Analytics</Text>
      </View>

      {/* KPI Cards */}
      <View style={styles.kpiGrid}>
        <KPICard label="Total Patients" value={stats.totalPatients} icon="👥" color="#3b82f6" />
        <KPICard label="Active Patients" value={stats.activePatients} icon="📈" color="#d946ef" />
        <KPICard label="Total Doctors" value={stats.totalDoctors} icon="🩺" color="#22c55e" />
        <KPICard label="Total Nurses" value={stats.totalNurses} icon="❤️" color="#f97316" />
      </View>

      {/* Medication Adherence Trend */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartIcon}>📈</Text>
          <Text style={styles.chartTitle}>Medication Adherence Trend</Text>
        </View>
        <SimpleBarChart data={stats.adherenceTrend || []} />
      </View>

      {/* Medication Status Distribution */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartIcon}>📊</Text>
          <Text style={styles.chartTitle}>Medication Status Distribution</Text>
        </View>
        <SimpleProgressChart data={stats.medicationDistribution || []} />
      </View>

      {/* Patient Admission Trend with Toggle */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeaderWithToggle}>
          <View style={styles.chartHeaderLeft}>
            <Text style={styles.chartIcon}>📅</Text>
            <Text style={styles.chartTitle}>Patient Admission Trend</Text>
          </View>
        </View>

        {/* Toggle buttons */}
        <View style={styles.toggleBar}>
          {(['daily', 'weekly', 'monthly'] as const).map((view) => (
            <TouchableOpacity
              key={view}
              style={[styles.toggleBtn, admissionView === view && styles.toggleBtnActive]}
              onPress={() => setAdmissionView(view)}
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

        <SimpleBarChart data={stats.admissionTrend?.[admissionView] || []} />
      </View>

      {/* Overall Adherence Rate */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartIcon}>📈</Text>
          <Text style={styles.chartTitle}>Overall Medication Adherence</Text>
        </View>
        <Text style={styles.chartSubtext}>Current tracking of patient adherence percentage</Text>
        <View style={styles.overallRow}>
          <Text style={styles.overallValue}>{stats.adherenceRate}%</Text>
          <View style={{ flex: 1, marginLeft: 20, justifyContent: 'center' }}>
            <View style={{ height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
              <View
                style={{
                  height: '100%',
                  width: `${stats.adherenceRate}%`,
                  backgroundColor: '#a855f7',
                }}
              />
            </View>
            <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              Adherence Progress
            </Text>
          </View>
        </View>
      </View>

      {/* Staff Distribution */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Staff & Patient Distribution</Text>
        </View>
        <View style={styles.statsGrid}>
          <StatItem label="Doctors" value={stats.totalDoctors} color="#3b82f6" />
          <StatItem label="Nurses" value={stats.totalNurses} color="#10b981" />
          <StatItem label="Patients" value={stats.totalPatients} color="#f97316" />
        </View>
      </View>
    </ScrollView>
  );
}

// Helper Components
function KPICard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <View style={styles.kpiCard}>
      <View style={[styles.kpiIcon, { backgroundColor: `${color}20` }]}>
        <Text style={{ fontSize: 24 }}>{icon}</Text>
      </View>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
    </View>
  );
}

function SimpleBarChart({ data }: { data: any[] }) {
  if (!data.length) {
    return <Text style={styles.emptyText}>No data available</Text>;
  }

  const maxVal = Math.max(...data.map(d => d.value || d.rate || 0), 1);

  return (
    <View style={styles.chartPlaceholder}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 150 }}>
        {data.map((d, i) => {
          const val = d.value || d.rate || 0;
          const height = (val / maxVal) * 130;
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <View
                style={{
                  width: '100%',
                  height: Math.max(height, 4),
                  backgroundColor: '#3b82f6',
                  borderRadius: 3,
                  marginBottom: 8,
                }}
              />
              <Text style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center' }}>
                {d.month || d.label || `${i}`}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function SimpleProgressChart({ data }: { data: any[] }) {
  if (!data.length) {
    return <Text style={styles.emptyText}>No data available</Text>;
  }

  const PIE_COLORS = ['#22c55e', '#3b82f6', '#f43f5e'];
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0) || 1;

  return (
    <View style={styles.chartPlaceholder}>
      {data.map((d, i) => {
        const percentage = (d.value / total) * 100;
        return (
          <View key={i} style={{ marginBottom: 12 }}>
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
  );
}

function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statItem}>
      <View style={[styles.statDot, { backgroundColor: color }]} />
      <View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  // KPI Cards
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  kpiIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
  },
  // Chart Cards
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
  chartHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chartIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  chartSubtext: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  // Toggle Bar
  toggleBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  toggleBtnTextActive: {
    color: '#0f172a',
  },
  // Overall Row
  overallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  overallValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1e293b',
  },
  chartPlaceholder: {
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 32,
  },
  statsGrid: {
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  statDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
});
