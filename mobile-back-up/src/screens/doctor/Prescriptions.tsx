import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import ScreenTemplate from '../../components/ScreenTemplate';
import api from '../../services/api';

interface Prescription {
  id: number;
  created_at: string;
  status: string;
  type: string;
  patient?: { first_name: string; last_name: string };
  items?: Array<{ medication_name: string; dosage: string; dosage_unit: string }>;
}

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptions();
  }, [search]);

  async function fetchPrescriptions() {
    try {
      const { data } = await api.get('/prescriptions', { params: { search } });
      setPrescriptions(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenTemplate title="Prescriptions">
      <TextInput
        style={styles.searchInput}
        placeholder="Search patient..."
        value={search}
        onChangeText={setSearch}
      />

      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : prescriptions.length === 0 ? (
        <Text style={styles.emptyText}>No prescriptions found.</Text>
      ) : (
        <FlatList
          data={prescriptions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.rxCard}>
              <View style={styles.rxHeader}>
                <Text style={styles.rxTitle}>Prescription #{item.id}</Text>
                <View style={[styles.badge, item.status === 'active' && styles.activeBadge]}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.patientName}>
                {item.patient?.first_name} {item.patient?.last_name}
              </Text>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
              <View style={styles.medsContainer}>
                {item.items?.map((med, i) => (
                  <Text key={i} style={styles.medItem}>
                    • {med.medication_name} {med.dosage}{med.dosage_unit}
                  </Text>
                ))}
              </View>
            </View>
          )}
        />
      )}
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  searchInput: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  rxCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  rxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  rxTitle: { fontSize: 14, fontWeight: '600', color: '#334155' },
  badge: { backgroundColor: '#94a3b8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  activeBadge: { backgroundColor: '#10b981' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  patientName: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  date: { fontSize: 12, color: '#64748b', marginBottom: 12 },
  medsContainer: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8 },
  medItem: { fontSize: 12, color: '#334155', marginBottom: 4 },
  loadingText: { color: '#64748b', textAlign: 'center' },
  emptyText: { color: '#64748b', textAlign: 'center' },
});

