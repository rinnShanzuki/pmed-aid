import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import ScreenTemplate from '../../components/ScreenTemplate';
import api from '../../services/api';

interface Admission {
  id: number;
  admission_date: string;
  consultation_status?: string;
  patient?: { first_name: string; last_name: string };
  room?: { room_number: string };
}

export default function Consultations() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchAdmissions();
  }, []);

  async function fetchAdmissions() {
    try {
      const { data } = await api.get('/admissions', { params: { status: 'admitted' } });
      setAdmissions(data.data || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load admissions');
    } finally {
      setLoading(false);
    }
  }

  async function openConsultation(admission: Admission) {
    setSelectedAdmission(admission);
    setDiagnosis('');
    setNotes('');
  }

  async function saveConsultation() {
    if (!diagnosis.trim() || !notes.trim()) {
      Alert.alert('Error', 'Please enter both diagnosis and notes');
      return;
    }

    try {
      await api.put(`/admissions/${selectedAdmission!.id}`, {
        diagnosis,
        consultation_notes: notes,
        consultation_status: 'completed',
      });
      Alert.alert('Success', 'Consultation saved successfully!');
      setSelectedAdmission(null);
      fetchAdmissions();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save');
    }
  }

  if (selectedAdmission) {
    return (
      <ScreenTemplate title="Consultation Form">
        <TouchableOpacity onPress={() => setSelectedAdmission(null)} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <ScrollView>
          <View style={styles.patientCard}>
            <Text style={styles.patientName}>
              {selectedAdmission.patient?.first_name} {selectedAdmission.patient?.last_name}
            </Text>
            <Text style={styles.roomInfo}>Room: {selectedAdmission.room?.room_number || 'Unknown'}</Text>
            <Text style={styles.admissionDate}>
              Admitted: {new Date(selectedAdmission.admission_date).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Diagnosis *</Text>
            <TextInput
              style={styles.input}
              value={diagnosis}
              onChangeText={setDiagnosis}
              placeholder="Enter primary diagnosis..."
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Consultation Notes *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Clinical notes and observations..."
              multiline
              numberOfLines={6}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={saveConsultation}>
            <Text style={styles.saveButtonText}>✓ Save Consultation</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenTemplate>
    );
  }

  const filtered = admissions.filter((a) => {
    if (!search) return true;
    const name = `${a.patient?.first_name} ${a.patient?.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <ScreenTemplate title="Active Consultations">
      <TextInput
        style={styles.searchInput}
        placeholder="Search patient..."
        value={search}
        onChangeText={setSearch}
      />

      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : filtered.length === 0 ? (
        <Text style={styles.emptyText}>No active admissions.</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.admissionCard}>
              <View style={styles.admissionInfo}>
                <Text style={styles.name}>
                  {item.patient?.first_name} {item.patient?.last_name}
                </Text>
                <Text style={styles.detail}>Room: {item.room?.room_number || '—'}</Text>
                <Text style={styles.detail}>
                  Admitted: {new Date(item.admission_date).toLocaleDateString()}
                </Text>
                <View style={[styles.statusBadge, item.consultation_status === 'completed' && styles.completedBadge]}>
                  <Text style={styles.statusText}>
                    {item.consultation_status === 'completed' ? 'Completed' : 'Pending'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.openButton} onPress={() => openConsultation(item)}>
                <Text style={styles.openButtonText}>Open</Text>
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
  admissionCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  admissionInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  detail: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statusBadge: { backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginTop: 8 },
  completedBadge: { backgroundColor: '#dcfce7' },
  statusText: { color: '#6b7280', fontSize: 10, fontWeight: '600' },
  openButton: { backgroundColor: '#1d64c1', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  openButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  loadingText: { color: '#64748b', textAlign: 'center' },
  emptyText: { color: '#64748b', textAlign: 'center' },
  backButton: { marginBottom: 16 },
  backText: { color: '#64748b', fontSize: 14 },
  patientCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0' },
  patientName: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  roomInfo: { fontSize: 14, color: '#64748b', marginTop: 4 },
  admissionDate: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  formSection: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', fontSize: 14 },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  saveButton: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 8, marginTop: 12 },
  saveButtonText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600' },
});

