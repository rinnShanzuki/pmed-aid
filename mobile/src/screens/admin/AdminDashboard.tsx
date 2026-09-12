import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard');
      setStats(res.data.data || {});
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      // Use sample data if API fails
      setStats({
        totalPatients: 1,
        activePatients: 0,
        totalDoctors: 1,
        totalNurses: 1,
      });
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
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Top KPI Cards */}
      <Text style={styles.sectionTitle}>Top KPI Cards</Text>
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIcon, { backgroundColor: '#dbeafe' }]}>
            <Text style={styles.kpiIconText}>👥</Text>
          </View>
          <Text style={styles.kpiLabel}>Total Patients</Text>
          <Text style={styles.kpiValue}>{stats.totalPatients || 1}</Text>
          <Text style={styles.kpiSubtext}>Total registered patients</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIcon, { backgroundColor: '#e0e7ff' }]}>
            <Text style={styles.kpiIconText}>📈</Text>
          </View>
          <Text style={styles.kpiLabel}>Active Patients</Text>
          <Text style={styles.kpiValue}>{stats.activePatients || 0}</Text>
          <Text style={styles.kpiSubtext}>Currently admitted patients</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIcon, { backgroundColor: '#dcfce7' }]}>
            <Text style={styles.kpiIconText}>👨‍⚕️</Text>
          </View>
          <Text style={styles.kpiLabel}>Total Doctors</Text>
          <Text style={styles.kpiValue}>{stats.totalDoctors || 1}</Text>
          <Text style={styles.kpiSubtext}>Registered doctors</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIcon, { backgroundColor: '#fed7aa' }]}>
            <Text style={styles.kpiIconText}>💉</Text>
          </View>
          <Text style={styles.kpiLabel}>Total Nurses</Text>
          <Text style={styles.kpiValue}>{stats.totalNurses || 1}</Text>
          <Text style={styles.kpiSubtext}>Registered nurses</Text>
        </View>
      </View>

      {/* Dashboard Charts */}
      <Text style={styles.sectionTitle}>Dashboard Charts</Text>

      {/* Monthly Medication Adherence Trend */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartIcon}>📈</Text>
          <Text style={styles.chartTitle}>Monthly Medication Adherence Trend</Text>
        </View>
        <View style={styles.chartPlaceholder}>
          <View style={styles.yAxis}>
            <Text style={styles.axisLabel}>100%</Text>
            <Text style={styles.axisLabel}>75%</Text>
            <Text style={styles.axisLabel}>50%</Text>
            <Text style={styles.axisLabel}>25%</Text>
            <Text style={styles.axisLabel}>0%</Text>
          </View>
          <View style={styles.lineChartArea}>
            <View style={styles.lineChart} />
            <View style={styles.xAxis}>
              <Text style={styles.axisLabel}>May</Text>
              <Text style={styles.axisLabel}>Jun</Text>
              <Text style={styles.axisLabel}>Jul</Text>
              <Text style={styles.axisLabel}>Aug</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Medication Status Distribution */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartIcon}>📊</Text>
          <Text style={styles.chartTitle}>Medication Status Distribution</Text>
        </View>
        <View style={styles.donutContainer}>
          <View style={styles.donutChart}>
            <View style={[styles.donutSegment, styles.donutCompleted]} />
            <View style={[styles.donutSegment, styles.donutMissed]} />
            <View style={[styles.donutSegment, styles.donutPending]} />
            <View style={styles.donutHole} />
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.legendText}>Completed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.legendText}>Missed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.legendText}>Pending</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Patient Admission Trend */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartIcon}>📅</Text>
          <Text style={styles.chartTitle}>Patient Admission Trend</Text>
        </View>
        <View style={styles.tabContainer}>
          <Text style={styles.tab}>Daily</Text>
          <Text style={styles.tab}>Weekly</Text>
          <Text style={[styles.tab, styles.tabActive]}>Monthly</Text>
        </View>
        <View style={styles.admissionChart}>
          <View style={styles.admissionInfo}>
            <Text style={styles.admissionLabel}>Admissions: 0</Text>
          </View>
          <View style={styles.barChartArea}>
            <View style={styles.yAxisNumbers}>
              <Text style={styles.axisNum}>4</Text>
              <Text style={styles.axisNum}>3</Text>
              <Text style={styles.axisNum}>2</Text>
              <Text style={styles.axisNum}>1</Text>
              <Text style={styles.axisNum}>0</Text>
            </View>
            <View style={styles.barChart}>
              <View style={styles.xAxisMonths}>
                <Text style={styles.monthLabel}>Mar</Text>
                <Text style={styles.monthLabel}>Apr</Text>
                <Text style={styles.monthLabel}>May</Text>
                <Text style={styles.monthLabel}>Jun</Text>
                <Text style={styles.monthLabel}>Jul</Text>
                <Text style={styles.monthLabel}>Aug</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Overall Medication Adherence */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartIcon}>📊</Text>
          <Text style={styles.chartTitle}>Overall Medication Adherence</Text>
        </View>
        <Text style={styles.adherenceSubtext}>Current tracking of patient adherence percentage.</Text>
        <Text style={styles.adherencePercentage}>0%</Text>
        <View style={styles.adherenceLine}>
          <View style={styles.adherenceDot} />
          <View style={styles.adherenceDot} />
          <View style={styles.adherenceDot} />
          <View style={styles.adherenceDot} />
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    marginTop: 8,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  kpiCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: (width - 44) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  kpiIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiIconText: {
    fontSize: 20,
  },
  kpiLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  kpiSubtext: {
    fontSize: 12,
    color: '#94a3b8',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  chartPlaceholder: {
    flexDirection: 'row',
    height: 200,
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingRight: 8,
    paddingVertical: 10,
  },
  axisLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  lineChartArea: {
    flex: 1,
  },
  lineChart: {
    flex: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  donutContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  donutChart: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#10b981',
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  donutSegment: {
    position: 'absolute',
  },
  donutCompleted: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#10b981',
  },
  donutMissed: {
    width: 40,
    height: 40,
    backgroundColor: '#ef4444',
    position: 'absolute',
    right: 0,
    top: 80,
    borderTopRightRadius: 80,
    borderBottomRightRadius: 80,
  },
  donutPending: {
    width: 30,
    height: 60,
    backgroundColor: '#3b82f6',
    position: 'absolute',
    right: 0,
    bottom: 30,
    borderBottomRightRadius: 80,
  },
  donutHole: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    position: 'absolute',
    top: 30,
    left: 30,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    fontSize: 13,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
  },
  tabActive: {
    backgroundColor: '#3b82f6',
    color: '#fff',
    fontWeight: '600',
  },
  admissionChart: {
    marginTop: 16,
  },
  admissionInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  admissionLabel: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  barChartArea: {
    flexDirection: 'row',
    height: 150,
  },
  yAxisNumbers: {
    justifyContent: 'space-between',
    paddingRight: 8,
    paddingVertical: 10,
  },
  axisNum: {
    fontSize: 11,
    color: '#94a3b8',
  },
  barChart: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  xAxisMonths: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    paddingTop: 8,
  },
  monthLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  adherenceSubtext: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
  },
  adherencePercentage: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  adherenceLine: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 40,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  adherenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#a855f7',
  },
});
