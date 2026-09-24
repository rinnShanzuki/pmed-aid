import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import ScreenTemplate from '../../components/ScreenTemplate';
import api from '../../services/api';

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  contact_number?: string;
  address?: string;
  medical_history?: string;
  allergies?: string;
}

interface Prescription {
  id: number;
  status: string;
  items?: Array<{
    medication_name: string;
    dosage: string;
    dosage_unit: string;
    frequency: string;
    frequency_unit: string;
    duration: string;
    duration_unit: string;
    route: string;
    instructions?: string;
  }>;
}

export default function PatientRecords() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewData, setViewData] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  useEffect(() => {
    fetchPatients();
  }, [search]);

  async function fetchPatients() {
    try {
      setLoading(true);
      const { data } = await api.get('/patients', { params: { search } });
      setPatients(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function openPatient(id: number) {
    try {
      const [pRes, rxRes] = await Promise.all([
        api.get(`/patients/${id}`),
        api.get('/prescriptions', { params: { patient_id: id } }),
      ]);
      setViewData(pRes.data.data);
      setPrescriptions(rxRes.data.data || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load patient details');
    }
  }

  if (viewData) {
    return (
      <ScreenTemplate title="Patient File">
        <TouchableOpacity onPress={() => setViewData(null)} style={styles.backButton}>
          <Text style={styles.backText}>← Back to My Patients</Text>
        </TouchableOpacity>

        <ScrollView>
          <View style={styles.patientHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{viewData.first_name[0]}{viewData.last_name[0]}</Text>
            </View>
            <View>
              <Text style={styles.patientName}>{viewData.first_name} {viewData.last_name}</Text>
              <Text style={styles.patientId}>ID: {viewData.id} • {viewData.gender || '—'}</Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Date of Birth</Text>
              <Text style={styles.infoValue}>
                {viewData.date_of_birth ? new Date(viewData.date_of_birth).toLocaleDateString() : '—'}
              </Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Contact</Text>
              <Text style={styles.infoValue}>{viewData.contact_number || '—'}</Text>
            </View>
            <View style={[styles.infoCard, styles.fullWidth]}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{viewData.address || '—'}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medical History</Text>
            <View style={styles.textBox}>
              <Text style={styles.textContent}>
                {viewData.medical_history || 'No medical history recorded.'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.allergyTitle]}>⚠️ Allergies</Text>
            <View style={[styles.textBox, styles.allergyBox]}>
              <Text style={[styles.textContent, styles.allergyText]}>
                {viewData.allergies || 'No known allergies.'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💊 Current Medications</Text>
            {prescriptions.length === 0 ? (
              <Text style={styles.emptyText}>No prescriptions found.</Text>
            ) : (
              prescriptions.map((rx) => (
                <View key={rx.id} style={styles.rxCard}>
                  <View style={styles.rxHeader}>
                    <Text style={styles.rxTitle}>Prescription #{rx.id}</Text>
                    <View style={[styles.statusBadge, rx.status === 'active' && styles.activeBadge]}>
                      <Text style={styles.statusText}>{rx.status}</Text>
                    </View>
                  </View>
                  {rx.items?.map((item, i) => (
                    <View key={i} style={styles.medItem}>
                      <Text style={styles.medName}>{item.medication_name}</Text>
                      <Text style={styles.medDetails}>
                        {item.dosage} {item.dosage_unit} • {item.frequency}x/{item.frequency_unit} for{' '}
                        {item.duration} {item.duration_unit}
                      </Text>
                      {item.instructions && (
                        <Text style={styles.instructions}>"{item.instructions}"</Text>
                      )}
                    </View>
                  ))}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate title="My Patients">
      <TextInput
        style={styles.searchInput}
        placeholder="Search patients..."
        value={search}
        onChangeText={setSearch}
      />

      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : patients.length === 0 ? (
        <Text style={styles.emptyText}>No patients found.</Text>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.patientCard}>
              <View style={styles.patientInfo}>
                <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
                <Text style={styles.detail}>
                  DOB: {item.date_of_birth ? new Date(item.date_of_birth).toLocaleDateString() : '—'}
                </Text>
                <Text style={styles.detail}>
                  {item.gender || '—'} • {item.contact_number || 'No contact'}
                </Text>
              </View>
              <TouchableOpacity style={styles.viewButton} onPress={() => openPatient(item.id)}>
                <Text style={styles.viewButtonText}>👁 View</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  searchInput: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  patientCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  patientInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  detail: { fontSize: 12, color: '#64748b', marginTop: 2 },
  viewButton: { backgroundColor: '#1d64c1', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  viewButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  loadingText: { color: '#64748b', textAlign: 'center' },
  emptyText: { color: '#64748b', textAlign: 'center' },
  backButton: { marginBottom: 16 },
  backText: { color: '#64748b', fontSize: 14 },
  patientHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, padding: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 20, fontWeight: '600', color: '#3b82f6' },
  patientName: { fontSize: 20, fontWeight: '600', color: '#0f172a' },
  patientId: { fontSize: 14, color: '#64748b', marginTop: 4 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  infoCard: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', flex: 1, minWidth: '45%' },
  fullWidth: { width: '100%' },
  infoLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  infoValue: { fontSize: 14, color: '#1e293b', fontWeight: '500' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 12 },
  allergyTitle: { color: '#b91c1c' },
  textBox: { backgroundColor: '#fff', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  allergyBox: { backgroundColor: '#fef2f2', borderColor: '#fee2e2' },
  textContent: { fontSize: 14, color: '#1e293b', lineHeight: 20 },
  allergyText: { color: '#dc2626', fontWeight: '500' },
  rxCard: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12, overflow: 'hidden' },
  rxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  rxTitle: { fontSize: 14, fontWeight: '600', color: '#334155' },
  statusBadge: { backgroundColor: '#94a3b8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  activeBadge: { backgroundColor: '#10b981' },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  medItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  medName: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  medDetails: { fontSize: 12, color: '#64748b', marginTop: 4 },
  instructions: { fontSize: 11, color: '#64748b', fontStyle: 'italic', marginTop: 6 },
});
