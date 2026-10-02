import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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

export default function MyPatients() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Patient detail modal
  const [viewData, setViewData] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Table column widths (fixed so horizontal scroll behaves predictably)
  const TABLE_WIDTH = 720;
  const COL_NAME = 180;
  const COL_DOB = 120;
  const COL_GENDER = 100;
  const COL_CONTACT = 160;
  const COL_ACTIONS = 160;

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
    setModalLoading(true);
    try {
      const [pRes, rxRes] = await Promise.all([
        api.get(`/patients/${id}`),
        api.get('/prescriptions', { params: { patient_id: id } }),
      ]);
      setViewData(pRes.data.data);
      setPrescriptions(rxRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  }

  function closePatientModal() {
    setViewData(null);
    setPrescriptions([]);
  }

  // ============================================================
  // PATIENT DETAIL MODAL
  // ============================================================
  function renderPatientModal() {
    if (!viewData) return null;

    return (
      <Modal
        visible={!!viewData}
        animationType="slide"
        onRequestClose={closePatientModal}
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Back button */}
            <TouchableOpacity
              onPress={closePatientModal}
              style={styles.backButton}
            >
              <Text style={styles.backText}>← Back to My Patients</Text>
            </TouchableOpacity>

            {/* Patient header */}
            <View style={styles.patientHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {viewData.first_name?.[0]}
                  {viewData.last_name?.[0]}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.patientName}>
                  {viewData.first_name} {viewData.last_name}
                </Text>
                <Text style={styles.patientId}>
                  ID: {viewData.id} • {viewData.gender || '—'}
                </Text>
              </View>
            </View>

            {/* Info grid */}
            <View style={styles.infoGrid}>
              <View style={[styles.infoCard, isTablet && styles.infoCardHalf]}>
                <Text style={styles.infoLabel}>Date of Birth</Text>
                <Text style={styles.infoValue}>
                  {viewData.date_of_birth
                    ? new Date(viewData.date_of_birth).toLocaleDateString()
                    : '—'}
                </Text>
              </View>
              <View style={[styles.infoCard, isTablet && styles.infoCardHalf]}>
                <Text style={styles.infoLabel}>Contact</Text>
                <Text style={styles.infoValue}>
                  {viewData.contact_number || '—'}
                </Text>
              </View>
              <View style={[styles.infoCard, styles.infoCardFull]}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>
                  {viewData.address || '—'}
                </Text>
              </View>
            </View>

            {/* Medical history */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Medical History</Text>
              <View style={styles.textBox}>
                <Text style={styles.textContent}>
                  {viewData.medical_history || 'No medical history recorded.'}
                </Text>
              </View>
            </View>

            {/* Allergies */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, styles.allergyTitle]}>
                ⚠️ Allergies
              </Text>
              <View style={[styles.textBox, styles.allergyBox]}>
                <Text style={[styles.textContent, styles.allergyText]}>
                  {viewData.allergies || 'No known allergies.'}
                </Text>
              </View>
            </View>

            {/* Prescriptions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💊 Current Medications</Text>
              {prescriptions.length === 0 ? (
                <Text style={styles.emptyText}>No prescriptions found.</Text>
              ) : (
                prescriptions.map((rx) => (
                  <View key={rx.id} style={styles.rxCard}>
                    <View style={styles.rxHeader}>
                      <Text style={styles.rxTitle}>
                        Prescription #{rx.id}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          rx.status === 'active' && styles.activeBadge,
                        ]}
                      >
                        <Text style={styles.statusText}>{rx.status}</Text>
                      </View>
                    </View>
                    {rx.items?.map((item, i) => (
                      <View key={i} style={styles.medItem}>
                        <Text style={styles.medName}>
                          {item.medication_name}
                        </Text>
                        <Text style={styles.medDetails}>
                          {item.dosage} {item.dosage_unit} • {item.frequency}x/
                          {item.frequency_unit} for {item.duration}{' '}
                          {item.duration_unit}
                        </Text>
                        {item.instructions ? (
                          <Text style={styles.instructions}>
                            "{item.instructions}"
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  // ============================================================
  // MAIN LIST VIEW
  // ============================================================
  return (
    <ScreenTemplate title="My Patients">
      <View style={styles.container}>
        {/* Header + Search */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>👤 My Patients</Text>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search patients..."
          value={search}
          onChangeText={setSearch}
        />

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#3b82f6"
            style={{ marginTop: 40 }}
          />
        ) : patients.length === 0 ? (
          <Text style={styles.emptyText}>No patients found.</Text>
        ) : (
          <ScrollView
            style={styles.tableWrapper}
            horizontal
            showsHorizontalScrollIndicator
          >
            <View style={{ width: TABLE_WIDTH }}>
              {/* Header row */}
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: COL_NAME }]}>Name</Text>
                <Text style={[styles.th, { width: COL_DOB }]}>DOB</Text>
                <Text style={[styles.th, { width: COL_GENDER }]}>Gender</Text>
                <Text style={[styles.th, { width: COL_CONTACT }]}>Contact</Text>
                <Text style={[styles.th, { width: COL_ACTIONS }]}>Actions</Text>
              </View>

              {/* Rows */}
              {patients.map((p, idx) => (
                <View
                  key={p.id}
                  style={[
                    styles.tableRow,
                    idx % 2 === 0 && styles.tableRowEven,
                  ]}
                >
                  <Text
                    style={[styles.td, styles.tdName, { width: COL_NAME }]}
                    numberOfLines={1}
                  >
                    {p.first_name} {p.last_name}
                  </Text>
                  <Text
                    style={[styles.td, styles.tdMuted, { width: COL_DOB }]}
                    numberOfLines={1}
                  >
                    {p.date_of_birth
                      ? new Date(p.date_of_birth).toLocaleDateString()
                      : '—'}
                  </Text>
                  <Text
                    style={[
                      styles.td,
                      { width: COL_GENDER, textTransform: 'capitalize' },
                    ]}
                    numberOfLines={1}
                  >
                    {p.gender || '—'}
                  </Text>
                  <Text
                    style={[styles.td, { width: COL_CONTACT }]}
                    numberOfLines={1}
                  >
                    {p.contact_number || '—'}
                  </Text>
                  <View style={{ width: COL_ACTIONS }}>
                    <TouchableOpacity
                      style={styles.viewBtn}
                      onPress={() => openPatient(p.id)}
                    >
                      <Text style={styles.viewBtnText}>👁 View Record</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {!isTablet && patients.length > 0 ? (
          <Text style={styles.scrollHint}>← Swipe to see more →</Text>
        ) : null}
      </View>

      {renderPatientModal()}
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header / search
  headerRow: { marginBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  searchInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 14,
  },

  // Table
  tableWrapper: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#fff',
    maxHeight: 560,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  th: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  tableRowEven: { backgroundColor: '#fafbfc' },
  td: { fontSize: 14, color: '#1e293b' },
  tdName: { fontWeight: '600' },
  tdMuted: { fontSize: 13, color: '#64748b' },

  // View button
  viewBtn: {
    backgroundColor: '#1d64c1',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 40,
    fontSize: 14,
  },
  scrollHint: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 8,
    fontStyle: 'italic',
  },

  // Modal
  modalRoot: { flex: 1, backgroundColor: '#f8fafc' },
  modalScroll: { flex: 1 },
  modalScrollContent: { padding: 16, paddingBottom: 60 },
  backButton: { marginBottom: 16 },
  backText: { color: '#64748b', fontSize: 14, fontWeight: '600' },

  // Patient header
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#3b82f6' },
  patientName: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  patientId: { fontSize: 13, color: '#64748b', marginTop: 4 },

  // Info grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
  },
  infoCardHalf: { width: '48%' },
  infoCardFull: { width: '100%' },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: { fontSize: 14, color: '#1e293b', fontWeight: '500' },

  // Sections
  section: { marginTop: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  allergyTitle: { color: '#b91c1c' },
  textBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  allergyBox: { backgroundColor: '#fef2f2', borderColor: '#fee2e2' },
  textContent: { fontSize: 14, color: '#1e293b', lineHeight: 20 },
  allergyText: { color: '#dc2626', fontWeight: '500' },

  // Prescriptions
  rxCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    overflow: 'hidden',
  },
  rxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  rxTitle: { fontSize: 14, fontWeight: '700', color: '#334155' },
  statusBadge: {
    backgroundColor: '#94a3b8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: { backgroundColor: '#10b981' },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  medItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  medName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  medDetails: { fontSize: 12, color: '#64748b', marginTop: 4 },
  instructions: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 6,
  },
});