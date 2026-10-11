import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

// ─── Types ──────────────────────────────────────────────────────
interface Schedule {
  id: number;
  scheduled_time: string;
  status: string;
  patient?: {
    first_name: string;
    last_name: string;
  };
  prescriptionItem?: {
    medication_name: string;
    dosage: string;
    dosage_unit: string;
    route: string;
  };
}

// ─── Main Component ─────────────────────────────────────────────
export default function MedMonitoring() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overdueMeds, setOverdueMeds] = useState<Schedule[]>([]);
  const [dueSoonMeds, setDueSoonMeds] = useState<Schedule[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/schedules');
      const schedules: Schedule[] = response.data.data || [];

      const now = new Date();
      const soonThreshold = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

      const overdue = schedules
        .filter((s: Schedule) => {
          const scheduledTime = new Date(s.scheduled_time);
          return s.status === 'pending' && scheduledTime < now;
        })
        .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime());

      const dueSoon = schedules
        .filter((s: Schedule) => {
          const scheduledTime = new Date(s.scheduled_time);
          return s.status === 'pending' && scheduledTime >= now && scheduledTime <= soonThreshold;
        })
        .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime());

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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Overdue Medications Card */}
          <View style={[styles.card, styles.overdueCard]}>
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.iconBg}>
                  <Text style={styles.icon}>⚠️</Text>
                </View>
                <Text style={styles.cardTitle}>Overdue Medications</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{overdueMeds.length}</Text>
              </View>
            </View>

            <View style={styles.cardContent}>
              {overdueMeds.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Text style={styles.emptyIconText}>✓</Text>
                  </View>
                  <Text style={styles.emptyTitle}>All Clear!</Text>
                  <Text style={styles.emptyMessage}>No overdue medications. Great job!</Text>
                </View>
              ) : (
                <View style={styles.medicationList}>
                  {overdueMeds.map((med: Schedule, index: number) => (
                    <View key={index} style={[styles.medicationItem, styles.overdueItem]}>
                      <View style={styles.itemHeader}>
                        <View style={styles.itemLeft}>
                          <Text style={styles.medicationName} numberOfLines={1}>
                            {med.prescriptionItem?.medication_name}
                          </Text>
                          <View style={styles.patientInfo}>
                            <Text style={styles.patientName} numberOfLines={1}>
                              {med.patient?.first_name} {med.patient?.last_name}
                            </Text>
                          </View>
                        </View>
                        <View style={[styles.timeBadge, styles.overdueTimeBadge]}>
                          <Text style={styles.timeBadgeText}>
                            {new Date(med.scheduled_time).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.itemDivider} />

                      <View style={styles.itemDetails}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Dosage:</Text>
                          <Text style={styles.detailValue}>
                            {med.prescriptionItem?.dosage} {med.prescriptionItem?.dosage_unit}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Route:</Text>
                          <Text style={styles.detailValue}>
                            {med.prescriptionItem?.route?.replace('_', ' ') || 'N/A'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Due Soon Medications Card */}
          <View style={[styles.card, styles.dueSoonCard]}>
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <View style={[styles.iconBg, styles.iconBgWarn]}>
                  <Text style={styles.icon}>🕐</Text>
                </View>
                <Text style={[styles.cardTitle, styles.cardTitleWarn]}>Due Soon</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{dueSoonMeds.length}</Text>
              </View>
            </View>

            <View style={styles.cardContent}>
              {dueSoonMeds.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={[styles.emptyIcon, styles.emptyIconNeutral]}>
                    <Text style={[styles.emptyIconText, styles.emptyIconTextNeutral]}>🕐</Text>
                  </View>
                  <Text style={[styles.emptyMessage, styles.emptyMessageNeutral]}>
                    No medications due in the near future.
                  </Text>
                </View>
              ) : (
                <View style={styles.medicationList}>
                  {dueSoonMeds.map((med: Schedule, index: number) => (
                    <View key={index} style={[styles.medicationItem, styles.dueSoonItem]}>
                      <View style={styles.itemHeader}>
                        <View style={styles.itemLeft}>
                          <Text style={styles.medicationName} numberOfLines={1}>
                            {med.prescriptionItem?.medication_name}
                          </Text>
                          <View style={styles.patientInfo}>
                            <Text style={styles.patientName} numberOfLines={1}>
                              {med.patient?.first_name} {med.patient?.last_name}
                            </Text>
                          </View>
                        </View>
                        <View style={[styles.timeBadge, styles.dueSoonTimeBadge]}>
                          <Text style={[styles.timeBadgeText, styles.dueSoonTimeBadgeText]}>
                            {new Date(med.scheduled_time).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.itemDivider} />

                      <View style={styles.itemDetails}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Dosage:</Text>
                          <Text style={styles.detailValue}>
                            {med.prescriptionItem?.dosage} {med.prescriptionItem?.dosage_unit}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Route:</Text>
                          <Text style={styles.detailValue}>
                            {med.prescriptionItem?.route?.replace('_', ' ') || 'N/A'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 40,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },

  // Card Styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  overdueCard: {
    borderTopColor: '#ef4444',
  },
  dueSoonCard: {
    borderTopColor: '#f59e0b',
  },

  // Card Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBgWarn: {
    backgroundColor: '#fef3c7',
  },
  icon: {
    fontSize: 18,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991b1b',
    flex: 1,
  },
  cardTitleWarn: {
    color: '#b45309',
  },
  badge: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },

  // Card Content
  cardContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fafafa',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    paddingVertical: 20,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyIconNeutral: {
    backgroundColor: '#f1f5f9',
  },
  emptyIconText: {
    fontSize: 32,
    color: '#10b981',
  },
  emptyIconTextNeutral: {
    color: '#64748b',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065f46',
    marginBottom: 6,
  },
  emptyMessage: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyMessageNeutral: {
    color: '#64748b',
  },

  // Medication List
  medicationList: {
    gap: 12,
  },
  medicationItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  overdueItem: {
    borderLeftColor: '#ef4444',
  },
  dueSoonItem: {
    borderLeftColor: '#f59e0b',
  },

  // Item Header
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  itemLeft: {
    flex: 1,
    marginRight: 10,
  },
  medicationName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  patientName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },

  // Time Badge
  timeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overdueTimeBadge: {
    backgroundColor: '#fee2e2',
  },
  dueSoonTimeBadge: {
    backgroundColor: '#fef3c7',
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
  dueSoonTimeBadgeText: {
    color: '#d97706',
  },

  // Item Divider
  itemDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },

  // Item Details
  itemDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  detailValue: {
    fontSize: 11,
    color: '#0f172a',
    fontWeight: '500',
  },
});
