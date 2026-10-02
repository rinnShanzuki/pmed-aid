import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import theme from '../../styles/theme';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);

  // Responsive breakpoints
  const isTablet = width >= 768;
  const isSmallPhone = width < 375;
  const isLargeTablet = width >= 1024;
  
  // Adaptive stat cards - show 2 on tablet, 1 on phone, 4 on large screens
  const getStatCardWidth = () => {
    if (isLargeTablet) {
      return '23%';
    } else if (isTablet) {
      return '48%';
    }
    return '100%';
  };
  
  // Adaptive table columns - flexible sizing
  const adaptiveTableWidth = Math.min(width - 32, 700);
  const adaptiveColPatient = Math.floor(adaptiveTableWidth * 0.35);
  const adaptiveColRoom = Math.floor(adaptiveTableWidth * 0.18);
  const adaptiveColAdmitted = Math.floor(adaptiveTableWidth * 0.25);
  const adaptiveColStatus = Math.floor(adaptiveTableWidth * 0.22);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewRes, admissionsRes, medStatusRes] = await Promise.all([
        api.get('/dashboard/overview'),
        api.get('/admissions', { params: { status: 'admitted' } }),
        api.get('/dashboard/medication-status'),
      ]);

      setStats(overviewRes.data.data);
      setPatients(admissionsRes.data.data || []);
      setSchedules(medStatusRes.data.data || []);
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const myPatients = patients.filter(
    (a) => String(a.attending_doctor_id) === String(user?.id)
  );

  const statCards = [
    {
      label: "Today's Patients",
      value: myPatients.length,
      bg: '#eff6ff',
      color: '#3b82f6',
    },
    {
      label: 'Active Admissions',
      value: stats?.active_admissions || 0,
      bg: '#f0fdf4',
      color: '#22c55e',
    },
    {
      label: 'Active Prescriptions',
      value: stats?.active_prescriptions || 0,
      bg: '#fdf4ff',
      color: '#a855f7',
    },
    {
      label: 'Overdue Medications',
      value: stats?.overdue_count || 0,
      bg: '#fff7ed',
      color: '#f97316',
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.contentContainer,
          isSmallPhone && styles.contentContainerSmall,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, isSmallPhone && styles.greetingSmall]}>
            Welcome, {user?.last_name}
          </Text>
          <Text style={styles.subtitle}>Here's your overview for today.</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {statCards.map((c) => (
            <View
              key={c.label}
              style={[
                styles.statCard,
                { width: getStatCardWidth() },
                isSmallPhone && styles.statCardSmall,
              ]}
            >
              <View style={[styles.statIcon, { backgroundColor: c.bg, borderLeftWidth: 4, borderLeftColor: c.color }]}>
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{c.value}</Text>
                <Text
                  style={styles.statLabel}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {c.label}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* My Patients Today */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Patients Today</Text>
          </View>

          {myPatients.length === 0 ? (
            <Text style={styles.emptyText}>
              No patients assigned to you today.
            </Text>
          ) : (
            <View style={styles.tableWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator
                contentContainerStyle={{ minWidth: adaptiveTableWidth }}
              >
                <View style={{ width: adaptiveTableWidth }}>
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <Text
                      style={[
                        styles.tableHeaderText,
                        { width: adaptiveColPatient },
                      ]}
                    >
                      Patient
                    </Text>
                    <Text
                      style={[styles.tableHeaderText, { width: adaptiveColRoom }]}
                    >
                      Room
                    </Text>
                    <Text
                      style={[styles.tableHeaderText, { width: adaptiveColAdmitted }]}
                    >
                      Admitted
                    </Text>
                    <Text
                      style={[styles.tableHeaderText, { width: adaptiveColStatus }]}
                    >
                      Status
                    </Text>
                  </View>

                  {/* Table Rows */}
                  {myPatients.slice(0, 10).map((a, index) => (
                    <View
                      key={a.id}
                      style={[
                        styles.tableRow,
                        index % 2 === 0 && styles.tableRowEven,
                      ]}
                    >
                      <View style={{ width: adaptiveColPatient, paddingRight: 8 }}>
                        <Text style={styles.patientName} numberOfLines={1}>
                          {a.patient?.first_name} {a.patient?.last_name}
                        </Text>
                      </View>
                      <Text
                        style={[styles.dataText, { width: adaptiveColRoom }]}
                        numberOfLines={1}
                      >
                        {a.room?.room_number || 'N/A'}
                      </Text>
                      <Text
                        style={[styles.dateText, { width: adaptiveColAdmitted }]}
                        numberOfLines={1}
                      >
                        {new Date(a.admission_date).toLocaleDateString()}
                      </Text>
                      <View style={{ width: adaptiveColStatus }}>
                        <View style={styles.badgeActive}>
                          <Text style={styles.badgeActiveText}>
                            {a.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* Hint that table is scrollable (only on phones) */}
              {!isTablet && (
                <Text style={styles.scrollHint}>← Swipe to see more →</Text>
              )}
            </View>
          )}
        </View>

        {/* Today's Medication Schedule */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Medication Schedule</Text>
          </View>
          {schedules.length === 0 ? (
            <Text style={styles.emptyText}>No medication schedules today.</Text>
          ) : (
            <View style={styles.schedulesContainer}>
              {schedules.slice(0, 5).map((p: any) => (
                <View key={p.patient_id} style={styles.scheduleCard}>
                  <View style={styles.scheduleHeader}>
                    <Text style={styles.patientName} numberOfLines={1}>
                      {p.patient_name}
                    </Text>
                    <Text style={styles.roomText}>Room {p.room_number}</Text>
                  </View>
                  {p.schedules.slice(0, 3).map((s: any) => (
                    <View key={s.id} style={styles.scheduleItem}>
                      <Text style={styles.medicationText} numberOfLines={1}>
                        {s.medication_name} — {s.dosage}
                      </Text>
                      <View
                        style={[
                          styles.badge,
                          s.status === 'completed' && styles.badgeActive,
                          s.status === 'missed' && styles.badgeInactive,
                          s.status === 'pending' && styles.badgePending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            s.status === 'completed' &&
                              styles.badgeActiveText,
                            s.status === 'missed' &&
                              styles.badgeInactiveText,
                            s.status === 'pending' &&
                              styles.badgePendingText,
                          ]}
                        >
                          {s.status}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
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
    padding: 24,
    paddingBottom: 40,
  },
  contentContainerSmall: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },

  // Header
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  greetingSmall: {
    fontSize: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statCardSmall: {
    padding: 12,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },

  // Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 24,
  },

  // Table (horizontal scroll)
  tableWrapper: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  tableRowEven: {
    backgroundColor: '#fafbfc',
  },
  patientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  dataText: {
    fontSize: 14,
    color: '#334155',
  },
  dateText: {
    fontSize: 13,
    color: '#64748b',
  },
  scrollHint: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 8,
    fontStyle: 'italic',
  },

  // Badges
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeActive: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeActiveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16a34a',
    textTransform: 'capitalize',
  },
  badgeInactive: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeInactiveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#dc2626',
    textTransform: 'capitalize',
  },
  badgePending: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgePendingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#d97706',
    textTransform: 'capitalize',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Schedules
  schedulesContainer: {
    gap: 12,
  },
  scheduleCard: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  roomText: {
    fontSize: 12,
    color: '#64748b',
    flexShrink: 0,
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  medicationText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
});