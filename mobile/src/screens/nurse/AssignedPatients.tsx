import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, RefreshControl } from 'react-native';
import ScreenTemplate from '../../components/ScreenTemplate';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

interface Admission {
  id: number;
  admission_date: string;
  status: string;
  patient?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  room?: {
    room_number: string;
    type: string;
  };
  doctor?: {
    last_name: string;
  };
}

export default function AssignedPatients() {
  const { user } = useAuth();
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) fetchAdmissions();
  }, [search, user]);

  async function fetchAdmissions() {
    try {
      setLoading(true);
      const { data } = await api.get('/admissions', {
        params: { status: 'admitted', search, assigned_nurse_id: user?.id },
      });
      setAdmissions(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const renderPatient = ({ item }: { item: Admission }) => (
    <View style={styles.patientCard}>
      <View style={styles.patientHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.patient?.first_name?.[0]}{item.patient?.last_name?.[0]}
          </Text>
        </View>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>
            {item.patient?.first_name} {item.patient?.last_name}
          </Text>
          <Text style={styles.patientEmail}>{item.patient?.email}</Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Room</Text>
          <Text style={styles.detailValue}>
            {item.room?.room_number || 'Unassigned'}
          </Text>
          <Text style={styles.detailSub}>{item.room?.type?.replace('_', ' ')}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Doctor</Text>
          <Text style={styles.detailValue}>
            {item.doctor ? `Dr. ${item.doctor.last_name}` : 'Not assigned'}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.admissionDate}>
          Admitted: {new Date(item.admission_date).toLocaleDateString()}
        </Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenTemplate title="Assigned Patients">
      <TextInput
        style={styles.searchInput}
        placeholder="Search by patient name or room..."
        value={search}
        onChangeText={setSearch}
      />

      {loading && !refreshing ? (
        <Text style={styles.loadingText}>Loading patients...</Text>
      ) : admissions.length === 0 ? (
        <Text style={styles.emptyText}>No admitted patients found.</Text>
      ) : (
        <FlatList
          data={admissions}
          renderItem={renderPatient}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAdmissions(); }} />
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0284c7',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  patientEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  detailSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  admissionDate: {
    fontSize: 12,
    color: '#64748b',
  },
  statusBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
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

