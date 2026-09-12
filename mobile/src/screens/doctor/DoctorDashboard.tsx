import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayPatients: 0,
    activeAdmissions: 0,
    activePrescriptions: 0,
    overdueMedications: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch real data from API
      const [admissionsRes, prescriptionsRes] = await Promise.all([
        api.get('/admissions'),
        api.get('/prescriptions')
      ]);
      
      const admissions = admissionsRes.data.data || [];
      const prescriptions = prescriptionsRes.data.data || [];
      
      setStats({
        todayPatients: 0,
        activeAdmissions: admissions.filter((a: any) => a.status === 'active').length,
        activePrescriptions: prescriptions.filter((p: any) => p.status === 'active').length,
        overdueMedications: 0
      });
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setStats({
        todayPatients: 0,
        activeAdmissions: 0,
        activePrescriptions: 0,
        overdueMedications: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a5f" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Doctor Info Badge */}
        <View style={styles.doctorBadge}>
          <View style={styles.doctorAvatar}>
            <Text style={styles.doctorInitials}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Text>
          </View>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>Dr. {user?.last_name || user?.first_name}</Text>
            <Text style={styles.doctorRole}>Doctor</Text>
          </View>
        </View>

        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>Welcome, Dr. {user?.last_name || user?.first_name}</Text>
          <Text style={styles.subtitle}>Here's your overview for today.</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#dbeafe' }]}>
              <Text style={styles.statIcon}>👥</Text>
            </View>
            <Text style={styles.statNumber}>{stats.todayPatients}</Text>
            <Text style={styles.statLabel}>Today's Patients</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#d1fae5' }]}>
              <Text style={styles.statIcon}>🛏️</Text>
            </View>
            <Text style={styles.statNumber}>{stats.activeAdmissions}</Text>
            <Text style={styles.statLabel}>Active Admissions</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#e0e7ff' }]}>
              <Text style={styles.statIcon}>💊</Text>
            </View>
            <Text style={styles.statNumber}>{stats.activePrescriptions}</Text>
            <Text style={styles.statLabel}>Active Prescriptions</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#fed7aa' }]}>
              <Text style={styles.statIcon}>⚠️</Text>
            </View>
            <Text style={styles.statNumber}>{stats.overdueMedications}</Text>
            <Text style={styles.statLabel}>Overdue Medications</Text>
          </View>
        </View>

        {/* My Patients Today Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📋</Text>
            <Text style={styles.sectionTitle}>My Patients Today</Text>
          </View>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No patients assigned to you today.</Text>
          </View>
        </View>

        {/* Today's Medication Schedule Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🕐</Text>
            <Text style={styles.sectionTitle}>Today's Medication Schedule</Text>
          </View>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No medication schedules today.</Text>
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
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  doctorBadge: {
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
  doctorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  doctorInitials: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  doctorInfo: {
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  doctorRole: {
    fontSize: 13,
    color: '#64748b',
  },
  greetingSection: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
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
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 24,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
