import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { StatCard, Card, Table, Badge } from '../../components';
import theme from '../../styles/theme';

export default function NurseDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);

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

  const myPatients = patients;

  // Get upcoming and missed medications
  const upcomingMeds = schedules
    .flatMap((p: any) =>
      p.schedules
        .filter((s: any) => s.status === 'pending')
        .map((s: any) => ({
          ...s,
          patient_name: p.patient_name,
          room: p.room_number,
        }))
    )
    .slice(0, 5);

  const missedMeds = schedules
    .flatMap((p: any) =>
      p.schedules
        .filter((s: any) => s.status === 'missed')
        .map((s: any) => ({
          ...s,
          patient_name: p.patient_name,
          room: p.room_number,
        }))
    )
    .slice(0, 5);

  const statCards = [
    {
      label: 'Assigned Patients',
      value: myPatients.length,
      iconBg: theme.colors.statCyan,
      iconColor: theme.colors.statCyanIcon,
      icon: '👥',
    },
    {
      label: 'Upcoming Meds',
      value: stats?.today?.pending || 0,
      iconBg: theme.colors.statGreen,
      iconColor: theme.colors.statGreenIcon,
      icon: '🕐',
    },
    {
      label: 'Missed Doses',
      value: stats?.overdue_count || 0,
      iconBg: theme.colors.statRed,
      iconColor: theme.colors.statRedIcon,
      icon: '⚠️',
    },
    {
      label: 'Completed Meds',
      value: stats?.today?.completed || 0,
      iconBg: theme.colors.statBlue,
      iconColor: theme.colors.statBlueIcon,
      icon: '💊',
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome, {user?.first_name}</Text>
          <Text style={styles.subtitle}>Here's your nursing overview for today.</Text>
        </View>

        {/* Stats Grid - Matching Web Layout */}
        <View style={styles.statsGrid}>
          {statCards.map((card, index) => (
            <StatCard
              key={index}
              label={card.label}
              value={card.value}
              icon={<Text style={styles.statIcon}>{card.icon}</Text>}
              iconBg={card.iconBg}
              iconColor={card.iconColor}
              style={styles.statCardItem}
            />
          ))}
        </View>

        {/* Assigned Patients - Full Width */}
        <Card>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Assigned Patients</Text>
          </View>
          {myPatients.length === 0 ? (
            <Text style={styles.emptyText}>No assigned patients currently.</Text>
          ) : (
            <Table
              columns={[
                {
                  header: 'Patient',
                  key: 'patient',
                  width: 180,
                  render: (val: any) => (
                    <Text style={styles.patientName}>
                      {val?.first_name} {val?.last_name}
                    </Text>
                  ),
                },
                {
                  header: 'Room',
                  key: 'room',
                  width: 100,
                  render: (val: any) => (
                    <Text style={styles.dataText}>{val?.room_number || 'N/A'}</Text>
                  ),
                },
                {
                  header: 'Admission Date',
                  key: 'admission_date',
                  width: 140,
                  render: (val: any) => (
                    <Text style={styles.dateText}>
                      {new Date(val).toLocaleDateString()}
                    </Text>
                  ),
                },
                {
                  header: 'Attending Doctor',
                  key: 'doctor',
                  width: 150,
                  render: (val: any) => (
                    <Text style={styles.dataText}>
                      {val ? `Dr. ${val.last_name}` : 'N/A'}
                    </Text>
                  ),
                },
              ]}
              data={myPatients.slice(0, 5)}
            />
          )}
        </Card>

        {/* Two Column Layout for Medications */}
        <View style={styles.twoColumnGrid}>
          {/* Upcoming Medications */}
          <Card style={styles.medCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🕐</Text>
              <Text style={styles.sectionTitle}>Upcoming Medications</Text>
            </View>
            {upcomingMeds.length === 0 ? (
              <Text style={styles.emptyText}>No upcoming medications.</Text>
            ) : (
              <View style={styles.medList}>
                {upcomingMeds.map((med: any, index: number) => (
                  <View key={index} style={styles.medItem}>
                    <View style={styles.medInfo}>
                      <Text style={styles.medPatient}>{med.patient_name}</Text>
                      <Text style={styles.medDetails}>
                        {med.medication_name} — {med.dosage}
                      </Text>
                      <Text style={styles.medTime}>
                        {new Date(med.scheduled_time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        · Room {med.room}
                      </Text>
                    </View>
                    <Badge variant="pending">Pending</Badge>
                  </View>
                ))}
              </View>
            )}
          </Card>

          {/* Missed Medications - Alert Style */}
          <Card style={[styles.medCard, styles.alertCard] as any}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>⚠️</Text>
              <Text style={[styles.sectionTitle, styles.alertTitle]}>Missed Medications</Text>
            </View>
            {missedMeds.length === 0 ? (
              <Text style={styles.emptyText}>No missed medications.</Text>
            ) : (
              <View style={styles.medList}>
                {missedMeds.map((med: any, index: number) => (
                  <View key={index} style={styles.medItem}>
                    <View style={styles.medInfo}>
                      <Text style={styles.medPatient}>{med.patient_name}</Text>
                      <Text style={styles.medDetails}>
                        {med.medication_name} — {med.dosage}
                      </Text>
                      <Text style={styles.medTime}>
                        {new Date(med.scheduled_time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        · Room {med.room}
                      </Text>
                    </View>
                    <Badge variant="inactive">Missed</Badge>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgSecondary,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing['4xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.bgSecondary,
  },
  header: {
    marginBottom: theme.spacing['2xl'],
  },
  greeting: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xl,
    marginBottom: 28,
  },
  statCardItem: {
    flex: 1,
    minWidth: 220,
  },
  statIcon: {
    fontSize: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  alertTitle: {
    color: theme.colors.error,
  },
  emptyText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  patientName: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  dataText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.slate700,
  },
  dateText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  twoColumnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing['2xl'],
  },
  medCard: {
    flex: 1,
    minWidth: 300,
  },
  alertCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  medList: {
    gap: theme.spacing.md,
  },
  medItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.bgTertiary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  medInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  medPatient: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  medDetails: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.slate700,
    marginBottom: 2,
  },
  medTime: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
});
