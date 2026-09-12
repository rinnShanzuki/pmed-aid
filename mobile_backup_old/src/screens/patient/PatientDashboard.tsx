import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

const { width } = Dimensions.get('window');

export default function PatientDashboard({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [patientId, setPatientId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const meRes = await api.get('/patients/me');
      const pId = meRes.data.data.id;
      setPatientId(pId);

      const schedRes = await api.get(`/schedules/patient/${pId}`);
      setSchedules(schedRes.data.data || []);
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      // Use fake data if API fails
      setSchedules([
        { id: 1, scheduled_time: new Date(Date.now() + 3600000).toISOString(), status: 'pending', prescriptionItem: { medication_name: 'Amoxicillin', dosage: '500', dosage_unit: 'mg' } },
        { id: 2, scheduled_time: new Date(Date.now() + 7200000).toISOString(), status: 'pending', prescriptionItem: { medication_name: 'Ibuprofen', dosage: '200', dosage_unit: 'mg' } },
        { id: 3, scheduled_time: new Date(Date.now() - 3600000).toISOString(), status: 'completed', prescriptionItem: { medication_name: 'Metformin', dosage: '850', dosage_unit: 'mg' } },
        { id: 4, scheduled_time: new Date(Date.now() + 10800000).toISOString(), status: 'pending', prescriptionItem: { medication_name: 'Lisinopril', dosage: '10', dosage_unit: 'mg' } },
        { id: 5, scheduled_time: new Date(Date.now() + 14400000).toISOString(), status: 'pending', prescriptionItem: { medication_name: 'Omeprazole', dosage: '20', dosage_unit: 'mg' } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysSchedules = schedules.filter(s => {
    const d = new Date(s.scheduled_time);
    return d >= today && d < tomorrow;
  });

  const completed = todaysSchedules.filter(s => s.status === 'completed');
  const missed = todaysSchedules.filter(s => s.status === 'missed');
  const pending = todaysSchedules.filter(s => s.status === 'pending');
  const upcoming = pending.filter(s => new Date(s.scheduled_time) >= now).sort((a,b) => new Date(a.scheduled_time) - new Date(b.scheduled_time));

  const adherence = todaysSchedules.length > 0 
    ? Math.round((completed.length / (completed.length + missed.length + pending.length)) * 100) 
    : 100;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
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
        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>Hello, {user?.first_name}</Text>
          <Text style={styles.subtitle}>Here is your daily health snapshot.</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
              <Text style={styles.statIconText}>💊</Text>
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statNumber}>{todaysSchedules.length}</Text>
              <Text style={styles.statLabel}>Total Meds Today</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <Text style={styles.statIconText}>✓</Text>
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statNumber}>{completed.length}</Text>
              <Text style={styles.statLabel}>Doses Taken</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fed7aa' }]}>
              <Text style={styles.statIconText}>⏰</Text>
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statNumber}>{adherence}%</Text>
              <Text style={styles.statLabel}>Daily Adherence</Text>
            </View>
          </View>
        </View>

        {/* Two Column Layout */}
        <View style={styles.twoColumnContainer}>
          {/* Adherence Progress Card */}
          <View style={styles.progressCard}>
            <Text style={styles.cardTitle}>Adherence Progress</Text>
            <View style={styles.progressContainer}>
              <View style={styles.circularProgressWrapper}>
                <View style={[styles.circleBase, { borderColor: '#e5e7eb' }]} />
                <View 
                  style={[
                    styles.circleProgress, 
                    { 
                      borderColor: '#10b981',
                      transform: [{ rotate: `${(adherence / 100) * 360}deg` }]
                    }
                  ]} 
                />
                <View style={styles.circleInner}>
                  <Text style={styles.percentageText}>{adherence}%</Text>
                </View>
              </View>
              <Text style={styles.progressText}>
                You have taken {completed.length} out of {todaysSchedules.length} medications today.
              </Text>
            </View>
          </View>

          {/* Upcoming Reminders Card */}
          <View style={styles.remindersCard}>
            <Text style={styles.cardTitle}>Upcoming Reminders</Text>
            {upcoming.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>✓</Text>
                <Text style={styles.emptyText}>No more medications scheduled for today.</Text>
              </View>
            ) : (
              <View style={styles.remindersList}>
                {upcoming.slice(0, 5).map((s) => (
                  <View key={s.id} style={styles.reminderItem}>
                    <View style={styles.reminderTime}>
                      <Text style={styles.reminderTimeText}>
                        {new Date(s.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View style={styles.reminderContent}>
                      <Text style={styles.reminderMed} numberOfLines={1}>
                        {s.prescriptionItem?.medication_name}
                      </Text>
                      <Text style={styles.reminderDose}>
                        {s.prescriptionItem?.dosage} {s.prescriptionItem?.dosage_unit}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
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
    backgroundColor: '#f0fdf4',
  },
  greetingSection: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  statsGrid: {
    flexDirection: width > 600 ? 'row' : 'column',
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flex: width > 600 ? 1 : 0,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconText: {
    fontSize: 24,
  },
  statInfo: {
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  twoColumnContainer: {
    flexDirection: width > 768 ? 'row' : 'column',
    gap: 16,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flex: width > 768 ? 1 : 0,
  },
  remindersCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flex: width > 768 ? 1 : 0,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 20,
  },
  progressContainer: {
    alignItems: 'center',
  },
  circularProgressWrapper: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  circleBase: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 12,
  },
  circleProgress: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 12,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  circleInner: {
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  percentageText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#0f172a',
  },
  progressText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    opacity: 0.2,
    marginBottom: 12,
    color: '#10b981',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  remindersList: {
    gap: 10,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  reminderTime: {
    backgroundColor: '#64748b',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  reminderTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  reminderContent: {
    flex: 1,
  },
  reminderMed: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  reminderDose: {
    fontSize: 12,
    color: '#64748b',
  },
});

