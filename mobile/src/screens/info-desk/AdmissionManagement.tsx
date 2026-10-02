import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { Card, Button, Badge } from '../../components';
import theme from '../../styles/theme';

// Helper function to format date input as MM/DD/YYYY with validation
function formatDateInput(value: string): string {
  // Remove non-digits
  let digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  
  // Handle month (first 2 digits - max 12)
  if (digits.length <= 2) {
    let month = parseInt(digits);
    if (month > 12) month = 12;
    return month.toString().padStart(digits.length, '0');
  }
  
  let month = parseInt(digits.slice(0, 2));
  if (month > 12) month = 12;
  month = Math.max(1, month);
  
  // Handle day (next 2 digits - max 31)
  if (digits.length <= 4) {
    let day = parseInt(digits.slice(2));
    if (day > 31) day = 31;
    return `${month.toString().padStart(2, '0')}/${day.toString().padStart(digits.slice(2).length, '0')}`;
  }
  
  let day = parseInt(digits.slice(2, 4));
  if (day > 31) day = 31;
  day = Math.max(1, day);
  
  // Handle year (last 4 digits)
  let year = digits.slice(4, 8);
  
  return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
}

type TabType = 'consultation_queue' | 'pending_admissions' | 'outpatient' | 'admitted' | 'discharged';

interface TabConfig {
  id: TabType;
  label: string;
  key: string;
}

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  contact_number?: string;
  civil_status?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_number?: string;
  blood_type?: string;
  allergies?: string;
  isNew?: boolean;
}

interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
}

interface Room {
  id: number;
  room_number: string;
  room_type: string;
  status: string;
}

interface Nurse {
  id: number;
  first_name: string;
  last_name: string;
}

interface Consultation {
  id: number;
  patient_id: number;
  patient: Patient;
  doctor_id: number;
  doctor: Doctor;
  status: string;
  scheduled_time?: string;
  notes?: string;
  created_at: string;
}

interface Admission {
  id: number;
  patient_id: number;
  patient: Patient;
  doctor_id: number;
  doctor: Doctor;
  room_id: number;
  room: Room;
  nurse_id?: number;
  nurse?: Nurse;
  status: string;
  discharge_requested?: boolean;
  admission_date: string;
  created_at: string;
}

