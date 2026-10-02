import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import ScreenTemplate from '../../components/ScreenTemplate';
import api from '../../services/api';

interface Schedule {
  id: number;
  scheduled_time: string;
  status: string;
  administered_at?: string;
  prescriptionItem?: {
    medication_name: string;
    dosage: string;
    dosage_unit?: string;
  };
  administeredBy?: {
    first_name: string;
    last_name: string;
  };
}

export default function AdherenceHistory() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fixed column widths (total = 720px for horizontal scroll)
  const TABLE_WIDTH = 720;
  const COL_DATETIME = 150;
  const COL_MED = 180;
  const COL_DOSAGE = 130;
  const COL_STATUS = 130;
  const COL_ADMIN = 130;

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const meRes = await api.get('/patients/me');
      const pId = meRes.data.data.id;

      const schedRes = await api.get(`/schedules/patient/${pId}`);
      const allSchedules = schedRes.data.data || [];

      const history = allSchedules
        .filter(
          (s: Schedule) =>
            s.status === 'completed' || s.status === 'missed'
        )
        .sort(
          (a: Schedule, b: Schedule) =>
            new Date(b.scheduled_time).getTime() -
            new Date(a.scheduled_time).getTime()
        );

      setSchedules(history);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    fetchData();
  }

  return (
    <ScreenTemplate title="Adherence History">
      <View style={styles.container}>
        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>📈</Text>
          <Text style={styles.sectionTitle}>Adherence History</Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : schedules.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No adherence history available.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.tableScrollWrapper}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#3b82f6']}
                tintColor="#3b82f6"
              />
            }
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator
              nestedScrollEnabled
            >
              <View style={{ width: TABLE_WIDTH }}>
                {/* Table header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, { width: COL_DATETIME }]}>
                    Date & Time
                  </Text>
                  <Text style={[styles.th, { width: COL_MED }]}>
                    Medication
                  </Text>
                  <Text style={[styles.th, { width: COL_DOSAGE }]}>
                    Dosage
                  </Text>
                  <Text style={[styles.th, { width: COL_STATUS }]}>
                    Status
                  </Text>
                  <Text style={[styles.th, { width: COL_ADMIN }]}>
                    Administered At
                  </Text>
                </View>

                {/* Table rows */}
                {schedules.map((s, idx) => {
                  const isCompleted = s.status === 'completed';
                  const schedDate = new Date(s.scheduled_time);

                  return (
                    <View
                      key={s.id}
                      style={[
                        styles.tableRow,
                        idx % 2 === 0 && styles.tableRowEven,
                      ]}
                    >
                      {/* Date & Time */}
                      <View style={{ width: COL_DATETIME }}>
                        <Text style={styles.dateText}>
                          {schedDate.toLocaleDateString()}
                        </Text>
                        <Text style={styles.timeText}>
                          {schedDate.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>

                      {/* Medication */}
                      <Text
                        style={[styles.tdMed, { width: COL_MED }]}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {s.prescriptionItem?.medication_name || '—'}
                      </Text>

                      {/* Dosage */}
                      <Text
                        style={[styles.tdMuted, { width: COL_DOSAGE }]}
                        numberOfLines={1}
                      >
                        {s.prescriptionItem?.dosage || '—'}
                        {s.prescriptionItem?.dosage_unit
                          ? ` ${s.prescriptionItem.dosage_unit}`
                          : ''}
                      </Text>

                      {/* Status */}
                      <View style={{ width: COL_STATUS }}>
                        <View
                          style={[
                            styles.badge,
                            isCompleted
                              ? styles.badgeCompleted
                              : styles.badgeMissed,
                          ]}
                        >
                          <Text style={styles.badgeIcon}>
                            {isCompleted ? '✓' : '✗'}
                          </Text>
                          <Text style={styles.badgeText}>
                            {isCompleted ? 'Completed' : 'Missed'}
                          </Text>
                        </View>
                      </View>

                      {/* Administered At */}
                      <View style={{ width: COL_ADMIN }}>
                        <Text style={styles.tdMutedSmall}>
                          {s.administered_at
                            ? new Date(s.administered_at).toLocaleTimeString(
                                [],
                                { hour: '2-digit', minute: '2-digit' }
                              )
                            : '--'}
                        </Text>
                        {s.administeredBy ? (
                          <Text style={styles.adminByText} numberOfLines={1}>
                            By {s.administeredBy.first_name}{' '}
                            {s.administeredBy.last_name}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            {!isTablet ? (
              <Text style={styles.scrollHint}>
                ← Swipe to see more →
              </Text>
            ) : null}
          </ScrollView>
        )}
      </View>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  sectionIcon: { fontSize: 20, marginRight: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },

  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748b' },

  emptyState: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center' },

  // Table
  tableScrollWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  th: {
    fontSize: 11,
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
    backgroundColor: '#fff',
  },
  tableRowEven: { backgroundColor: '#fafbfc' },

  dateText: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  timeText: { fontSize: 12, color: '#64748b', marginTop: 2 },

  tdMed: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  tdMuted: { fontSize: 13, color: '#64748b' },
  tdMutedSmall: { fontSize: 12, color: '#64748b' },

  adminByText: { fontSize: 11, color: '#94a3b8', marginTop: 2 },

  // Badges
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeCompleted: { backgroundColor: '#10b981' },
  badgeMissed: { backgroundColor: '#ef4444' },
  badgeIcon: { color: '#fff', fontSize: 11, fontWeight: '700' },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  scrollHint: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 8,
    fontStyle: 'italic',
  },
});