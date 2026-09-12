import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import ScreenTemplate from '../../components/ScreenTemplate';
import api from '../../services/api';

interface Schedule {
  id: number;
  scheduled_time: string;
  status: string;
  administered_at?: string;
  patient_id: number;
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
  administeredBy?: {
    first_name: string;
    last_name: string;
  };
}

export default function MedAdministration() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'completed' | 'missed'>('pending');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSchedules();
  }, [filter]);

  async function fetchSchedules() {
    try {
      setLoading(true);
      const { data } = await api.get('/schedules', { params: { status: filter } });
      setSchedules(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleAdminister(schedule: Schedule) {
    Alert.alert(
      'Administer Medication',
      `Confirm administering ${schedule.prescriptionItem?.medication_name} to ${schedule.patient?.first_name} ${schedule.patient?.last_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await api.post(`/schedules/${schedule.id}/administer`, {
                notes: 'Administered by nurse',
              });
              Alert.alert('Success', 'Medication administered successfully');
              fetchSchedules();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to administer');
            }
          },
        },
      ]
    );
  }

  const filtered = schedules.filter((s) => {
    if (!search) return true;
    const name = `${s.patient?.first_name} ${s.patient?.last_name}`.toLowerCase();
    const med = s.prescriptionItem?.medication_name?.toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || (med && med.includes(q));
  });

  const renderSchedule = ({ item }: { item: Schedule }) => {
    const schedTime = new Date(item.scheduled_time);

    return (
      <View style={styles.scheduleCard}>
        <View style={styles.timeSection}>
          <Text style={styles.timeText}>
            {schedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={styles.dateText}>{schedTime.toLocaleDateString()}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.patientName}>
            {item.patient?.first_name} {item.patient?.last_name}
          </Text>
          <Text style={styles.medName}>{item.prescriptionItem?.medication_name}</Text>
          <Text style={styles.dosage}>
            {item.prescriptionItem?.dosage} {item.prescriptionItem?.dosage_unit} —{' '}
            {item.prescriptionItem?.route?.replace('_', ' ')}
          </Text>

          {filter === 'completed' && item.administeredBy && (
            <Text style={styles.adminBy}>
              By: {item.administeredBy.first_name} {item.administeredBy.last_name}
            </Text>
          )}
        </View>

        <View style={styles.actionSection}>
          {filter === 'pending' ? (
            <TouchableOpacity style={styles.adminButton} onPress={() => handleAdminister(item)}>
              <Text style={styles.adminButtonText}>✓ Administer</Text>
            </TouchableOpacity>
          ) : (
            <View
              style={[
                styles.statusBadge,
                item.status === 'completed' ? styles.completedBadge : styles.missedBadge,
              ]}
            >
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScreenTemplate title="Med Administration">
      <TextInput
        style={styles.searchInput}
        placeholder="Search patient or medication..."
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'pending' && styles.filterActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'completed' && styles.filterActive]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'missed' && styles.filterActive]}
          onPress={() => setFilter('missed')}
        >
          <Text style={[styles.filterText, filter === 'missed' && styles.filterTextActive]}>
            Missed
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <Text style={styles.loadingText}>Loading schedules...</Text>
      ) : filtered.length === 0 ? (
        <Text style={styles.emptyText}>No {filter} medications found.</Text>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderSchedule}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSchedules(); }} />
          }
        />
      )}
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  filterActive: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
  },
  filterText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#0f172a',
    fontWeight: '600',
  },
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    gap: 12,
  },
  timeSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  dateText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  infoSection: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  medName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 2,
  },
  dosage: {
    fontSize: 12,
    color: '#64748b',
  },
  adminBy: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
  actionSection: {
    justifyContent: 'center',
  },
  adminButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  adminButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  loadingText: {
    color: '#64748b',
    textAlign: 'center',
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
  },
});

