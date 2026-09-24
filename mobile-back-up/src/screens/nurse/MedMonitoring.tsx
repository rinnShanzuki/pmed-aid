import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export default function MedMonitoring() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overdueMeds, setOverdueMeds] = useState([]);
  const [dueSoonMeds, setDueSoonMeds] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/schedules');
      const schedules = response.data.data || [];
      
      const now = new Date();
      const soonThreshold = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      
      const overdue = schedules.filter((s: any) => {
        const scheduledTime = new Date(s.scheduled_time);
        return s.status === 'pending' && scheduledTime < now;
      });
      
      const dueSoon = schedules.filter((s: any) => {
        const scheduledTime = new Date(s.scheduled_time);
        return s.status === 'pending' && scheduledTime >= now && scheduledTime <= soonThreshold;
      });
      
      setOverdueMeds(overdue);
      setDueSoonMeds(dueSoon);
    } catch (err: any) {
      console.error('Med monitoring fetch error:', err);
      setOverdueMeds([]);
      setDueSoonMeds([]);
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
        {/* Nurse Badge */}
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

        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.iconCircle}>
            <Text style={styles.headerIcon}>📊</Text>
          </View>
          <Text style={styles.headerTitle}>Medication Monitoring</Text>
          <Text style={styles.headerSubtitle}>
            Real-time tracking of pending medications across the ward.
          </Text>
        </View>

        {/* Two Column Layout */}
        <View style={styles.cardsContainer}>
          {/* Overdue Medications Card */}
          <View style={[styles.card, styles.overdueCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>⚠️</Text>
              <Text style={styles.cardTitle}>Overdue Medications</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{overdueMeds.length}</Text>
            </View>
            
            <View style={styles.cardContent}>
              {overdueMeds.length === 0 ? (
                <>
                  <View style={styles.successIconContainer}>
                    <Text style={styles.successIcon}>✓</Text>
                  </View>
                  <Text style={styles.successMessage}>
                    No overdue medications! Great job.
                  </Text>
                </>
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

          {/* Due Soon Card */}
          <View style={[styles.card, styles.dueSoonCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>🕐</Text>
              <Text style={styles.cardTitle}>Due Soon</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{dueSoonMeds.length}</Text>
            </View>
            
            <View style={styles.cardContent}>
              {dueSoonMeds.length === 0 ? (
                <Text style={styles.emptyMessage}>
                  No medications due in the near future.
                </Text>
              ) : (
                <View style={styles.medicationList}>
                  {dueSoonMeds.map((med: any, index: number) => (
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
  headerSection: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  cardsContainer: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flex: 1,
    minWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderTopWidth: 4,
  },
  overdueCard: {
    borderTopColor: '#ef4444',
  },
  dueSoonCard: {
    borderTopColor: '#f59e0b',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  badge: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 32,
    color: '#10b981',
  },
  successMessage: {
    fontSize: 14,
    color: '#10b981',
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  medicationList: {
    width: '100%',
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
