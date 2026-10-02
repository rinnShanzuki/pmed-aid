import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import ScreenTemplate from '../../components/ScreenTemplate';
import api from '../../services/api';

interface Schedule {
  id: number;
  scheduled_time: string;
  status: string;
  prescriptionItem?: {
    medication_name: string;
    dosage: string;
    dosage_unit?: string;
    route?: string;
  };
}

export default function MedicationSchedule() {
  const { width } = useWindowDimensions();
  const isSmallPhone = width < 375;

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const meRes = await api.get('/patients/me');
      const pId = meRes.data.data.id;
      const schedRes = await api.get(`/schedules/patient/${pId}`);
      setSchedules(schedRes.data.data || []);
    } catch (err: any) {
      console.error('Error fetching schedules:', err);
      if (err.response?.status !== 401) {
        Alert.alert(
          'Error',
          err.response?.data?.message ||
            err.message ||
            'Failed to load schedules'
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    fetchData();
  }

  async function handleConfirm(id: number) {
    Alert.alert('Confirm', 'Did you take this medication just now?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes',
        onPress: async () => {
          try {
            await api.post(`/schedules/${id}/confirm`);
            fetchData();
          } catch (err: any) {
            Alert.alert(
              'Error',
              err.response?.data?.message || 'Failed to confirm'
            );
          }
        },
      },
    ]);
  }

  async function handleUnconfirm(id: number) {
    Alert.alert(
      'Cancel Confirmation',
      'Are you sure you want to cancel the confirmation?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await api.post(`/schedules/${id}/unconfirm`);
              fetchData();
            } catch (err: any) {
              Alert.alert(
                'Error',
                err.response?.data?.message || 'Failed to cancel'
              );
            }
          },
        },
      ]
    );
  }

  // Today's boundaries
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysSchedules = schedules.filter((s) => {
    const d = new Date(s.scheduled_time);
    return d >= today && d < tomorrow;
  });

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  function renderSchedule({ item }: { item: Schedule }) {
    const isCompleted = item.status === 'completed';
    const isMissed = item.status === 'missed';
    const isPending = item.status === 'pending';
    const schedTime = new Date(item.scheduled_time);
    const isOverdue = isPending && schedTime < new Date();

    // Card colors matching web
    const cardStyle = isCompleted
      ? styles.completedCard
      : isMissed
      ? styles.missedCard
      : isOverdue
      ? styles.overdueCard
      : styles.defaultCard;

    const timeBadgeStyle = isCompleted
      ? styles.badgeCompleted
      : isMissed
      ? styles.badgeMissed
      : isOverdue
      ? styles.badgeOverdue
      : styles.badgeDefault;

    return (
      <View style={[styles.scheduleCard, cardStyle]}>
        <View
          style={[
            styles.cardContent,
            isSmallPhone && styles.cardContentStacked,
          ]}
        >
          {/* Left: time + med info */}
          <View style={styles.scheduleLeft}>
            <View style={[styles.timeBadge, timeBadgeStyle]}>
              <Text style={styles.timeText}>
                {schedTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            <View style={styles.medInfo}>
              <Text style={styles.medName} numberOfLines={2}>
                {item.prescriptionItem?.medication_name || '—'}
              </Text>
              <Text style={styles.medDosage}>
                {item.prescriptionItem?.dosage || ''}
                {item.prescriptionItem?.dosage_unit
                  ? ` ${item.prescriptionItem.dosage_unit}`
                  : ''}
                {item.prescriptionItem?.route
                  ? ` — ${item.prescriptionItem.route.replace('_', ' ')}`
                  : ''}
              </Text>
              {isOverdue ? (
                <Text style={styles.overdueText}>Overdue</Text>
              ) : null}
            </View>
          </View>

          {/* Right: action */}
          <View
            style={[
              styles.scheduleRight,
              isSmallPhone && styles.scheduleRightStacked,
            ]}
          >
            {isCompleted ? (
              <View
                style={[
                  styles.actionColumn,
                  isSmallPhone && styles.actionColumnLeft,
                ]}
              >
                <View style={styles.takenRow}>
                  <Text style={styles.takenIcon}>✓</Text>
                  <Text style={styles.takenText}>Taken</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleUnconfirm(item.id)}
                  hitSlop={8}
                >
                  <Text style={styles.cancelLink}>
                    Cancel confirmation
                  </Text>
                </TouchableOpacity>
              </View>
            ) : isMissed ? (
              <View style={styles.missedRow}>
                <Text style={styles.missedIcon}>✗</Text>
                <Text style={styles.missedText}>Missed</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => handleConfirm(item.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>✓ Confirm Taken</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScreenTemplate title="Medication Schedule">
      <View style={styles.container}>
        {/* Section header card */}
        <View style={styles.sectionHeaderCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📅</Text>
            <Text style={styles.sectionTitle}>Daily Medication Schedule</Text>
          </View>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>

        {/* List / states */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading schedule...</Text>
          </View>
        ) : todaysSchedules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              You have no medications scheduled for today.
            </Text>
          </View>
        ) : (
          <FlatList
            data={todaysSchedules}
            renderItem={renderSchedule}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#3b82f6']}
                tintColor="#3b82f6"
              />
            }
          />
        )}
      </View>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  // Section header card
  sectionHeaderCard: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionIcon: { fontSize: 20, marginRight: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },

  dateText: {
    fontSize: 14,
    color: '#64748b',
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },

  // Schedule card
  scheduleCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  cardContentStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },

  // State variants
  defaultCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  completedCard: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  missedCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  overdueCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },

  // Left side
  scheduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  timeBadge: {
    width: 62,
    height: 62,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  badgeDefault: { backgroundColor: '#cbd5e1' },
  badgeCompleted: { backgroundColor: '#10b981' },
  badgeMissed: { backgroundColor: '#ef4444' },
  badgeOverdue: { backgroundColor: '#f59e0b' },
  timeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },

  medInfo: { flex: 1, minWidth: 0 },
  medName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  medDosage: {
    fontSize: 13,
    color: '#64748b',
  },
  overdueText: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '700',
    marginTop: 4,
  },

  // Right side
  scheduleRight: { alignItems: 'flex-end' },
  scheduleRightStacked: {
    alignItems: 'flex-start',
    marginTop: 4,
  },

  // Completed
  actionColumn: { alignItems: 'flex-end', gap: 4 },
  actionColumnLeft: { alignItems: 'flex-start' },
  takenRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  takenIcon: { color: '#10b981', fontWeight: '700', fontSize: 16 },
  takenText: { color: '#10b981', fontWeight: '700', fontSize: 14 },
  cancelLink: {
    color: '#64748b',
    fontSize: 12,
    textDecorationLine: 'underline',
  },

  // Missed
  missedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  missedIcon: { color: '#ef4444', fontWeight: '700', fontSize: 16 },
  missedText: { color: '#ef4444', fontWeight: '700', fontSize: 14 },

  // Confirm button
  confirmButton: {
    backgroundColor: '#10b981',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  // States
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: { marginTop: 12, color: '#64748b' },

  emptyContainer: {
    margin: 16,
    padding: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: 14,
  },
});