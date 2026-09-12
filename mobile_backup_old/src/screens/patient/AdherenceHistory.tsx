import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
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
    dosage_unit: string;
  };
  administeredBy?: {
    first_name: string;
    last_name: string;
  };
}

export default function AdherenceHistory({ navigation }: any) {
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
      const allSchedules = schedRes.data.data || [];
      
      const history = allSchedules
        .filter((s: Schedule) => s.status === 'completed' || s.status === 'missed')
        .sort((a: Schedule, b: Schedule) => 
          new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime()
        );
      
      setSchedules(history);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const renderHistoryItem = ({ item }: { item: Schedule }) => {
    const isCompleted = item.status === 'completed';
    const schedTime = new Date(item.scheduled_time);

    return (
      <View style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <View>
            <Text style={styles.dateText}>
              {schedTime.toLocaleDateString()}
            </Text>
            <Text style={styles.timeText}>
              {schedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={[styles.statusBadge, isCompleted ? styles.completedBadge : styles.missedBadge]}>
            <Text style={styles.statusText}>
              {isCompleted ? '✓ Completed' : '✗ Missed'}
            </Text>
          </View>
        </View>

        <Text style={styles.medName}>{item.prescriptionItem?.medication_name}</Text>
        <Text style={styles.dosageText}>
          {item.prescriptionItem?.dosage} {item.prescriptionItem?.dosage_unit}
        </Text>

        {item.administered_at && (
          <View style={styles.adminInfo}>
            <Text style={styles.adminText}>
              Administered: {new Date(item.administered_at).toLocaleTimeString()}
            </Text>
            {item.administeredBy && (
              <Text style={styles.adminByText}>
                By {item.administeredBy.first_name} {item.administeredBy.last_name}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenTemplate title="Adherence History">
      {loading && !refreshing ? (
          <Text style={styles.loadingText}>Loading history...</Text>
        ) : schedules.length === 0 ? (
          <Text style={styles.emptyText}>No adherence history available.</Text>
        ) : (
          <FlatList
            data={schedules}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />
            }
          />
        )}
      </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  timeText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: '#10b981',
  },
  missedBadge: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  medName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  dosageText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  adminInfo: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  adminText: {
    fontSize: 12,
    color: '#64748b',
  },
  adminByText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  loadingText: {
    color: '#64748b',
  },
  emptyText: {
    color: '#64748b',
  },
});

