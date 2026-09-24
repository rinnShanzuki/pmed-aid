import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export default function PatientMonitoring() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    overdueDoses: 0,
    upcomingDoses: 0,
    completedToday: 0,
    takeHomePrescriptions: 0
  });
  const [overdueMeds, setOverdueMeds] = useState([]);
  const [upcomingMeds, setUpcomingMeds] = useState([]);
  const [completedMeds, setCompletedMeds] = useState([]);
  const [takeHomeRx, setTakeHomeRx] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/schedules');
      const schedules = response.data.data || [];
      
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const overdue = schedules.filter((s: any) => {
        const schedTime = new Date(s.scheduled_time);
        return s.status === 'pending' && schedTime < now;
      });
      
      const upcoming = schedules.filter((s: any) => {
        const schedTime = new Date(s.scheduled_time);
        return s.status === 'pending' && schedTime >= now && schedTime < tomorrow;
      });
      
      const completed = schedules.filter((s: any) => {
        const schedTime = new Date(s.scheduled_time);
        return s.status === 'completed' && schedTime >= today && schedTime < tomorrow;
      });
      
      setStats({
        overdueDoses: overdue.length,
        upcomingDoses: upcoming.length,
        completedToday: completed.length,
        takeHomePrescriptions: 0
      });
      
      setOverdueMeds(overdue);
      setUpcomingMeds(upcoming);
      setCompletedMeds(completed);
      setTakeHomeRx([]);
    } catch (err: any) {
      console.error('Patient monitoring fetch error:', err);
      setStats({
        overdueDoses: 0,
        upcomingDoses: 0,
        completedToday: 0,
        takeHomePrescriptions: 0
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
        {/* Staff Badge */}
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

        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Patient Monitoring</Text>
          <Text style={styles.headerSubtitle}>
            Track in-hospital medication delivery and take-home adherence readiness.
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#fee2e2' }]}>
              <Text style={styles.statIcon}>⚠️</Text>
            </View>
            <Text style={styles.statNumber}>{stats.overdueDoses}</Text>
            <Text style={styles.statLabel}>Overdue ward doses</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#fef3c7' }]}>
              <Text style={styles.statIcon}>🕐</Text>
            </View>
            <Text style={styles.statNumber}>{stats.upcomingDoses}</Text>
            <Text style={styles.statLabel}>Upcoming ward doses</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#d1fae5' }]}>
              <Text style={styles.statIcon}>✓</Text>
            </View>
            <Text style={styles.statNumber}>{stats.completedToday}</Text>
            <Text style={styles.statLabel}>Completed today</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#dbeafe' }]}>
              <Text style={styles.statIcon}>🏠</Text>
            </View>
            <Text style={styles.statNumber}>{stats.takeHomePrescriptions}</Text>
            <Text style={styles.statLabel}>Take-home prescriptions</Text>
          </View>
        </View>

        {/* Two Column Layout */}
        <View style={styles.cardsContainer}>
          {/* Overdue Medications Card */}
          <View style={[styles.monitorCard, styles.overdueCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>⚠️</Text>
              <Text style={[styles.cardTitle, { color: '#dc2626' }]}>Overdue Medications</Text>
            </View>
            
            <View style={styles.cardContent}>
              {overdueMeds.length === 0 ? (
                <Text style={[styles.emptyMessage, { color: '#10b981' }]}>
                  No overdue medications.
                </Text>
              ) : (
                <View style={styles.medicationList}>
                  {overdueMeds.map((med: any, index: number) => (
                    <View key={index} style={styles.medicationItem}>
                      <Text style={styles.medicationPatient}>
                        {med.patient?.first_name} {med.patient?.last_name}
                      </Text>
                      <Text style={styles.medicationName}>
                        {med.prescriptionItem?.medication_name}
                      </Text>
                      <Text style={styles.medicationTime}>
                        Due: {new Date(med.scheduled_time).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Upcoming Medications Card */}
          <View style={[styles.monitorCard, styles.upcomingCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>🕐</Text>
              <Text style={[styles.cardTitle, { color: '#d97706' }]}>Upcoming Medications</Text>
            </View>
            
            <View style={styles.cardContent}>
              {upcomingMeds.length === 0 ? (
                <Text style={styles.emptyMessage}>
                  No upcoming medications today.
                </Text>
              ) : (
                <View style={styles.medicationList}>
                  {upcomingMeds.map((med: any, index: number) => (
                    <View key={index} style={styles.medicationItem}>
                      <Text style={styles.medicationPatient}>
                        {med.patient?.first_name} {med.patient?.last_name}
                      </Text>
                      <Text style={styles.medicationName}>
                        {med.prescriptionItem?.medication_name}
                      </Text>
                      <Text style={styles.medicationTime}>
                        Due: {new Date(med.scheduled_time).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Completed Today Card */}
          <View style={[styles.monitorCard, styles.completedCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>✓</Text>
              <Text style={[styles.cardTitle, { color: '#059669' }]}>Completed Today</Text>
            </View>
            
            <View style={styles.cardContent}>
              {completedMeds.length === 0 ? (
                <Text style={styles.emptyMessage}>
                  No medications completed today.
                </Text>
              ) : (
                <View style={styles.medicationList}>
                  {completedMeds.map((med: any, index: number) => (
                    <View key={index} style={styles.medicationItem}>
                      <Text style={styles.medicationPatient}>
                        {med.patient?.first_name} {med.patient?.last_name}
                      </Text>
                      <Text style={styles.medicationName}>
                        {med.prescriptionItem?.medication_name}
                      </Text>
                      <Text style={styles.medicationTime}>
                        Completed: {new Date(med.scheduled_time).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Take-home Rx Card */}
          <View style={styles.monitorCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>🏠</Text>
              <Text style={styles.cardTitle}>Take-home Rx</Text>
            </View>
            
            <View style={styles.cardContent}>
              <Text style={styles.emptyMessage}>
                No active take-home prescriptions.
              </Text>
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
  headerSection: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
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
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  cardsContainer: {
    gap: 16,
  },
  monitorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderTopWidth: 4,
    borderTopColor: '#e2e8f0',
  },
  overdueCard: {
    borderTopColor: '#dc2626',
  },
  upcomingCard: {
    borderTopColor: '#f59e0b',
  },
  completedCard: {
    borderTopColor: '#10b981',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardContent: {
    paddingVertical: 10,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 20,
  },
  medicationList: {
    gap: 12,
  },
  medicationItem: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  medicationPatient: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  medicationName: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 2,
  },
  medicationTime: {
    fontSize: 12,
    color: '#64748b',
  },
});
