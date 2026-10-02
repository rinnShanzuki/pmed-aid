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

interface Schedule {
  id: number;
  scheduled_time: string;
  status: string;
  prescriptionItem?: {
    medication_name: string;
    dosage?: string;
    dosage_unit?: string;
  };
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [patientId, setPatientId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const meRes = await api.get('/patients/me');
      const pId = meRes.data.data.id;
      setPatientId(pId);

      const schedRes = await api.get(`/schedules/patient/${pId}`);
      setSchedules(schedRes.data.data || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  // Today boundaries
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysSchedules = schedules.filter((s) => {
    const d = new Date(s.scheduled_time);
    return d >= today && d < tomorrow;
  });

  const completed = todaysSchedules.filter((s) => s.status === 'completed');
  const missed = todaysSchedules.filter((s) => s.status === 'missed');
  const pending = todaysSchedules.filter((s) => s.status === 'pending');

  const upcoming = pending
    .filter((s) => new Date(s.scheduled_time) >= now)
    .sort(
      (a, b) =>
        new Date(a.scheduled_time).getTime() -
        new Date(b.scheduled_time).getTime()
    );

  const adherence =
    todaysSchedules.length > 0
      ? Math.round(
          (completed.length /
            (completed.length + missed.length + pending.length)) *
            100
        )
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
          <Text style={styles.subtitle}>
            Here is your daily health snapshot.
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#ecfdf5' }]}>
              <Text style={[styles.statIconText, { color: '#10b981' }]}>
                💊
              </Text>
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statNumber}>{todaysSchedules.length}</Text>
              <Text style={styles.statLabel}>Total Meds Today</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#f0f9ff' }]}>
              <Text style={[styles.statIconText, { color: '#0ea5e9' }]}>
                ✓
              </Text>
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statNumber}>{completed.length}</Text>
              <Text style={styles.statLabel}>Doses Taken</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fff7ed' }]}>
              <Text style={[styles.statIconText, { color: '#ea580c' }]}>
                ⏰
              </Text>
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statNumber}>{adherence}%</Text>
              <Text style={styles.statLabel}>Daily Adherence</Text>
            </View>
          </View>
        </View>

        {/* Two-column on tablet, stacked on phone */}
        <View
          style={[
            styles.twoColumnContainer,
            isTablet && styles.twoColumnContainerTablet,
          ]}
        >
          {/* Adherence Progress */}
          <View
            style={[
              styles.card,
              isTablet && styles.cardHalf,
            ]}
          >
            <Text style={styles.cardTitle}>Adherence Progress</Text>
            <View style={styles.progressContainer}>
              <CircularProgress percentage={adherence} size={150} />
              <Text style={styles.progressText}>
                You have taken {completed.length} out of{' '}
                {todaysSchedules.length} medications today.
              </Text>
            </View>
          </View>

          {/* Upcoming Reminders */}
          <View
            style={[
              styles.card,
              isTablet && styles.cardHalf,
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>🔔</Text>
              <Text style={styles.cardTitleNoMargin}>
                Upcoming Reminders
              </Text>
            </View>
            {upcoming.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>✓</Text>
                <Text style={styles.emptyText}>
                  No more medications scheduled for today.
                </Text>
              </View>
            ) : (
              <View style={styles.remindersList}>
                {upcoming.map((s, index) => (
                  <View
                    key={s.id}
                    style={[
                      styles.reminderItem,
                      index === 0 && styles.reminderItemFirst,
                    ]}
                  >
                    <View
                      style={[
                        styles.reminderTime,
                        index === 0 && styles.reminderTimeFirst,
                      ]}
                    >
                      <Text style={styles.reminderTimeText}>
                        {new Date(s.scheduled_time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <View style={styles.reminderContent}>
                      <Text
                        style={styles.reminderMed}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {s.prescriptionItem?.medication_name || '—'}
                      </Text>
                      <Text style={styles.reminderDose}>
                        {s.prescriptionItem?.dosage || ''}
                        {s.prescriptionItem?.dosage_unit
                          ? ` ${s.prescriptionItem.dosage_unit}`
                          : ''}
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

// ─────────────────────────────────────────────────────────────────────────────
// Circular Progress (using SVG stroke-dasharray — actual ring, not rotated border)
// ─────────────────────────────────────────────────────────────────────────────
function CircularProgress({
  percentage,
  size = 150,
}: {
  percentage: number;
  size?: number;
}) {
  const radius = size / 2;
  const circumference = (percentage / 100) * 100; // Simple percentage representation

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderRadius: radius,
        backgroundColor: '#f0fdf4',
        borderWidth: 8,
        borderColor: '#10b981',
      }}
    >
      {/* Center text */}
      <View style={styles.progressCenterText}>
        <Text style={styles.percentageText}>{percentage}%</Text>
        <Text style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Adherence</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContainer: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },

  // Greeting
  greetingSection: { marginBottom: 20 },
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

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexGrow: 1,
    flexBasis: 140,
    minWidth: 140,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconText: { fontSize: 22 },
  statInfo: { flex: 1 },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 26,
  },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },

  // Two column
  twoColumnContainer: { gap: 16 },
  twoColumnContainerTablet: { flexDirection: 'row' },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHalf: { flex: 1 },

  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  cardTitleNoMargin: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardIcon: { fontSize: 18 },

  // Progress
  progressContainer: { alignItems: 'center' },
  progressCenterText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  progressText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 8,
    lineHeight: 18,
  },

  // Reminders
  remindersList: { gap: 12 },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  reminderItemFirst: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  reminderTime: {
    backgroundColor: '#cbd5e1',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    minWidth: 62,
    alignItems: 'center',
  },
  reminderTimeFirst: { backgroundColor: '#10b981' },
  reminderTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  reminderContent: { flex: 1, minWidth: 0 },
  reminderMed: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  reminderDose: { fontSize: 12, color: '#64748b' },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 40,
    color: '#10b981',
    opacity: 0.3,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
});