import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import ScreenTemplate from '../../components/ScreenTemplate';
import api from '../../services/api';

interface Schedule {
  id: number;
  scheduled_time: string;
  status: string;
  prescriptionItem?: {
    medication_name: string;
    dosage: string;
    dosage_unit: string;
    route: string;
  };
}

export default function MedicationSchedule({ navigation }: any) {
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
      // 401 errors are handled automatically by the API interceptor
      if (err.response?.status !== 401) {
        const message = err.response?.data?.message || err.message || 'Failed to load schedules';
        Alert.alert('Error', message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleConfirm(id: number) {
    Alert.alert(
      'Confirm',
      'Did you take this medication just now?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await api.post(`/schedules/${id}/confirm`);
              fetchData();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to confirm');
            }
          },
        },
      ]
    );
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
              Alert.alert('Error', err.response?.data?.message || 'Failed to cancel');
            }
          },
        },
      ]
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysSchedules = schedules.filter((s) => {
    const d = new Date(s.scheduled_time);
    return d >= today && d < tomorrow;
  });

  const renderSchedule = ({ item }: { item: Schedule }) => {
    const isCompleted = item.status === 'completed';
    const isMissed = item.status === 'missed';
    const isPending = item.status === 'pending';
    const schedTime = new Date(item.scheduled_time);
    const isOverdue = isPending && schedTime < new Date();

    return (
      <View
        style={[
          styles.scheduleCard,
          isCompleted && styles.completedCard,
          isMissed && styles.missedCard,
          isOverdue && styles.overdueCard,
        ]}
      >
        <View style={styles.scheduleLeft}>
          <View
            style={[
              styles.timeBadge,
              isCompleted && styles.completedBadge,
              isMissed && styles.missedBadge,
              isOverdue && styles.overdueBadge,
            ]}
          >
            <Text style={styles.timeText}>
              {schedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.medInfo}>
            <Text style={styles.medName}>{item.prescriptionItem?.medication_name}</Text>
            <Text style={styles.medDosage}>
              {item.prescriptionItem?.dosage} {item.prescriptionItem?.dosage_unit} —{' '}
              {item.prescriptionItem?.route?.replace('_', ' ')}
            </Text>
            {isOverdue && <Text style={styles.overdueText}>Overdue</Text>}
          </View>
        </View>

        <View style={styles.scheduleRight}>
          {isCompleted ? (
            <View>
              <Text style={styles.takenText}>✓ Taken</Text>
              <TouchableOpacity onPress={() => handleUnconfirm(item.id)}>
                <Text style={styles.cancelLink}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : isMissed ? (
            <Text style={styles.missedText}>✗ Missed</Text>
          ) : (
            <TouchableOpacity style={styles.confirmButton} onPress={() => handleConfirm(item.id)}>
              <Text style={styles.confirmButtonText}>✓ Confirm</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScreenTemplate title="Medication Schedule">
      <Text style={styles.dateText}>
          {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        {loading && !refreshing ? (
          <Text style={styles.emptyText}>Loading schedule...</Text>
        ) : todaysSchedules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No medications scheduled for today</Text>
          </View>
        ) : (
          <FlatList
            data={todaysSchedules}
            renderItem={renderSchedule}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
          />
        )}
      </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  dateText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
  },
  scheduleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
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
  scheduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeBadge: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  completedBadge: {
    backgroundColor: '#10b981',
  },
  missedBadge: {
    backgroundColor: '#ef4444',
  },
  overdueBadge: {
    backgroundColor: '#f59e0b',
  },
  timeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  medDosage: {
    fontSize: 14,
    color: '#64748b',
  },
  overdueText: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '600',
    marginTop: 4,
  },
  scheduleRight: {
    alignItems: 'flex-end',
  },
  takenText: {
    color: '#10b981',
    fontWeight: '600',
    marginBottom: 4,
  },
  cancelLink: {
    color: '#64748b',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  missedText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
  },
});

