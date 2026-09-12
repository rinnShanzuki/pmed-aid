import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import api from '../../services/api';

interface ReportStats {
  totalPatients: number;
  totalDoctors: number;
  totalNurses: number;
  adherenceRate: number;
}

export default function ReportsAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReportStats>({
    totalPatients: 1,
    totalDoctors: 1,
    totalNurses: 1,
    adherenceRate: 0,
  });

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/reports');
      setStats(res.data.data || {
        totalPatients: 1,
        totalDoctors: 1,
        totalNurses: 1,
        adherenceRate: 0,
      });
    } catch (err: any) {
      console.error('Fetch reports error:', err);
      // Use default stats if API fails
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
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

      {/* Charts Grid */}
      <View style={styles.chartsGrid}>
        {/* Medication Adherence Report */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartIcon}>📈</Text>
            <Text style={styles.chartTitle}>Medication Adherence Report</Text>
          </View>
          <View style={styles.lineChartContainer}>
            <View style={styles.lineChartPlaceholder}>
              <View style={styles.lineChartAxis} />
            </View>
          </View>
        </View>

        {/* Hospital Admissions Over Time */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Hospital Admissions Over Time</Text>
          </View>
          <View style={styles.lineChartContainer}>
            <View style={styles.lineChartPlaceholder}>
              <View style={styles.lineChartAxis} />
            </View>
          </View>
        </View>

        {/* Staff & Patient Distribution */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Staff & Patient Distribution</Text>
          </View>
          <View style={styles.donutContainer}>
            <View style={styles.donutChart}>
              {/* Blue segment - Doctors */}
              <View style={[styles.donutSegment, styles.segmentDoctors]} />
              {/* Green segment - Nurses */}
              <View style={[styles.donutSegment, styles.segmentNurses]} />
              {/* Orange segment - Patients */}
              <View style={[styles.donutSegment, styles.segmentPatients]} />
              <View style={styles.donutHole} />
            </View>
            <View style={styles.donutLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
                <Text style={styles.legendText}>Doctors: {stats.totalDoctors}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.legendText}>Nurses: {stats.totalNurses}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#f97316' }]} />
                <Text style={styles.legendText}>Patients: {stats.totalPatients}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Hospital Statistics Summary */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Hospital Statistics Summary</Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <View style={styles.statDot} style={[styles.statDot, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.statLabel}>Total Patients</Text>
              <Text style={styles.statValue}>{stats.totalPatients}</Text>
            </View>
            <View style={styles.statRow}>
              <View style={[styles.statDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.statLabel}>Total Doctors</Text>
              <Text style={styles.statValue}>{stats.totalDoctors}</Text>
            </View>
            <View style={styles.statRow}>
              <View style={[styles.statDot, { backgroundColor: '#f97316' }]} />
              <Text style={styles.statLabel}>Total Nurses</Text>
              <Text style={styles.statValue}>{stats.totalNurses}</Text>
            </View>
            <View style={styles.statRow}>
              <View style={[styles.statDot, { backgroundColor: '#a855f7' }]} />
              <Text style={styles.statLabel}>Adherence Rate</Text>
              <Text style={styles.statValue}>{stats.adherenceRate}%</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
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
  chartsGrid: {
    gap: 16,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  lineChartContainer: {
    height: 200,
  },
  lineChartPlaceholder: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  lineChartAxis: {
    height: '100%',
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#fafbfc',
  },
  donutContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  donutChart: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  donutSegment: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  segmentDoctors: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#3b82f6',
    transform: [{ rotate: '0deg' }],
  },
  segmentNurses: {
    width: 70,
    height: 140,
    backgroundColor: '#10b981',
    position: 'absolute',
    left: 0,
    borderTopLeftRadius: 70,
    borderBottomLeftRadius: 70,
  },
  segmentPatients: {
    width: 70,
    height: 70,
    backgroundColor: '#f97316',
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderBottomRightRadius: 70,
  },
  donutHole: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    position: 'absolute',
    top: 30,
    left: 30,
  },
  donutLegend: {
    gap: 12,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    color: '#64748b',
  },
  statsContainer: {
    gap: 16,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  statLabel: {
    flex: 1,
    fontSize: 14,
    color: '#64748b',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
});

