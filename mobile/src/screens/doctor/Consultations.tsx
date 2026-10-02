import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import ScreenTemplate from '../../components/ScreenTemplate';
import api from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';

interface Consultation {
  id: number;
  patient_id: number;
  patient?: { first_name: string; last_name: string };
  room?: { room_number: string };
  status?: string;
  consultation_status?: string;
  created_at?: string;
  updated_at?: string;
  admission_date?: string;
  doctor_notes?: string;
  diagnosis?: string;
  chief_complaint?: string;
  hpi?: string;
  symptoms?: string;
  findings?: string;
  vital_signs?: { bp: string; hr: string; temp: string };
  assessment?: string;
  follow_up_date?: string;
  notes?: string;
}

export default function Consultations() {
  const { on, off } = useSocket();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'completed'>('queue');

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Consultation | null>(null);

  // Clinical fields
  const [notes, setNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [hpi, setHpi] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [findings, setFindings] = useState('');
  const [vitals, setVitals] = useState({ bp: '', hr: '', temp: '' });
  const [assessment, setAssessment] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [sessionStatus, setSessionStatus] = useState('not_started');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Prescription
  const [prescriptionItems, setPrescriptionItems] = useState<any[]>([]);
  const [newMedication, setNewMedication] = useState({
    medication_name: '',
    dosage: '',
    dosage_unit: 'mg',
    frequency: 1,
    frequency_unit: 'daily',
    duration: '',
    route: 'oral',
    instructions: '',
    start_time: '',
    interval_hours: '',
  });
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);

  // Handover dialog
  const [actionDialog, setActionDialog] = useState<'outpatient' | 'admission' | 'session' | null>(null);
  const [pendingSubmitAction, setPendingSubmitAction] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    fetchMedications();
    fetchData();
    
    // Set up real-time listeners
    on('consultation:created', (data) => {
      setConsultations((prev) => [data.consultation, ...prev]);
    });

    on('consultation:updated', (data) => {
      setConsultations((prev) =>
        prev.map((c) => (c.id === data.consultation.id ? data.consultation : c))
      );
    });

    on('consultation:admission_requested', (data) => {
      setConsultations((prev) =>
        prev.map((c) => (c.id === data.consultation.id ? data.consultation : c))
      );
    });

    return () => {
      off('consultation:created');
      off('consultation:updated');
      off('consultation:admission_requested');
    };
  }, [on, off]);

  async function fetchMedications() {
    try {
      const { data } = await api.get('/medications');
      setMedications(data.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchData() {
    setLoading(true);
    try {
      const statusParam =
        activeTab === 'queue' ? 'waiting,in_session' : 'completed,admitted';
      const { data } = await api.get('/consultations', {
        params: { status: statusParam },
      });
      setConsultations(data.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load records.');
    } finally {
      setLoading(false);
    }
  }

  // --- OPEN SESSION ---
  async function openConsultationSession(consultation: Consultation) {
    setSelectedRecord(consultation);
    setNotes(consultation.doctor_notes || '');
    setDiagnosis(consultation.diagnosis || '');
    setChiefComplaint(consultation.chief_complaint || '');
    setHpi(consultation.hpi || '');
    setSymptoms(consultation.symptoms || '');
    setFindings(consultation.findings || '');
    setVitals(consultation.vital_signs || { bp: '', hr: '', temp: '' });
    setAssessment(consultation.assessment || '');
    setFollowUpDate(
      consultation.follow_up_date ? consultation.follow_up_date.split('T')[0] : ''
    );
    setPrescriptionItems([]);
    setNewMedication({
      medication_name: '',
      dosage: '',
      dosage_unit: 'mg',
      frequency: 1,
      frequency_unit: 'daily',
      duration: '',
      route: 'oral',
      instructions: '',
      start_time: '',
      interval_hours: '',
    });
    setError('');
    setSuccess('');
    setShowPrescriptionForm(false);
    setActionDialog(null);
    setPendingSubmitAction(null);
    setModalVisible(true);

    if (
      consultation.status === 'waiting' ||
      consultation.status === 'not_started' ||
      !consultation.status
    ) {
      setSessionStatus('in_session');
      try {
        await api.put(`/consultations/${consultation.id}`, {
          status: 'in_session',
        });
        fetchData();
      } catch (err) {
        console.error('Failed to start session', err);
      }
    } else {
      setSessionStatus(consultation.status);
    }
  }

  // --- MEDICATION INPUT LOGIC ---
  function handleMedicationChange(field: string, value: any) {
    const updates: any = { [field]: value };
    if (field === 'frequency' || field === 'frequency_unit') {
      const freq = field === 'frequency' ? value : newMedication.frequency;
      const unit =
        field === 'frequency_unit' ? value : newMedication.frequency_unit;
      if (unit === 'hourly') updates.interval_hours = '';
      else if (unit === 'daily' && freq > 0)
        updates.interval_hours = (24 / freq).toString();
      else updates.interval_hours = '';
    }
    setNewMedication({ ...newMedication, ...updates });
  }

  async function startSession() {
    setError('');
    try {
      await api.put(`/consultations/${selectedRecord!.id}`, {
        status: 'in_session',
      });
      setSessionStatus('in_session');
      setSuccess('Session started.');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start session.');
    }
  }

  function addPrescriptionItem() {
    if (!newMedication.medication_name.trim() || !newMedication.dosage.trim()) {
      setError('Please fill in medication name and dosage.');
      return;
    }
    setPrescriptionItems([
      ...prescriptionItems,
      {
        ...newMedication,
        dosage: `${newMedication.dosage} ${newMedication.dosage_unit}`,
        id: Date.now(),
      },
    ]);
    setNewMedication({
      medication_name: '',
      dosage: '',
      dosage_unit: 'mg',
      frequency: 1,
      frequency_unit: 'daily',
      duration: '',
      route: 'oral',
      instructions: '',
      start_time: '',
      interval_hours: '',
    });
    setError('');
  }

  function removePrescriptionItem(id: number) {
    setPrescriptionItems(prescriptionItems.filter((item) => item.id !== id));
  }

  // --- FLOW ACTIONS ---
  async function completeOutpatientConsultation(handover = false) {
    if (!diagnosis.trim() || !notes.trim()) {
      setError('Please enter diagnosis and notes.');
      return;
    }
    setError('');
    try {
      if (prescriptionItems.length > 0 && !handover) {
        await api.post('/prescriptions', {
          consultation_id: selectedRecord!.id,
          patient_id: selectedRecord!.patient_id,
          type: 'outpatient',
          notes,
          items: prescriptionItems.map(({ id, ...item }) => item),
        });
      }
      await api.post(
        `/consultations/${selectedRecord!.id}/complete-outpatient`,
        {
          diagnosis,
          doctor_notes: notes,
          chief_complaint: chiefComplaint,
          hpi,
          symptoms,
          findings,
          vital_signs: vitals,
          assessment,
          follow_up_date: followUpDate,
          handover,
        }
      );
      setSuccess('Outpatient session completed successfully.');
      closeModal();
      setTimeout(() => {
        setSuccess('');
        fetchData();
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to complete outpatient session.'
      );
    }
  }

  async function requestAdmissionConsultation(handover = false) {
    if (!diagnosis.trim() || !notes.trim()) {
      setError('Please enter diagnosis and notes.');
      return;
    }
    setError('');
    try {
      if (prescriptionItems.length > 0 && !handover) {
        await api.post('/prescriptions', {
          consultation_id: selectedRecord!.id,
          patient_id: selectedRecord!.patient_id,
          type: 'in_hospital',
          notes,
          items: prescriptionItems.map(({ id, ...item }) => item),
        });
      }
      await api.post(
        `/consultations/${selectedRecord!.id}/request-admission`,
        {
          diagnosis,
          doctor_notes: notes,
          chief_complaint: chiefComplaint,
          hpi,
          symptoms,
          findings,
          vital_signs: vitals,
          assessment,
          follow_up_date: followUpDate,
          handover,
        }
      );
      setSuccess('Admission requested successfully.');
      closeModal();
      setTimeout(() => {
        setSuccess('');
        fetchData();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request admission.');
    }
  }

  const handleActionSelection = async (
    choice: 'prescribe' | 'handover'
  ) => {
    const type = actionDialog;
    setActionDialog(null);

    if (choice === 'prescribe') {
      setPendingSubmitAction(type);
      setShowPrescriptionForm(true);
    } else if (choice === 'handover') {
      if (type === 'outpatient' || type === 'session') {
        await completeOutpatientConsultation(true);
      } else if (type === 'admission') {
        await requestAdmissionConsultation(true);
      }
    }
  };

  function closeModal() {
    setModalVisible(false);
    setTimeout(() => {
      setSelectedRecord(null);
      setShowPrescriptionForm(false);
      setPrescriptionItems([]);
      setError('');
      setSuccess('');
    }, 200);
  }

  // --- FILTER ---
  const filtered = consultations.filter((item) => {
    if (!search) return true;
    const name = `${item.patient?.first_name} ${item.patient?.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  // ============================================================
  // MODAL CONTENT
  // ============================================================
  function renderConsultationModal() {
    if (!selectedRecord) return null;

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={closeModal}
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Back button */}
            <TouchableOpacity
              onPress={closeModal}
              style={styles.backButton}
            >
              <Text style={styles.backText}>← Back to Dashboard</Text>
            </TouchableOpacity>

            {success ? (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>{success}</Text>
              </View>
            ) : null}
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            ) : null}

            {/* Patient header card */}
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalPatientName}>
                    👤 {selectedRecord.patient?.first_name}{' '}
                    {selectedRecord.patient?.last_name}
                  </Text>
                  <Text style={styles.modalMeta}>
                    Created:{' '}
                    {new Date(
                      selectedRecord.created_at ||
                        selectedRecord.admission_date ||
                        ''
                    ).toLocaleDateString()}
                  </Text>
                  {selectedRecord.room?.room_number ? (
                    <Text style={styles.modalMeta}>
                      Room: {selectedRecord.room.room_number}
                    </Text>
                  ) : null}
                </View>

                <View
                  style={[
                    styles.statusPill,
                    sessionStatus === 'in_session' && styles.statusPillActive,
                    sessionStatus === 'completed' &&
                      styles.statusPillCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      sessionStatus === 'in_session' &&
                        styles.statusPillTextActive,
                      sessionStatus === 'completed' &&
                        styles.statusPillTextCompleted,
                    ]}
                  >
                    {sessionStatus.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              {sessionStatus === 'not_started' && (
                <TouchableOpacity
                  onPress={startSession}
                  style={[styles.primaryBtn, { marginTop: 12 }]}
                >
                  <Text style={styles.primaryBtnText}>Start Session</Text>
                </TouchableOpacity>
              )}
            </View>

            {sessionStatus !== 'not_started' ? (
              <>
                {/* Clinical Evaluation */}
                <View style={styles.modalCard}>
                  <Text style={styles.sectionTitle}>
                    📄 Clinical Evaluation
                  </Text>

                  {/* Triage notes */}
                  {selectedRecord.notes ? (
                    <View style={styles.triageBox}>
                      <Text style={styles.triageLabel}>
                        Triage / Initial Notes
                      </Text>
                      <Text style={styles.triageText}>
                        {selectedRecord.notes}
                      </Text>
                    </View>
                  ) : null}

                  {/* Chief Complaint + Symptoms */}
                  <Text style={styles.label}>Chief Complaint</Text>
                  <TextInput
                    style={styles.input}
                    value={chiefComplaint}
                    onChangeText={setChiefComplaint}
                    editable={sessionStatus !== 'completed'}
                    placeholder="e.g. Chest pain"
                  />

                  <Text style={styles.label}>Symptoms</Text>
                  <TextInput
                    style={styles.input}
                    value={symptoms}
                    onChangeText={setSymptoms}
                    editable={sessionStatus !== 'completed'}
                    placeholder="e.g. Fever, cough"
                  />

                  <Text style={styles.label}>Primary Diagnosis *</Text>
                  <TextInput
                    style={styles.input}
                    value={diagnosis}
                    onChangeText={setDiagnosis}
                    editable={sessionStatus !== 'completed'}
                    placeholder="Enter official diagnosis..."
                  />

                  {/* Vitals */}
                  <Text style={styles.label}>Vital Signs</Text>
                  <View style={styles.vitalsRow}>
                    <TextInput
                      style={[styles.input, styles.vitalInput]}
                      placeholder="BP (120/80)"
                      value={vitals.bp}
                      onChangeText={(val) => {
                        let v = val;
                        if (
                          v.length === 3 &&
                          /^\d{3}$/.test(v) &&
                          (vitals.bp || '').length < 3
                        ) {
                          v += '/';
                        }
                        setVitals({ ...vitals, bp: v });
                      }}
                      editable={sessionStatus !== 'completed'}
                    />
                    <TextInput
                      style={[styles.input, styles.vitalInput]}
                      placeholder="HR (bpm)"
                      keyboardType="numeric"
                      value={vitals.hr}
                      onChangeText={(v) => setVitals({ ...vitals, hr: v })}
                      editable={sessionStatus !== 'completed'}
                    />
                    <TextInput
                      style={[styles.input, styles.vitalInput]}
                      placeholder="Temp (°C)"
                      keyboardType="numeric"
                      value={vitals.temp}
                      onChangeText={(v) => setVitals({ ...vitals, temp: v })}
                      editable={sessionStatus !== 'completed'}
                    />
                  </View>

                  <Text style={styles.label}>History of Present Illness</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={hpi}
                    onChangeText={setHpi}
                    editable={sessionStatus !== 'completed'}
                    multiline
                  />

                  <Text style={styles.label}>Clinical Findings</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={findings}
                    onChangeText={setFindings}
                    editable={sessionStatus !== 'completed'}
                    multiline
                  />

                  <Text style={styles.label}>Assessment</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={assessment}
                    onChangeText={setAssessment}
                    editable={sessionStatus !== 'completed'}
                    multiline
                  />

                  <Text style={styles.label}>Follow-up Date</Text>
                  <TextInput
                    style={styles.input}
                    value={followUpDate}
                    onChangeText={setFollowUpDate}
                    editable={sessionStatus !== 'completed'}
                    placeholder="YYYY-MM-DD"
                  />

                  <Text style={styles.label}>General Clinical Notes *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { minHeight: 140 }]}
                    value={notes}
                    onChangeText={setNotes}
                    editable={sessionStatus !== 'completed'}
                    multiline
                    placeholder="Detailed clinical notes..."
                  />
                </View>

                {/* Next steps */}
                {sessionStatus === 'in_session' && !showPrescriptionForm && (
                  <View style={styles.modalCard}>
                    <Text style={styles.sectionTitle}>Next Steps</Text>

                    <TouchableOpacity
                      style={[styles.primaryBtn, styles.greenBtn]}
                      onPress={() => setActionDialog('outpatient')}
                    >
                      <Text style={styles.primaryBtnText}>
                        💊 Complete & Prescribe
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.primaryBtn, styles.blueBtn]}
                      onPress={() => setActionDialog('admission')}
                    >
                      <Text style={styles.primaryBtnText}>
                        🛏 Request Admission
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.primaryBtn, styles.amberBtn]}
                      onPress={() => completeOutpatientConsultation(false)}
                    >
                      <Text style={styles.primaryBtnText}>
                        ✓ Complete Session
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Prescription Form */}
                {sessionStatus === 'in_session' &&
                  showPrescriptionForm &&
                  renderPrescriptionForm()}
              </>
            ) : (
              <View style={styles.modalCard}>
                <Text style={styles.emptyText}>
                  Start the session to begin clinical evaluation.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action dialog */}
          {actionDialog ? (
            <View style={styles.dialogOverlay}>
              <View style={styles.dialogBox}>
                <Text style={styles.dialogTitle}>Prescription Handling</Text>
                <Text style={styles.dialogText}>
                  How would you like to handle the prescription for this
                  patient?
                </Text>

                <TouchableOpacity
                  style={[styles.primaryBtn, styles.greenBtn]}
                  onPress={() => handleActionSelection('prescribe')}
                >
                  <Text style={styles.primaryBtnText}>
                    💊 Prescribe Medication
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryBtn, styles.blueBtn]}
                  onPress={() => handleActionSelection('handover')}
                >
                  <Text style={styles.primaryBtnText}>📤 Handover</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setActionDialog(null)}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  // ============================================================
  // PRESCRIPTION FORM
  // ============================================================
  function renderPrescriptionForm() {
    return (
      <View style={styles.modalCard}>
        <View style={styles.prescriptionHeader}>
          <Text style={styles.sectionTitle}>💊 Electronic Prescription</Text>
          <TouchableOpacity onPress={() => setShowPrescriptionForm(false)}>
            <Text style={styles.closeFormText}>Close Form</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.prescriptionBody}>
          <Text style={styles.label}>Medication *</Text>
          <TextInput
            style={styles.input}
            value={newMedication.medication_name}
            onChangeText={(v) =>
              setNewMedication({ ...newMedication, medication_name: v })
            }
            placeholder="e.g. Paracetamol"
          />

          <Text style={styles.label}>Dosage *</Text>
          <View style={styles.dosageRow}>
            <TextInput
              style={[styles.input, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
              value={newMedication.dosage}
              onChangeText={(v) =>
                setNewMedication({ ...newMedication, dosage: v })
              }
              placeholder="e.g. 500"
              keyboardType="numeric"
            />
            <View style={styles.unitSelect}>
              <Text style={styles.unitSelectText}>
                {newMedication.dosage_unit}
              </Text>
            </View>
          </View>

          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Frequency</Text>
              <TextInput
                style={styles.input}
                value={String(newMedication.frequency)}
                onChangeText={(v) => handleMedicationChange('frequency', v)}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Freq Unit</Text>
              <TextInput
                style={styles.input}
                value={newMedication.frequency_unit}
                onChangeText={(v) =>
                  handleMedicationChange('frequency_unit', v)
                }
              />
            </View>
          </View>

          <Text style={styles.label}>Duration</Text>
          <TextInput
            style={styles.input}
            value={newMedication.duration}
            onChangeText={(v) => handleMedicationChange('duration', v)}
            placeholder="e.g. 7 Days"
          />

          <Text style={styles.label}>Route</Text>
          <TextInput
            style={styles.input}
            value={newMedication.route}
            onChangeText={(v) => handleMedicationChange('route', v)}
          />

          <Text style={styles.label}>Start Time</Text>
          <TextInput
            style={styles.input}
            value={newMedication.start_time}
            onChangeText={(v) => handleMedicationChange('start_time', v)}
            placeholder="HH:MM"
          />

          <Text style={styles.label}>Interval (hrs)</Text>
          <TextInput
            style={styles.input}
            value={newMedication.interval_hours}
            onChangeText={(v) => handleMedicationChange('interval_hours', v)}
            keyboardType="numeric"
            placeholder="e.g. 8"
          />

          <Text style={styles.label}>Instructions</Text>
          <TextInput
            style={styles.input}
            value={newMedication.instructions}
            onChangeText={(v) => handleMedicationChange('instructions', v)}
            placeholder="Take after meals"
          />

          <TouchableOpacity
            style={[styles.primaryBtn, styles.greenBtn, { marginTop: 12 }]}
            onPress={addPrescriptionItem}
          >
            <Text style={styles.primaryBtnText}>+ Add to Prescription List</Text>
          </TouchableOpacity>

          {prescriptionItems.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <Text style={styles.prescriptionListTitle}>
                Prescribed Medications ({prescriptionItems.length})
              </Text>
              {prescriptionItems.map((item) => (
                <View key={item.id} style={styles.prescriptionItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prescriptionMedName}>
                      {item.medication_name}
                    </Text>
                    <Text style={styles.prescriptionMedDetail}>
                      {item.dosage} • {item.frequency}x {item.frequency_unit} for{' '}
                      {item.duration} • Route: {item.route}
                    </Text>
                    {item.instructions ? (
                      <Text style={styles.prescriptionMedDetail}>
                        "{item.instructions}"
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => removePrescriptionItem(item.id)}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteBtnText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, styles.amberBtn, { marginTop: 16 }]}
            onPress={() => {
              if (
                pendingSubmitAction === 'outpatient' ||
                pendingSubmitAction === 'session'
              )
                completeOutpatientConsultation(false);
              else if (pendingSubmitAction === 'admission')
                requestAdmissionConsultation(false);
            }}
          >
            <Text style={styles.primaryBtnText}>✓ Complete Session</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============================================================
  // MAIN LIST VIEW
  // ============================================================
  return (
    <ScreenTemplate title="Consultations">
      <View style={styles.container}>
        {/* Header + Search */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>🩺 Doctor Dashboard</Text>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search patient..."
          value={search}
          onChangeText={setSearch}
        />

        {/* Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'queue' && styles.tabActive]}
            onPress={() => setActiveTab('queue')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'queue' && styles.tabTextActive,
              ]}
            >
              Consultation Queue
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
            onPress={() => setActiveTab('completed')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'completed' && styles.tabTextActive,
              ]}
            >
              Completed Sessions
            </Text>
          </TouchableOpacity>
        </View>

        {/* Table */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#3b82f6"
            style={{ marginTop: 40 }}
          />
        ) : filtered.length === 0 ? (
          <Text style={styles.emptyText}>No records found.</Text>
        ) : (
          <ScrollView
            style={styles.tableWrapper}
            horizontal
            showsHorizontalScrollIndicator
          >
            <View style={{ minWidth: isTablet ? '100%' : 620 }}>
              {/* Header row */}
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: 180 }]}>Patient</Text>
                <Text style={[styles.th, { width: 100 }]}>Time</Text>
                <Text style={[styles.th, { width: 140 }]}>Status</Text>
                <Text style={[styles.th, { width: 160 }]}>Actions</Text>
              </View>

              {/* Rows */}
              {filtered.map((a, idx) => {
                const status = a.consultation_status || a.status || 'waiting';
                const dateVal =
                  status === 'completed' || status === 'admitted'
                    ? a.updated_at
                    : a.created_at;
                return (
                  <View
                    key={a.id}
                    style={[
                      styles.tableRow,
                      idx % 2 === 0 && styles.tableRowEven,
                    ]}
                  >
                    <Text
                      style={[styles.td, { width: 180, fontWeight: '600' }]}
                      numberOfLines={1}
                    >
                      {a.patient?.first_name} {a.patient?.last_name}
                    </Text>
                    <Text
                      style={[styles.td, { width: 100, color: '#64748b' }]}
                      numberOfLines={1}
                    >
                      {dateVal
                        ? new Date(dateVal).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </Text>
                    <View style={{ width: 140 }}>
                      <View
                        style={[
                          styles.badge,
                          status === 'in_session' && styles.badgeActive,
                          status === 'completed' && styles.badgeCompleted,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            status === 'in_session' && styles.badgeTextActive,
                            status === 'completed' &&
                              styles.badgeTextCompleted,
                          ]}
                        >
                          {status === 'in_session'
                            ? 'Active'
                            : status === 'completed'
                            ? 'Completed'
                            : 'Waiting'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.openBtn, { width: 160 }]}
                      onPress={() => openConsultationSession(a)}
                    >
                      <Text style={styles.openBtnText}>🩺 Open Form</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}

        {!isTablet && filtered.length > 0 ? (
          <Text style={styles.scrollHint}>← Swipe to see more →</Text>
        ) : null}
      </View>

      {renderConsultationModal()}
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header / search / tabs
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

  tabsRow: {
    flexDirection: 'row',
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#3b82f6' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#3b82f6' },

  // Table
  tableWrapper: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#fff',
    maxHeight: 500,
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

  // Badges
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignSelf: 'flex-start',
  },
  badgeActive: { backgroundColor: '#dbeafe' },
  badgeCompleted: { backgroundColor: '#dcfce7' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#6b7280' },
  badgeTextActive: { color: '#0369a1' },
  badgeTextCompleted: { color: '#166534' },

  openBtn: {
    backgroundColor: '#1d64c1',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  openBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

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

  successBanner: {
    padding: 12,
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: { color: '#166534', fontWeight: '600' },
  errorBanner: {
    padding: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: { color: '#991b1b', fontWeight: '600' },

  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  modalPatientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  modalMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },

  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  statusPillActive: { backgroundColor: '#dbeafe' },
  statusPillCompleted: { backgroundColor: '#dcfce7' },
  statusPillText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  statusPillTextActive: { color: '#0369a1' },
  statusPillTextCompleted: { color: '#166534' },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },

  triageBox: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    marginBottom: 16,
  },
  triageLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  triageText: { fontSize: 14, color: '#334155', lineHeight: 20 },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    fontSize: 14,
    color: '#0f172a',
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },

  vitalsRow: { flexDirection: 'row', gap: 8 },
  vitalInput: { flex: 1 },

  twoCol: { flexDirection: 'row', gap: 12 },

  dosageRow: { flexDirection: 'row' },
  unitSelect: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderLeftWidth: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  unitSelectText: { fontSize: 14, color: '#334155', fontWeight: '600' },

  primaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  greenBtn: { backgroundColor: '#10b981' },
  blueBtn: { backgroundColor: '#3b82f6' },
  amberBtn: { backgroundColor: '#f59e0b' },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Prescription
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
    marginBottom: 12,
  },
  closeFormText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  prescriptionBody: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  prescriptionListTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  prescriptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  prescriptionMedName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  prescriptionMedDetail: { fontSize: 12, color: '#64748b' },
  deleteBtn: {
    backgroundColor: '#fee2e2',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: { color: '#ef4444', fontSize: 16 },

  // Dialog
  dialogOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  dialogBox: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    width: '100%',
    maxWidth: 420,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  dialogText: {
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
  },
  cancelBtn: { marginTop: 12, alignItems: 'center' },
  cancelBtnText: { color: '#94a3b8', fontWeight: '600', fontSize: 14 },
});