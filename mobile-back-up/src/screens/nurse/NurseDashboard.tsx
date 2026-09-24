import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export default function NurseDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    assignedPatients: 0,
    upcomingMeds: 0,
    missedDoses: 0,
    completedMeds: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedulesRes, patientsRes] = await Promise.all([
        api.get('/schedules'),
        api.get('/patients')
      ]);
      
      const schedules = schedulesRes.data.data || [];
      const patients = patientsRes.data.data || [];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todaysSchedules = schedules.filter((s: any) => {
        const d = new Date(s.scheduled_time);
        return d >= today && d < tomorrow;
      });
      
      setStats({
        assignedPatients: patients.length,
        upcomingMeds: todaysSchedules.filter((s: any) => s.status === 'pending').length,
        missedDoses: todaysSchedules.filter((s: any) => s.status === 'missed').length,
        completedMeds: todaysSchedules.filter((s: any) => s.status === 'completed').length
      });
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setStats({
        assignedPatients: 0,
        upcomingMeds: 0,
        missedDoses: 0,
        completedMeds: 0
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
        style={styles.scrollContainer} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Nurse Info Badge */}
        <View style={styles.nurseBadge}>
          <View style={styles.nurseAvatar}>
            <Text style={styles.nurseInitials}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Text>
          </View>
          <View style={styles.nurseInfo}>
            <Text style={styles.nurseName}>{user?.first_name} {user?.last_name}</Text>
            <Text style={styles.nurseRole}>Nurse</Text>
          </View>
        </View>

        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>Welcome, {user?.first_name}</Text>
          <Text style={styles.subtitle}>Here's your nursing overview for today.</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#dbeafe' }]}>
              <Text style={styles.statIcon}>👥</Text>
            </View>
            <Text style={styles.statNumber}>{stats.assignedPatients}</Text>
            <Text style={styles.statLabel}>Assigned Patients</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#d1fae5' }]}>
              <Text style={styles.statIcon}>🕐</Text>
            </View>
            <Text style={styles.statNumber}>{stats.upcomingMeds}</Text>
            <Text style={styles.statLabel}>Upcoming Meds</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#fee2e2' }]}>
              <Text style={styles.statIcon}>⚠️</Text>
            </View>
            <Text style={styles.statNumber}>{stats.missedDoses}</Text>
            <Text style={styles.statLabel}>Missed Doses</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#dbeafe' }]}>
              <Text style={styles.statIcon}>💊</Text>
            </View>
            <Text style={styles.statNumber}>{stats.completedMeds}</Text>
            <Text style={styles.statLabel}>Completed Meds</Text>
          </View>
        </View>

        {/* Assigned Patients Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>👥</Text>
            <Text style={styles.sectionTitle}>Assigned Patients</Text>
          </View>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No assigned patients currently.</Text>
          </View>
        </View>

        {/* Upcoming Medications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📋</Text>
            <Text style={styles.sectionTitle}>Upcoming Medications</Text>
          </View>
          {/* Empty state or content here */}
        </View>

        {/* Missed Medications Section */}
        <View style={styles.alertSection}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <Text style={styles.alertTitle}>Missed Medications</Text>
          </View>
          {/* Empty state or list of missed meds here */}
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
  nurseBadge: {
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
  nurseAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  nurseInitials: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  nurseInfo: {
    justifyContent: 'center',
  },
  nurseName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  nurseRole: {
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
  alertSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
  },
});