export default function AdmissionManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('consultation_queue');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [search, setSearch] = useState('');
  const [tabCounts, setTabCounts] = useState<Record<TabType, number>>({
    consultation_queue: 0,
    pending_admissions: 0,
    outpatient: 0,
    admitted: 0,
    discharged: 0,
  });

  // Modal and forms (continued)
  const [modal, setModal] = useState<'search-patient' | 'new-patient' | 'assign-doctor' | 'assign-room' | 'gender-picker' | null>(null);
  const [genderDropdownOpen, setGenderDropdownOpen] = useState(false);
  const [bloodTypeDropdownOpen, setBloodTypeDropdownOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [patientForm, setPatientForm] = useState<Patient>({
    id: 0,
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'male',
    contact_number: '',
    civil_status: 'single',
    address: '',
    emergency_contact_name: '',
    emergency_contact_number: '',
    blood_type: '',
    allergies: '',
  });

  const [consultationForm, setConsultationForm] = useState({
    doctor_id: '',
    scheduled_time: '',
    notes: '',
  });

  const [admissionForm, setAdmissionForm] = useState({
    room_id: '',
    attending_doctor_id: '',
    assigned_nurse_id: '',
    department: '',
    reason_for_admission: '',
    notes: '',
  });

  // Store all data
  const [allConsultations, setAllConsultations] = useState<Consultation[]>([]);
  const [allAdmissions, setAllAdmissions] = useState<Admission[]>([]);

  // Fetch ALL data once on component mount
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [queueRes, pendingRes, outpatientRes, admittedRes, dischargedRes] = await Promise.all([
        api.get('/consultations', { params: { status: 'waiting,in_session' } }),
        api.get('/consultations', { params: { admission_required: true, pending_admission: true } }),
        api.get('/consultations', { params: { admission_required: false, status: 'completed' } }),
        api.get('/admissions', { params: { status: 'admitted' } }),
        api.get('/admissions', { params: { status: 'discharged' } }),
      ]);

      // Store all consultations
      setAllConsultations([
        ...(queueRes.data.data || []),
        ...(pendingRes.data.data || []),
        ...(outpatientRes.data.data || []),
      ]);

      // Store all admissions
      setAllAdmissions([
        ...(admittedRes.data.data || []),
        ...(dischargedRes.data.data || []),
      ]);

      // Set counts
      setTabCounts({
        consultation_queue: queueRes.data.data?.length || 0,
        pending_admissions: pendingRes.data.data?.length || 0,
        outpatient: outpatientRes.data.data?.length || 0,
        admitted: admittedRes.data.data?.length || 0,
        discharged: dischargedRes.data.data?.length || 0,
      });

      setError('');
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter data based on active tab (no API call - instant)
  const updateDisplayData = useCallback(() => {
    if (activeTab === 'consultation_queue') {
      const filtered = allConsultations.filter(c => c.status === 'waiting' || c.status === 'in_session');
      setConsultations(filtered);
    } else if (activeTab === 'pending_admissions') {
      const filtered = allConsultations.filter(c => c.status !== 'waiting' && c.status !== 'in_session' && c.status !== 'completed');
      setConsultations(filtered);
    } else if (activeTab === 'outpatient') {
      const filtered = allConsultations.filter(c => c.status === 'completed');
      setConsultations(filtered);
    } else if (activeTab === 'admitted') {
      const filtered = allAdmissions.filter(a => a.status === 'admitted');
      setAdmissions(filtered);
    } else if (activeTab === 'discharged') {
      const filtered = allAdmissions.filter(a => a.status === 'discharged');
      setAdmissions(filtered);
    }
  }, [activeTab, allConsultations, allAdmissions]);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [pRes, dRes, rRes, nRes] = await Promise.all([
        api.get('/patients', { params: { exclude_active: true } }),
        api.get('/users', { params: { role: 'doctor' } }),
        api.get('/rooms/available'),
        api.get('/users', { params: { role: 'nurse' } }),
      ]);
      setPatients(pRes.data.data || []);
      setDoctors(dRes.data.data || []);
      setRooms(rRes.data.data || []);
      setNurses(nRes.data.data || []);
    } catch (err) {
      console.error('Dropdown fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Update displayed data when tab changes (no API call)
  useEffect(() => {
    updateDisplayData();
  }, [updateDisplayData]);

  useEffect(() => {
    fetchDropdowns();
  }, [fetchDropdowns]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  // Modal handlers
  const openQueuePatient = () => {
    setPatientSearch('');
    setSelectedPatient(null);
    setError('');
    setModal('search-patient');
  };

  const startNewPatient = () => {
    const parts = patientSearch.trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    setPatientForm({
      id: 0,
      first_name: firstName,
      last_name: lastName,
      date_of_birth: '',
      gender: 'male',
      contact_number: '',
      civil_status: 'single',
      address: '',
      emergency_contact_name: '',
      emergency_contact_number: '',
      blood_type: '',
      allergies: '',
    });
    setModal('new-patient');
  };

  const selectSearchedPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setConsultationForm({ doctor_id: '', scheduled_time: '', notes: '' });
    setModal('assign-doctor');
  };

  const createNewPatient = () => {
    if (!patientForm.first_name.trim() || !patientForm.last_name.trim()) {
      setError('Please enter first and last name');
      return;
    }
    setSelectedPatient({ ...patientForm, isNew: true });
    setConsultationForm({ doctor_id: '', scheduled_time: '', notes: '' });
    setModal('assign-doctor');
  };

  const handleSubmitConsultation = async () => {
    if (!selectedPatient) return;
    setError('');
    setIsSubmitting(true);

    try {
      let finalPatientId = selectedPatient.id;
      if (selectedPatient.isNew) {
        const patientData = { ...selectedPatient };
        delete patientData.isNew;
        const { data } = await api.post('/patients', patientData);
        finalPatientId = data.data.id;
      }

      await api.post('/consultations', {
        patient_id: finalPatientId,
        doctor_id: consultationForm.doctor_id,
        scheduled_time: consultationForm.scheduled_time || null,
        notes: consultationForm.notes,
      });

      setSuccess('Patient queued for consultation!');
      setModal(null);
      setSelectedPatient(null);
      await fetchAllData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to queue patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAssignRoom = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setAdmissionForm({
      room_id: '',
      attending_doctor_id: consultation.doctor_id.toString(),
      assigned_nurse_id: '',
      department: '',
      reason_for_admission: '',
      notes: consultation.notes || '',
    });
    setModal('assign-room');
  };

  const handleSubmitAdmission = async () => {
    if (!selectedConsultation) return;
    setError('');
    setIsSubmitting(true);

    try {
      await api.post('/admissions', {
        patient_id: selectedConsultation.patient_id,
        room_id: admissionForm.room_id,
        attending_doctor_id: admissionForm.attending_doctor_id,
        assigned_nurse_id: admissionForm.assigned_nurse_id || null,
        department: admissionForm.department,
        reason_for_admission: admissionForm.reason_for_admission,
        notes: admissionForm.notes,
        consultation_id: selectedConsultation.id,
      });

      setSuccess('Patient admitted successfully!');
      setModal(null);
      setSelectedConsultation(null);
      await fetchAllData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Admission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDischarge = (id: number) => {
    Alert.alert('Discharge Patient?', 'Are you sure you want to discharge this patient?', [
      { text: 'Cancel' },
      {
        text: 'Discharge',
        onPress: async () => {
          try {
            await api.post(`/admissions/${id}/discharge`);
            setSuccess('Patient discharged successfully!');
            await fetchAllData();
            setTimeout(() => setSuccess(''), 3000);
          } catch (err: any) {
            setError(err.response?.data?.message || 'Discharge failed');
          }
        },
      },
    ]);
  };

  // Filter data
  const displayList = activeTab === 'admitted' || activeTab === 'discharged' ? admissions : consultations;
  const filteredList = displayList.filter(item => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    const patientName = `${item.patient?.first_name} ${item.patient?.last_name}`.toLowerCase();
    const doctorName = `${item.doctor?.first_name} ${item.doctor?.last_name}`.toLowerCase();
    return patientName.includes(query) || doctorName.includes(query);
  });

  const tabs: TabConfig[] = [
    { id: 'consultation_queue', label: 'Consultation Queue', key: 'queue' },
    { id: 'pending_admissions', label: 'Pending Admissions', key: 'pending' },
    { id: 'outpatient', label: 'Outpatient Checkouts', key: 'outpatient' },
    { id: 'admitted', label: 'Admitted', key: 'admitted' },
    { id: 'discharged', label: 'Discharged', key: 'discharged' },
  ];

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return { bg: '#fef3c7', color: '#d97706' };
      case 'in_session':
        return { bg: '#dbeafe', color: '#0284c7' };
      case 'completed':
        return { bg: '#dcfce7', color: '#16a34a' };
      case 'admitted':
        return { bg: '#e0e7ff', color: '#6366f1' };
      default:
        return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.purple} />
        <Text style={styles.loadingText}>Loading admission data…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.purple]} />}
      >
        {/* Messages */}
        {success && (
          <View style={[styles.message, styles.successMessage]}>
            <Text style={[styles.messageText, styles.successText]}>{success}</Text>
          </View>
        )}
        {error && (
          <View style={[styles.message, styles.errorMessage]}>
            <Text style={[styles.messageText, styles.errorText]}>{error}</Text>
          </View>
        )}

        {/* Toolbar */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search patient…"
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#94a3b8"
            />
          </View>
          <TouchableOpacity style={styles.queueButton} onPress={openQueuePatient}>
            <Text style={styles.queueButtonText}>Queue Patient</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                {tabCounts[tab.id] > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{tabCounts[tab.id]}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Records */}
        {filteredList.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>
              {loading ? 'Loading…' : 'No records found'}
            </Text>
          </View>
        ) : (
          <View style={styles.mainCard}>
            {/* Horizontal Scrolling Table */}
            <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} style={styles.horizontalScroll}>
              <View style={styles.tableWrapper}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, { width: 120 }]}>PATIENT</Text>
                  {(activeTab === 'admitted' || activeTab === 'discharged') ? (
                    <>
                      <Text style={[styles.th, { width: 90 }]}>ROOM</Text>
                      <Text style={[styles.th, { width: 120 }]}>DOCTOR</Text>
                    </>
                  ) : (
                    <Text style={[styles.th, { width: 110 }]}>DOCTOR</Text>
                  )}
                  <Text style={[styles.th, { width: 100 }]}>STATUS</Text>
                  <Text style={[styles.th, { width: 90 }]}>DATE</Text>
                  {(activeTab === 'pending_admissions' || activeTab === 'admitted') && (
                    <Text style={[styles.th, { width: 80 }]}>ACTIONS</Text>
                  )}
                </View>

                {/* Table Rows */}
                {filteredList.map((item, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text 
                      style={[styles.td, { width: 120 }]} 
                      numberOfLines={2}
                    >
                      {item.patient?.first_name} {item.patient?.last_name}
                    </Text>
                    {(activeTab === 'admitted' || activeTab === 'discharged') ? (
                      <>
                        <Text style={[styles.td, { width: 90 }]} numberOfLines={1}>
                          {(item as Admission).room?.room_number || '—'}
                        </Text>
                        <Text style={[styles.td, { width: 120 }]} numberOfLines={1}>
                          Dr. {item.doctor?.last_name || 'N/A'}
                        </Text>
                      </>
                    ) : (
                      <Text style={[styles.td, { width: 110 }]} numberOfLines={1}>
                        Dr. {item.doctor?.last_name || 'N/A'}
                      </Text>
                    )}
                    <View style={[styles.td, { width: 100, justifyContent: 'center' }]}>
                      <View style={[
                        styles.statusBadge,
                        item.status === 'waiting' && styles.statusWarning,
                        item.status === 'in_session' && styles.statusInfo,
                        item.status === 'completed' && styles.statusSuccess,
                        item.status === 'admitted' && styles.statusInfo,
                        !['waiting', 'in_session', 'completed', 'admitted'].includes(item.status) && styles.statusDefault,
                      ]}>
                        <Text style={[
                          styles.statusText,
                          item.status === 'waiting' && styles.statusWarningText,
                          item.status === 'in_session' && styles.statusInfoText,
                          item.status === 'completed' && styles.statusSuccessText,
                          item.status === 'admitted' && styles.statusInfoText,
                        ]} numberOfLines={1}>
                          {item.status.replace(/_/g, ' ')}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.td, { width: 90 }]}>
                      {new Date(item.created_at || (item as Admission).admission_date).toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: '2-digit'
                      })}
                    </Text>
                    {activeTab === 'pending_admissions' && (
                      <View style={[styles.td, { width: 80, justifyContent: 'center' }]}>
                        <TouchableOpacity 
                          style={styles.actionBtn}
                          onPress={() => openAssignRoom(item as Consultation)}
                        >
                          <Text style={styles.actionBtnText}>Admit</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {activeTab === 'admitted' && (
                      <View style={[styles.td, { width: 80, justifyContent: 'center' }]}>
                        <TouchableOpacity 
                          style={[styles.actionBtn, styles.actionBtnDanger]}
                          onPress={() => handleDischarge((item as Admission).id)}
                        >
                          <Text style={styles.actionBtnText}>Disch.</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* MODALS */}

      {/* Search/Queue Patient Modal */}
      <Modal visible={modal === 'search-patient'} transparent animationType="fade" onRequestClose={() => setModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Consultation</Text>
              <TouchableOpacity onPress={() => setModal(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {error && (
                <View style={[styles.message, styles.errorMessage]}>
                  <Text style={[styles.messageText, styles.errorText]}>{error}</Text>
                </View>
              )}

              <Text style={styles.modalLabel}>Search patient or create new</Text>
              <View style={styles.modalSearchBox}>
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Enter patient name…"
                  value={patientSearch}
                  onChangeText={setPatientSearch}
                  placeholderTextColor={theme.colors.textTertiary}
                />
              </View>

              {patientSearch.trim() === '' ? (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>Start typing to search patients</Text>
                </View>
              ) : patients
                  .filter(p =>
                    `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientSearch.toLowerCase())
                  )
                  .slice(0, 5)
                  .map(p => (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.patientOption}
                      onPress={() => selectSearchedPatient(p)}
                    >
                      <Text style={styles.patientOptionName}>
                        {p.first_name} {p.last_name}
                      </Text>
                      <Text style={styles.patientOptionSubtitle}>Existing patient</Text>
                    </TouchableOpacity>
                  ))
                  .length > 0 ? (
                patients
                  .filter(p =>
                    `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientSearch.toLowerCase())
                  )
                  .slice(0, 5)
                  .map(p => (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.patientOption}
                      onPress={() => selectSearchedPatient(p)}
                    >
                      <Text style={styles.patientOptionName}>
                        {p.first_name} {p.last_name}
                      </Text>
                      <Text style={styles.patientOptionSubtitle}>Existing patient</Text>
                    </TouchableOpacity>
                  ))
              ) : (
                <TouchableOpacity style={styles.patientOption} onPress={startNewPatient}>
                  <Text style={styles.patientOptionName}>+ {patientSearch}</Text>
                  <Text style={styles.patientOptionSubtitle}>Create new patient</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* New Patient Modal */}
      <Modal visible={modal === 'new-patient'} transparent animationType="fade" onRequestClose={() => setModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register New Patient</Text>
              <TouchableOpacity onPress={() => setModal(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalBody}
              scrollEnabled={true}
              showsVerticalScrollIndicator={true}
              showsHorizontalScrollIndicator={true}
            >
              {error && (
                <View style={[styles.message, styles.errorMessage]}>
                  <Text style={[styles.messageText, styles.errorText]}>{error}</Text>
                </View>
              )}

              <Text style={styles.formSectionLabel}>Personal Information</Text>

              <View style={styles.formGrid2}>
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>First Name *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. Juan"
                    value={patientForm.first_name}
                    onChangeText={v => setPatientForm({ ...patientForm, first_name: v })}
                    placeholderTextColor={theme.colors.textTertiary}
                  />
                </View>
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>Last Name *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. Dela Cruz"
                    value={patientForm.last_name}
                    onChangeText={v => setPatientForm({ ...patientForm, last_name: v })}
                    placeholderTextColor={theme.colors.textTertiary}
                  />
                </View>
              </View>

              <View style={styles.formGrid2}>
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>Date of Birth</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="MM/DD/YYYY"
                    value={formatDateInput(patientForm.date_of_birth)}
                    onChangeText={v => setPatientForm({ ...patientForm, date_of_birth: formatDateInput(v) })}
                    placeholderTextColor={theme.colors.textTertiary}
                    maxLength={10}
                  />
                </View>
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>Gender</Text>
                  <TouchableOpacity 
                    style={styles.genderDropdown}
                    onPress={() => setGenderDropdownOpen(!genderDropdownOpen)}
                  >
                    <Text style={styles.genderDropdownText}>
                      {patientForm.gender === 'male' ? 'Male' : 'Female'}
                    </Text>
                    <Text style={styles.genderDropdownIcon}>▼</Text>
                  </TouchableOpacity>
                  {genderDropdownOpen && (
                    <View style={styles.genderDropdownMenu}>
                      <TouchableOpacity 
                        style={styles.genderOption}
                        onPress={() => {
                          setPatientForm({ ...patientForm, gender: 'male' });
                          setGenderDropdownOpen(false);
                        }}
                      >
                        <Text style={[
                          styles.genderOptionText,
                          patientForm.gender === 'male' && styles.genderOptionSelected
                        ]}>
                          Male
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.genderOption}
                        onPress={() => {
                          setPatientForm({ ...patientForm, gender: 'female' });
                          setGenderDropdownOpen(false);
                        }}
                      >
                        <Text style={[
                          styles.genderOptionText,
                          patientForm.gender === 'female' && styles.genderOptionSelected
                        ]}>
                          Female
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              <Text style={[styles.formSectionLabel, { marginTop: theme.spacing.xl }]}>Contact Details</Text>

              <View>
                <Text style={styles.formLabel}>Contact Number</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 09XX-XXX-XXXX"
                  value={patientForm.contact_number}
                  onChangeText={v => setPatientForm({ ...patientForm, contact_number: v })}
                  placeholderTextColor={theme.colors.textTertiary}
                />
              </View>

              <View>
                <Text style={styles.formLabel}>Address</Text>
                <TextInput
                  style={[styles.formInput, { minHeight: 80 }]}
                  placeholder="e.g. 123 Main St, City"
                  value={patientForm.address}
                  onChangeText={v => setPatientForm({ ...patientForm, address: v })}
                  multiline
                  placeholderTextColor={theme.colors.textTertiary}
                />
              </View>

              <View style={styles.formGrid2}>
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>Emergency Contact Name</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. Maria Dela Cruz"
                    value={patientForm.emergency_contact_name}
                    onChangeText={v => setPatientForm({ ...patientForm, emergency_contact_name: v })}
                    placeholderTextColor={theme.colors.textTertiary}
                  />
                </View>
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>Emergency Contact Number</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 09XX-XXX-XXXX"
                    value={patientForm.emergency_contact_number}
                    onChangeText={v => setPatientForm({ ...patientForm, emergency_contact_number: v })}
                    placeholderTextColor={theme.colors.textTertiary}
                  />
                </View>
              </View>

              <View>
                <Text style={styles.formLabel}>Blood Type</Text>
                <TouchableOpacity 
                  style={styles.bloodTypeDropdown}
                  onPress={() => setBloodTypeDropdownOpen(!bloodTypeDropdownOpen)}
                >
                  <Text style={styles.bloodTypeDropdownText}>
                    {patientForm.blood_type || 'Select Blood Type'}
                  </Text>
                  <Text style={styles.bloodTypeDropdownIcon}>▼</Text>
                </TouchableOpacity>
                {bloodTypeDropdownOpen && (
                  <View style={styles.bloodTypeDropdownMenu}>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
                      <TouchableOpacity 
                        key={type}
                        style={styles.bloodTypeOption}
                        onPress={() => {
                          setPatientForm({ ...patientForm, blood_type: type });
                          setBloodTypeDropdownOpen(false);
                        }}
                      >
                        <Text style={[
                          styles.bloodTypeOptionText,
                          patientForm.blood_type === type && styles.bloodTypeOptionSelected
                        ]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View>
                <Text style={styles.formLabel}>Allergies</Text>
                <TextInput
                  style={[styles.formInput, { minHeight: 80 }]}
                  placeholder="e.g. Penicillin, Sulfa drugs, Latex"
                  value={patientForm.allergies}
                  onChangeText={v => setPatientForm({ ...patientForm, allergies: v })}
                  multiline
                  placeholderTextColor={theme.colors.textTertiary}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button variant="outline" onPress={() => setModal(null)}>
                Cancel
              </Button>
              <Button variant="primary" onPress={createNewPatient} loading={isSubmitting}>
                Continue to Doctor
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Assign Doctor Modal */}
      <Modal visible={modal === 'assign-doctor'} transparent animationType="fade" onRequestClose={() => setModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Doctor</Text>
              <TouchableOpacity onPress={() => setModal(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {selectedPatient && (
                <>
                  <Text style={styles.modalLabel}>Patient</Text>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxText}>
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </Text>
                  </View>
                </>
              )}

              <Text style={styles.modalLabel}>Select Doctor *</Text>
              <View style={styles.optionsList}>
                {doctors.map(doc => (
                  <TouchableOpacity
                    key={doc.id}
                    style={[
                      styles.optionItem,
                      consultationForm.doctor_id === doc.id.toString() && styles.optionItemSelected,
                    ]}
                    onPress={() => setConsultationForm({ ...consultationForm, doctor_id: doc.id.toString() })}
                  >
                    <Text style={styles.optionItemText}>
                      Dr. {doc.first_name} {doc.last_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.formInput, { minHeight: 100 }]}
                placeholder="Add consultation notes…"
                value={consultationForm.notes}
                onChangeText={v => setConsultationForm({ ...consultationForm, notes: v })}
                multiline
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>

            <View style={styles.modalActions}>
              <Button variant="outline" onPress={() => setModal(null)}>
                Back
              </Button>
              <Button
                variant="primary"
                onPress={handleSubmitConsultation}
                loading={isSubmitting}
                disabled={!consultationForm.doctor_id}
              >
                Queue Patient
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Assign Room Modal */}
      <Modal visible={modal === 'assign-room'} transparent animationType="fade" onRequestClose={() => setModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Admit Patient</Text>
              <TouchableOpacity onPress={() => setModal(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedConsultation && (
                <>
                  <Text style={styles.modalLabel}>Patient</Text>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxText}>
                      {selectedConsultation.patient?.first_name} {selectedConsultation.patient?.last_name}
                    </Text>
                  </View>
                </>
              )}

              <Text style={styles.modalLabel}>Select Room *</Text>
              <View style={styles.optionsList}>
                {rooms.map(room => (
                  <TouchableOpacity
                    key={room.id}
                    style={[
                      styles.optionItem,
                      admissionForm.room_id === room.id.toString() && styles.optionItemSelected,
                    ]}
                    onPress={() => setAdmissionForm({ ...admissionForm, room_id: room.id.toString() })}
                  >
                    <Text style={styles.optionItemText}>
                      Room {room.room_number} ({room.room_type.replace(/_/g, ' ')})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Department</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. ICU, General Ward"
                value={admissionForm.department}
                onChangeText={v => setAdmissionForm({ ...admissionForm, department: v })}
                placeholderTextColor={theme.colors.textTertiary}
              />

              <Text style={styles.modalLabel}>Reason for Admission</Text>
              <TextInput
                style={[styles.formInput, { minHeight: 100 }]}
                placeholder="Enter reason…"
                value={admissionForm.reason_for_admission}
                onChangeText={v => setAdmissionForm({ ...admissionForm, reason_for_admission: v })}
                multiline
                placeholderTextColor={theme.colors.textTertiary}
              />

              <Text style={styles.modalLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.formInput, { minHeight: 100 }]}
                placeholder="Additional notes…"
                value={admissionForm.notes}
                onChangeText={v => setAdmissionForm({ ...admissionForm, notes: v })}
                multiline
                placeholderTextColor={theme.colors.textTertiary}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <Button variant="outline" onPress={() => setModal(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={handleSubmitAdmission}
                loading={isSubmitting}
                disabled={!admissionForm.room_id}
              >
                Admit Patient
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgSecondary,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing['4xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.bgSecondary,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
  },
  message: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  successMessage: {
    backgroundColor: theme.colors.emerald100,
  },
  successText: {
    color: theme.colors.emerald700,
  },
  errorMessage: {
    backgroundColor: theme.colors.red100,
  },
  errorText: {
    color: theme.colors.red700,
  },
  messageText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  header: {
    marginBottom: theme.spacing['2xl'],
  },
  staffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.sm,
    alignSelf: 'flex-end',
  },
  staffAvatar: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  staffInitials: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  staffInfo: {
    justifyContent: 'center',
  },
  staffName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  staffRole: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  greeting: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  toolbar: {
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  searchIcon: {
    fontSize: theme.fontSize.lg,
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.base,
    color: theme.colors.textPrimary,
  },
  queueBtn: {
    alignSelf: 'flex-end',
  },
  tabsContainer: {
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  tab: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  tabActive: {
    borderBottomColor: theme.colors.purple,
  },
  tabLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  tabLabelActive: {
    color: theme.colors.purple,
    fontWeight: theme.fontWeight.bold,
  },
  tabBadge: {
    backgroundColor: theme.colors.purple,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  queueButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  queueButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing['6xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textTertiary,
  },
  recordsList: {
    gap: theme.spacing.md,
  },
  recordCard: {
    marginBottom: 0,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  doctorName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  roomInfo: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  statusSection: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.sm,
  },
  recordActions: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTopWidth: theme.spacing.md,
    gap: theme.spacing.md,
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  horizontalScroll: {
    marginHorizontal: -12,
    paddingHorizontal: 12,
  },
  tableWrapper: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  th: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  td: {
    fontSize: 10,
    color: '#0f172a',
    paddingHorizontal: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  statusWarning: {
    backgroundColor: '#fef3c7',
  },
  statusWarningText: {
    color: '#d97706',
    fontSize: 9,
    fontWeight: '600',
  },
  statusInfo: {
    backgroundColor: '#dbeafe',
  },
  statusInfoText: {
    color: '#0284c7',
    fontSize: 9,
    fontWeight: '600',
  },
  statusSuccess: {
    backgroundColor: '#dcfce7',
  },
  statusSuccessText: {
    color: '#16a34a',
    fontSize: 9,
    fontWeight: '600',
  },
  statusDefault: {
    backgroundColor: '#f3f4f6',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#6b7280',
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#3b82f6',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnDanger: {
    backgroundColor: '#dc2626',
  },
  actionBtnText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius['2xl'],
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    ...theme.shadows['2xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  modalClose: {
    fontSize: theme.fontSize['2xl'],
    color: theme.colors.textSecondary,
    paddingHorizontal: theme.spacing.md,
  },
  modalBody: {
    padding: theme.spacing['2xl'],
  },
  modalLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  modalSearchBox: {
    marginBottom: theme.spacing.lg,
  },
  modalSearchInput: {
    backgroundColor: theme.colors.bgTertiary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.base,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  noResultsText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textTertiary,
  },
  patientOption: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.bgTertiary,
  },
  patientOptionName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  patientOptionSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  formSectionLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  formGrid2: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    flexWrap: 'wrap',
  },
  formItem: {
    flex: 1,
    minWidth: 150,
  },
  formLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  formInput: {
    backgroundColor: theme.colors.bgTertiary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.base,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  formSelect: {
    backgroundColor: theme.colors.bgTertiary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  formSelectText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textPrimary,
  },
  genderDropdown: {
    backgroundColor: theme.colors.bgTertiary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  genderDropdownText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.semibold,
  },
  genderDropdownIcon: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  genderDropdownMenu: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
    marginTop: -theme.spacing.lg,
    ...theme.shadows.md,
  },
  genderOption: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  genderOptionText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textPrimary,
  },
  genderOptionSelected: {
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.blue,
  },
  bloodTypeDropdown: {
    backgroundColor: theme.colors.bgTertiary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bloodTypeDropdownText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.semibold,
  },
  bloodTypeDropdownIcon: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  bloodTypeDropdownMenu: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
    marginTop: -theme.spacing.lg,
    ...theme.shadows.md,
  },
  bloodTypeOption: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  bloodTypeOptionText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textPrimary,
  },
  bloodTypeOptionSelected: {
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.blue,
  },
  infoBox: {
    backgroundColor: theme.colors.bgTertiary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  infoBoxText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  optionsList: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.bgTertiary,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  optionItem: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionItemSelected: {
    backgroundColor: theme.colors.purple100,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.purple,
  },
  optionItemText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.semibold,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
