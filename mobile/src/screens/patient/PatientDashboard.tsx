import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useResponsive } from '../../hooks/useResponsive';
import { useOrientation } from '../../hooks/useOrientation';
import { ResponsiveContainer, ResponsiveTwoColumn } from '../../components/ResponsiveContainer';
import { createResponsiveStyles } from '../../utils/responsiveStyles';
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
  const responsive = useResponsive();
  const responsiveStyles = createResponsiveStyles(responsive);
  const { width, isLandscape } = useOrientation();

  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [patientId, setPatientId] = useState<number | null>(null);

  // In landscape on mobile phones, stack vertically
  // Only show side-by-side if it's a tablet (width >= 768)
  const showTwoColumn = !isLandscape || width >= 768;

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
      <View style={responsiveStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <ResponsiveContainer scrollable>
      {/* Greeting */}
      <View style={[dashboardStyles.greetingSection, { marginBottom: isLandscape ? responsive.spacing.sm : responsive.spacing.lg }]}>
        <Text style={[responsiveStyles.heading1, { marginBottom: responsive.spacing.xs, fontSize: isLandscape ? 24 : 32 }]}>
          Hello, {user?.first_name}
        </Text>
        <Text style={[responsiveStyles.bodyRegular, { fontSize: isLandscape ? 13 : 15 }]}>
          Here is your daily health snapshot.
        </Text>
      </View>

      {/* Stats Cards - Responsive grid */}
      <View style={[
        dashboardStyles.statsGrid,
        {
          gap: isLandscape ? responsive.spacing.xs : responsive.spacing.md,
          marginBottom: isLandscape ? responsive.spacing.sm : responsive.spacing.lg,
          flexDirection: isLandscape ? 'column' : 'row',
        },
      ]}>
        <View style={[responsiveStyles.card, dashboardStyles.statCard, isLandscape && dashboardStyles.statCardLandscape]}>
          <View style={[dashboardStyles.statIcon, { backgroundColor: '#ecfdf5' }]}>
            <Text style={[dashboardStyles.statIconText, { color: '#10b981' }]}>
              💊
            </Text>
          </View>
          <View style={dashboardStyles.statInfo}>
            <Text style={dashboardStyles.statNumber}>{todaysSchedules.length}</Text>
            <Text style={dashboardStyles.statLabel}>Total Meds Today</Text>
          </View>
        </View>

        <View style={[responsiveStyles.card, dashboardStyles.statCard, isLandscape && dashboardStyles.statCardLandscape]}>
          <View style={[dashboardStyles.statIcon, { backgroundColor: '#f0f9ff' }]}>
            <Text style={[dashboardStyles.statIconText, { color: '#0ea5e9' }]}>
              ✓
            </Text>
          </View>
          <View style={dashboardStyles.statInfo}>
            <Text style={dashboardStyles.statNumber}>{completed.length}</Text>
            <Text style={dashboardStyles.statLabel}>Doses Taken</Text>
          </View>
        </View>

        <View style={[responsiveStyles.card, dashboardStyles.statCard, isLandscape && dashboardStyles.statCardLandscape]}>
          <View style={[dashboardStyles.statIcon, { backgroundColor: '#fff7ed' }]}>
            <Text style={[dashboardStyles.statIconText, { color: '#ea580c' }]}>
              ⏰
            </Text>
          </View>
          <View style={dashboardStyles.statInfo}>
            <Text style={dashboardStyles.statNumber}>{adherence}%</Text>
            <Text style={dashboardStyles.statLabel}>Daily Adherence</Text>
          </View>
        </View>
      </View>

      {/* Layout based on orientation and device type */}
      {showTwoColumn ? (
        <ResponsiveTwoColumn
          left={
            <View style={[responsiveStyles.card, { paddingVertical: isLandscape ? responsive.spacing.md : responsive.spacing.lg }]}>
              <Text style={[responsiveStyles.heading3, { marginBottom: isLandscape ? responsive.spacing.sm : responsive.spacing.md, fontSize: isLandscape ? 16 : 18 }]}>
                Adherence Progress
              </Text>
              <View style={dashboardStyles.progressContainer}>
                <CircularProgress 
                  percentage={adherence} 
                  size={isLandscape ? 100 : Math.min(150, responsive.width * 0.4)} 
                />
                <Text style={[responsiveStyles.bodySmall, dashboardStyles.progressText, { fontSize: isLandscape ? 12 : 14 }]}>
                  You have taken {completed.length} out of {todaysSchedules.length} medications today.
                </Text>
              </View>
            </View>
          }
          right={
            <View style={responsiveStyles.card}>
              <View style={dashboardStyles.cardHeader}>
                <Text style={dashboardStyles.cardIcon}>🔔</Text>
                <Text style={[responsiveStyles.heading3, dashboardStyles.cardTitleNoMargin, { fontSize: isLandscape ? 16 : 18 }]}>
                  Upcoming Reminders
                </Text>
              </View>
              {upcoming.length === 0 ? (
                <View style={dashboardStyles.emptyState}>
                  <Text style={dashboardStyles.emptyIcon}>✓</Text>
                  <Text style={[responsiveStyles.bodySmall, { fontSize: isLandscape ? 12 : 14 }]}>
                    No more medications scheduled for today.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: isLandscape ? responsive.spacing.xs : responsive.spacing.sm }}>
                  {upcoming.map((s, index) => (
                    <View
                      key={s.id}
                      style={[
                        dashboardStyles.reminderItem,
                        { padding: isLandscape ? 10 : responsive.spacing.md, gap: responsive.spacing.sm },
                        index === 0 && dashboardStyles.reminderItemFirst,
                      ]}
                    >
                      <View
                        style={[
                          dashboardStyles.reminderTime,
                          { minWidth: isLandscape ? 50 : 62, paddingVertical: responsive.spacing.xs, paddingHorizontal: responsive.spacing.sm },
                          index === 0 && dashboardStyles.reminderTimeFirst,
                        ]}
                      >
                        <Text style={[dashboardStyles.reminderTimeText, { fontSize: isLandscape ? 10 : 11 }]}>
                          {new Date(s.scheduled_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={[dashboardStyles.reminderMed, { fontSize: isLandscape ? 13 : 15 }]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {s.prescriptionItem?.medication_name || '—'}
                        </Text>
                        <Text style={[responsiveStyles.bodySmall, { fontSize: isLandscape ? 11 : 13 }]}>
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
          }
          gap={isLandscape ? responsive.spacing.sm : responsive.spacing.lg}
        />
      ) : (
        // Stack vertically in landscape mobile
        <>
          <View style={[responsiveStyles.card, { paddingVertical: responsive.spacing.md, marginBottom: responsive.spacing.sm }]}>
            <Text style={[responsiveStyles.heading3, { marginBottom: responsive.spacing.sm, fontSize: 16 }]}>
              Adherence Progress
            </Text>
            <View style={dashboardStyles.progressContainer}>
              <CircularProgress percentage={adherence} size={100} />
              <Text style={[responsiveStyles.bodySmall, dashboardStyles.progressText, { fontSize: 12 }]}>
                You have taken {completed.length} out of {todaysSchedules.length} medications today.
              </Text>
            </View>
          </View>

          <View style={responsiveStyles.card}>
            <View style={dashboardStyles.cardHeader}>
              <Text style={dashboardStyles.cardIcon}>🔔</Text>
              <Text style={[responsiveStyles.heading3, dashboardStyles.cardTitleNoMargin, { fontSize: 16 }]}>
                Upcoming Reminders
              </Text>
            </View>
            {upcoming.length === 0 ? (
              <View style={dashboardStyles.emptyState}>
                <Text style={dashboardStyles.emptyIcon}>✓</Text>
                <Text style={[responsiveStyles.bodySmall, { fontSize: 12 }]}>
                  No more medications scheduled for today.
                </Text>
              </View>
            ) : (
              <View style={{ gap: responsive.spacing.xs, maxHeight: 150 }}>
                {upcoming.slice(0, 3).map((s, index) => (
                  <View
                    key={s.id}
                    style={[
                      dashboardStyles.reminderItem,
                      { padding: 10, gap: responsive.spacing.sm },
                      index === 0 && dashboardStyles.reminderItemFirst,
                    ]}
                  >
                    <View
                      style={[
                        dashboardStyles.reminderTime,
                        { minWidth: 50, paddingVertical: responsive.spacing.xs, paddingHorizontal: responsive.spacing.sm },
                        index === 0 && dashboardStyles.reminderTimeFirst,
                      ]}
                    >
                      <Text style={[dashboardStyles.reminderTimeText, { fontSize: 10 }]}>
                        {new Date(s.scheduled_time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={[dashboardStyles.reminderMed, { fontSize: 13 }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {s.prescriptionItem?.medication_name || '—'}
                      </Text>
                      <Text style={[responsiveStyles.bodySmall, { fontSize: 11 }]}>
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
        </>
      )}
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Circular Progress Component
// ─────────────────────────────────────────────────────────────────────────────
function CircularProgress({
  percentage,
  size = 150,
}: {
  percentage: number;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderRadius: size / 2,
        backgroundColor: '#f0fdf4',
        borderWidth: 8,
        borderColor: '#10b981',
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={dashboardStyles.percentageText}>{percentage}%</Text>
        <Text style={dashboardStyles.adherenceLabel}>Adherence</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const dashboardStyles = StyleSheet.create({
  greetingSection: {},

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 150,
  },
  statCardLandscape: {
    flex: 0,
    minWidth: 'auto',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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

  // Card
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardIcon: { fontSize: 18 },
  cardTitleNoMargin: {
    marginBottom: 0,
  },

  // Progress
  progressContainer: { alignItems: 'center' },
  percentageText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  adherenceLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  progressText: {
    textAlign: 'center',
    paddingHorizontal: 8,
    lineHeight: 18,
    marginTop: 12,
  },

  // Reminders
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reminderItemFirst: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  reminderTime: {
    backgroundColor: '#cbd5e1',
    borderRadius: 8,
    minWidth: 62,
    alignItems: 'center',
    marginRight: 12,
  },
  reminderTimeFirst: { backgroundColor: '#10b981' },
  reminderTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  reminderMed: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },

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
});