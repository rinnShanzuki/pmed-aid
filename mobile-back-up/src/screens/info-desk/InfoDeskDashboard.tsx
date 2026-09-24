import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export default function InfoDeskDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    newAdmissions: 0,
    activePatients: 0,
    recentPrescriptions: 0,
    pendingRegistrations: 1
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [admissionsRes, patientsRes, prescriptionsRes] = await Promise.all([
        api.get('/admissions'),
        api.get('/patients'),
        api.get('/prescriptions')
      ]);
      
      const admissions = admissionsRes.data.data || [];
      const patients = patientsRes.data.data || [];
      const prescriptions = prescriptionsRes.data.data || [];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const newToday = admissions.filter((a: any) => {
        const admDate = new Date(a.admission_date);
        admDate.setHours(0, 0, 0, 0);
        return admDate.getTime() === today.getTime();
      });
      
      const activePatients = admissions.filter((a: any) => a.status === 'active');
      
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const recentPrescriptions = prescriptions.filter((p: any) => {
        const pDate = new Date(p.created_at);
        return pDate >= lastWeek;
      });
      
      setStats({
        newAdmissions: newToday.length,
        activePatients: activePatients.length,
        recentPrescriptions: recentPrescriptions.length,
        pendingRegistrations: 1 // This would come from a specific endpoint
      });
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setStats({
        newAdmissions: 0,
        activePatients: 0,
        recentPrescriptions: 0,
        pendingRegistrations: 1
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
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Desk Staff Badge */}
        <View style={styles.staffBadge}>
          <View style={styles.staffAvatar}>
            <Text style={styles.staffInitials}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Text>
          </View>
          <View style={styles.staffInfo}>
            <Text style={styles.staffName}>{user?.first_name} {user?.last_name}</Text>
            <Text style={styles.staffRole}>Information Desk</Text>
          </View>
        </View>

        {/* Overview Section */}
        <View style={styles.overviewSection}>
          <Text style={styles.overviewTitle}>Overview</Text>
          <Text style={styles.overviewSubtitle}>Welcome to the Information Desk Portal.</Text>
        </View>

        {/* Stats Grid - 4 Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#dbeafe' }]}>
              <Text style={styles.statIcon}>🛏️</Text>
            </View>
            <Text style={styles.statNumber}>{stats.newAdmissions}</Text>
            <Text style={styles.statTitle}>New Admissions Today</Text>
            <Text style={styles.statSubtitle}>Patients admitted today</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#fce7f3' }]}>
              <Text style={styles.statIcon}>👥</Text>
            </View>
            <Text style={styles.statNumber}>{stats.activePatients}</Text>
            <Text style={styles.statTitle}>Total Active Patients</Text>
            <Text style={styles.statSubtitle}>Currently in rooms</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#d1fae5' }]}>
              <Text style={styles.statIcon}>📋</Text>
            </View>
            <Text style={styles.statNumber}>{stats.recentPrescriptions}</Text>
            <Text style={styles.statTitle}>Recent Prescriptions</Text>
            <Text style={styles.statSubtitle}>Encoded in the last 7 days</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#fed7aa' }]}>
              <Text style={styles.statIcon}>⏰</Text>
            </View>
            <Text style={styles.statNumber}>{stats.pendingRegistrations}</Text>
            <Text style={styles.statTitle}>Pending Registrations</Text>
            <Text style={styles.statSubtitle}>Require profile completion</Text>
          </View>
        </View>

        {/* Admission Trend Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admission Trend</Text>
          <Text style={styles.sectionSubtitle}>Track patient admissions over the week.</Text>
          
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartText}>📊 Chart visualization would go here</Text>
            <Text style={styles.chartSubtext}>Line chart showing daily admission trends</Text>
          </View>
        </View>

        {/* Patient Status Distribution Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Status Distribution</Text>
          <Text style={styles.sectionSubtitle}>Quick overview of patient current states.</Text>
          
          <View style={styles.chartPlaceholder}>
            <View style={styles.donutPlaceholder}>
              <View style={styles.donutCircle} />
            </View>
            
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
                <Text style={styles.legendText}>Admitted</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.legendText}>Discharged</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#f97316' }]} />
                <Text style={styles.legendText}>Pending Registration</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  staffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    alignSelf: 'flex-end',
  },
  staffAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  staffInitials: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  staffInfo: {
    justifyContent: 'center',
  },
  staffName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  staffRole: {
    fontSize: 13,
    color: '#64748b',
  },
  overviewSection: {
    marginBottom: 24,
  },
  overviewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  overviewSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '47%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 28,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 20,
  },
  chartPlaceholder: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  chartText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  chartSubtext: {
    fontSize: 12,
    color: '#94a3b8',
  },
  donutPlaceholder: {
    alignItems: 'center',
    marginBottom: 20,
  },
  donutCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 20,
    borderColor: '#f97316',
    borderTopColor: '#3b82f6',
    borderRightColor: '#10b981',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    color: '#64748b',
  },
});
