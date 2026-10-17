import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useOrientation } from '../../hooks/useOrientation';
import api from '../../services/api';

interface PatientForm {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  civil_status: string;
  contact_number: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_number: string;
  blood_type: string;
  allergies: string;
  medical_history?: string;
}

const INITIAL_FORM: PatientForm = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  gender: 'male',
  civil_status: 'single',
  contact_number: '',
  address: '',
  emergency_contact_name: '',
  emergency_contact_number: '',
  blood_type: '',
  allergies: '',
  medical_history: '',
};

// Formats MM/DD/YYYY with character masking
function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

export default function PatientRegistration() {
  const navigation = useNavigation<any>();
  const { width, height, isLandscape } = useOrientation();

  // Mode: Register Form vs Registered Patients Directory
  const [activeMode, setActiveMode] = useState<'register' | 'directory'>('register');

  // Form State
  const [form, setForm] = useState<PatientForm>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Dropdown states for form
  const [genderPickerOpen, setGenderPickerOpen] = useState(false);
  const [bloodTypePickerOpen, setBloodTypePickerOpen] = useState(false);
  const [civilStatusPickerOpen, setCivilStatusPickerOpen] = useState(false);

  // Directory State
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortOption, setSortOption] = useState<'recent-old' | 'old-recent' | 'a-z' | 'z-a' | 'id-asc' | 'id-desc'>('recent-old');

  // Edit Modal State
  const [editingPatient, setEditingPatient] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<PatientForm>(INITIAL_FORM);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (activeMode === 'directory') {
      fetchPatients();
    }
  }, [activeMode, search]);

  const fetchPatients = async () => {
    try {
      setLoadingDirectory(true);
      const res = await api.get('/patients', { params: { search } });
      setPatients(res.data.data || []);
    } catch (err) {
      console.error('Fetch patients error:', err);
    } finally {
      setLoadingDirectory(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // SUBMIT NEW PATIENT REGISTRATION
  // ─────────────────────────────────────────────────────────────
  const handleRegisterPatient = async () => {
    setFormError('');
    setFormSuccess('');

    // Validation
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setFormError('First Name and Last Name are required.');
      return;
    }
    if (!form.date_of_birth.trim()) {
      setFormError('Date of birth is required (MM/DD/YYYY).');
      return;
    }
    if (form.date_of_birth.length !== 10) {
      setFormError('Please enter a complete date of birth in MM/DD/YYYY format.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/patients', {
        ...form,
        status: 'active',
      });

      const newPatient = res.data.data;
      setFormSuccess(`Patient ${newPatient.first_name} ${newPatient.last_name} registered successfully!`);
      setForm(INITIAL_FORM);

      Alert.alert(
        'Registration Successful',
        `Patient ${newPatient.first_name} ${newPatient.last_name} (ID: ${newPatient.id}) has been registered.`,
        [
          {
            text: 'View Record',
            onPress: () => navigation.navigate('PatientDetail', { patientId: newPatient.id }),
          },
          {
            text: 'Register Another',
            style: 'cancel',
          },
        ]
      );
    } catch (err: any) {
      console.error('Registration error:', err);
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to register patient.';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // EDIT PATIENT MODAL
  // ─────────────────────────────────────────────────────────────
  const openEditModal = (p: any) => {
    setEditingPatient(p);
    setEditForm({
      first_name: p.first_name || '',
      last_name: p.last_name || '',
      date_of_birth: p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      }) : '',
      gender: p.gender || 'male',
      civil_status: p.civil_status || 'single',
      contact_number: p.contact_number || '',
      address: p.address || '',
      emergency_contact_name: p.emergency_contact_name || '',
      emergency_contact_number: p.emergency_contact_number || '',
      blood_type: p.blood_type || '',
      allergies: p.allergies || '',
      medical_history: p.medical_history || '',
    });
  };

  const handleUpdatePatient = async () => {
    if (!editingPatient) return;
    try {
      setIsUpdating(true);
      await api.put(`/patients/${editingPatient.id}`, editForm);
      Alert.alert('Success', 'Patient information updated successfully.');
      setEditingPatient(null);
      fetchPatients();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update patient.');
    } finally {
      setIsUpdating(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // TOGGLE STATUS
  // ─────────────────────────────────────────────────────────────
  const handleToggleStatus = (p: any) => {
    const isCurrentlyActive = p.status === 'active';
    const newStatus = isCurrentlyActive ? 'inactive' : 'active';
    const fullName = `${p.first_name} ${p.last_name}`;

    Alert.alert(
      isCurrentlyActive ? 'Deactivate Patient' : 'Activate Patient',
      isCurrentlyActive
        ? `Archive ${fullName}? They will be marked as Inactive in hospital queues.`
        : `Mark ${fullName} as Active?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isCurrentlyActive ? 'Deactivate' : 'Activate',
          style: isCurrentlyActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await api.put(`/patients/${p.id}/status`, { status: newStatus });
              setPatients(prev => prev.map(item => item.id === p.id ? { ...item, status: newStatus } : item));
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to update status.');
            }
          },
        },
      ]
    );
  };

  // ─────────────────────────────────────────────────────────────
  // FILTERED DIRECTORY
  // ─────────────────────────────────────────────────────────────
  const filteredAndSortedPatients = useMemo(() => {
    const filtered = patients.filter(p => {
      if (statusFilter === 'active' && p.status !== 'active') return false;
      if (statusFilter === 'inactive' && p.status === 'active') return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
      const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
      const nameA = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
      const nameB = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();

      const idA = a.id || 0;
      const idB = b.id || 0;

      switch (sortOption) {
        case 'old-recent':
          return dateA - dateB;
        case 'a-z':
          return nameA.localeCompare(nameB);
        case 'z-a':
          return nameB.localeCompare(nameA);
        case 'id-asc':
          return idA - idB;
        case 'id-desc':
          return idB - idA;
        case 'recent-old':
        default:
          return dateB - dateA;
      }
    });
  }, [patients, statusFilter, sortOption]);

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const civilStatuses = ['single', 'married', 'divorced', 'widowed'];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>Patient Registration</Text>
          <Text style={styles.headerSubtitle}>Register new patients and manage clinical demographics</Text>
        </View>

        {/* Mode Segmented Controls */}
        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, activeMode === 'register' && styles.modeTabActive]}
            onPress={() => setActiveMode('register')}
          >
            <MaterialCommunityIcons
              name="account-plus"
              size={18}
              color={activeMode === 'register' ? '#2563eb' : '#64748b'}
            />
            <Text style={[styles.modeTabText, activeMode === 'register' && styles.modeTabTextActive]}>
              New Patient Form
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, activeMode === 'directory' && styles.modeTabActive]}
            onPress={() => setActiveMode('directory')}
          >
            <MaterialCommunityIcons
              name="account-group"
              size={18}
              color={activeMode === 'directory' ? '#2563eb' : '#64748b'}
            />
            <Text style={[styles.modeTabText, activeMode === 'directory' && styles.modeTabTextActive]}>
              Patient Directory
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─────────────────────────────────────────────────────────────
          MODE 1: NEW PATIENT REGISTRATION FORM
         ───────────────────────────────────────────────────────────── */}
      {activeMode === 'register' ? (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {formSuccess ? (
            <View style={styles.successBanner}>
              <Text style={styles.successBannerText}>✓ {formSuccess}</Text>
            </View>
          ) : null}

          {formError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>⚠ {formError}</Text>
            </View>
          ) : null}

          {/* Section 1: Personal Demographics */}
          <View style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account" size={18} color="#2563eb" />
              <Text style={styles.sectionTitle}>1. Personal Demographics</Text>
            </View>

            <View style={styles.row2}>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>First Name <Text style={styles.req}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Maria"
                  placeholderTextColor="#94a3b8"
                  value={form.first_name}
                  onChangeText={(v) => setForm({ ...form, first_name: v })}
                />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Last Name <Text style={styles.req}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Santos"
                  placeholderTextColor="#94a3b8"
                  value={form.last_name}
                  onChangeText={(v) => setForm({ ...form, last_name: v })}
                />
              </View>
            </View>

            <View style={styles.row2}>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Date of Birth (MM/DD/YYYY) <Text style={styles.req}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={form.date_of_birth}
                  onChangeText={(v) => setForm({ ...form, date_of_birth: formatDateInput(v) })}
                />
              </View>

              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Gender <Text style={styles.req}>*</Text></Text>
                <View style={styles.genderToggleRow}>
                  <TouchableOpacity
                    style={[styles.genderBtn, form.gender === 'male' && styles.genderBtnActive]}
                    onPress={() => setForm({ ...form, gender: 'male' })}
                  >
                    <Text style={[styles.genderBtnText, form.gender === 'male' && styles.genderBtnTextActive]}>
                      Male
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.genderBtn, form.gender === 'female' && styles.genderBtnActive]}
                    onPress={() => setForm({ ...form, gender: 'female' })}
                  >
                    <Text style={[styles.genderBtnText, form.gender === 'female' && styles.genderBtnTextActive]}>
                      Female
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.row2}>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Civil Status</Text>
                <TouchableOpacity
                  style={styles.selectInput}
                  onPress={() => setCivilStatusPickerOpen(!civilStatusPickerOpen)}
                >
                  <Text style={styles.selectInputText}>{form.civil_status.toUpperCase()}</Text>
                  <MaterialCommunityIcons name="chevron-down" size={18} color="#64748b" />
                </TouchableOpacity>

                {civilStatusPickerOpen && (
                  <View style={styles.dropdownMenu}>
                    {civilStatuses.map((st) => (
                      <TouchableOpacity
                        key={st}
                        style={[styles.dropdownItem, form.civil_status === st && styles.dropdownItemActive]}
                        onPress={() => {
                          setForm({ ...form, civil_status: st });
                          setCivilStatusPickerOpen(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, form.civil_status === st && styles.dropdownItemTextActive]}>
                          {st.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Blood Type</Text>
                <TouchableOpacity
                  style={styles.selectInput}
                  onPress={() => setBloodTypePickerOpen(!bloodTypePickerOpen)}
                >
                  <Text style={styles.selectInputText}>{form.blood_type || 'Select Blood Type'}</Text>
                  <MaterialCommunityIcons name="chevron-down" size={18} color="#64748b" />
                </TouchableOpacity>

                {bloodTypePickerOpen && (
                  <View style={styles.dropdownMenu}>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setForm({ ...form, blood_type: '' });
                        setBloodTypePickerOpen(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>None / Unknown</Text>
                    </TouchableOpacity>
                    {bloodTypes.map((bt) => (
                      <TouchableOpacity
                        key={bt}
                        style={[styles.dropdownItem, form.blood_type === bt && styles.dropdownItemActive]}
                        onPress={() => {
                          setForm({ ...form, blood_type: bt });
                          setBloodTypePickerOpen(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, form.blood_type === bt && styles.dropdownItemTextActive]}>
                          {bt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Section 2: Contact & Address */}
          <View style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="phone" size={18} color="#2563eb" />
              <Text style={styles.sectionTitle}>2. Contact & Residence</Text>
            </View>

            <View style={styles.fieldFull}>
              <Text style={styles.fieldLabel}>Contact Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 0917-123-4567"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={form.contact_number}
                onChangeText={(v) => setForm({ ...form, contact_number: v })}
              />
            </View>

            <View style={styles.fieldFull}>
              <Text style={styles.fieldLabel}>Home / Permanent Address</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 123 Rizal St, Barangay Central, City"
                placeholderTextColor="#94a3b8"
                value={form.address}
                onChangeText={(v) => setForm({ ...form, address: v })}
              />
            </View>
          </View>

          {/* Section 3: Emergency Contacts */}
          <View style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="shield-account" size={18} color="#2563eb" />
              <Text style={styles.sectionTitle}>3. Emergency Contact Details</Text>
            </View>

            <View style={styles.row2}>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Contact Person</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Pedro Santos (Spouse)"
                  placeholderTextColor="#94a3b8"
                  value={form.emergency_contact_name}
                  onChangeText={(v) => setForm({ ...form, emergency_contact_name: v })}
                />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Emergency Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 0918-987-6543"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  value={form.emergency_contact_number}
                  onChangeText={(v) => setForm({ ...form, emergency_contact_number: v })}
                />
              </View>
            </View>
          </View>

          {/* Section 4: Clinical History & Allergies */}
          <View style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="heart-pulse" size={18} color="#2563eb" />
              <Text style={styles.sectionTitle}>4. Medical Notes & Allergies</Text>
            </View>

            <View style={styles.fieldFull}>
              <Text style={styles.fieldLabel}>Known Allergies (Food / Drugs)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g. Penicillin, Amoxicillin, Peanuts (or None)"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={2}
                value={form.allergies}
                onChangeText={(v) => setForm({ ...form, allergies: v })}
              />
            </View>

            <View style={styles.fieldFull}>
              <Text style={styles.fieldLabel}>Medical History / Pre-existing Conditions</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g. Hypertension, Diabetes Type 2, Asthma"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={2}
                value={form.medical_history}
                onChangeText={(v) => setForm({ ...form, medical_history: v })}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            disabled={isSubmitting}
            onPress={handleRegisterPatient}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Register Patient</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* ─────────────────────────────────────────────────────────────
           MODE 2: REGISTERED PATIENT DIRECTORY
           ───────────────────────────────────────────────────────────── */
        <View style={styles.directoryContainer}>
          {/* Search input */}
          <View style={styles.searchBarContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchField}
              placeholder="Search patients by name or contact…"
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Filters & Sort Pills */}
          <View style={styles.filtersSection}>
            {/* Status Tabs */}
            <View style={styles.statusTabs}>
              <TouchableOpacity
                style={[styles.statusTab, statusFilter === 'all' && styles.statusTabActive]}
                onPress={() => setStatusFilter('all')}
              >
                <Text style={[styles.statusTabText, statusFilter === 'all' && styles.statusTabTextActive]}>
                  All ({patients.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusTab, statusFilter === 'active' && styles.statusTabActive]}
                onPress={() => setStatusFilter('active')}
              >
                <Text style={[styles.statusTabText, statusFilter === 'active' && styles.statusTabTextActive]}>
                  Active ({patients.filter(p => p.status === 'active').length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusTab, statusFilter === 'inactive' && styles.statusTabActive]}
                onPress={() => setStatusFilter('inactive')}
              >
                <Text style={[styles.statusTabText, statusFilter === 'inactive' && styles.statusTabTextActive]}>
                  Inactive ({patients.filter(p => p.status === 'inactive').length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sort pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
              <View style={styles.sortContainer}>
                <Text style={styles.sortLabel}>Sort:</Text>
                {[
                  { id: 'recent-old' as const, label: 'Newest' },
                  { id: 'old-recent' as const, label: 'Oldest' },
                  { id: 'a-z' as const, label: 'Name (A–Z)' },
                  { id: 'z-a' as const, label: 'Name (Z–A)' },
                  { id: 'id-asc' as const, label: 'ID (Low–High)' },
                  { id: 'id-desc' as const, label: 'ID (High–Low)' },
                ].map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.sortPill, sortOption === s.id && styles.sortPillActive]}
                    onPress={() => setSortOption(s.id)}
                  >
                    <Text style={[styles.sortPillText, sortOption === s.id && styles.sortPillTextActive]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Patient Directory List */}
          {loadingDirectory ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Loading directory…</Text>
            </View>
          ) : filteredAndSortedPatients.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No registered patients found.</Text>
            </View>
          ) : (
            <ScrollView style={styles.patientListScroll} showsVerticalScrollIndicator={false}>
              {filteredAndSortedPatients.map((p) => {
                const isActive = p.status === 'active';
                return (
                  <View key={p.id} style={styles.patientCard}>
                    <View style={styles.patientCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.patientCardName}>
                          {p.first_name} {p.last_name}
                        </Text>
                        <Text style={styles.patientCardMeta}>
                          ID: #{p.id} • {p.gender ? p.gender.toUpperCase() : '—'} • Blood: {p.blood_type || '—'}
                        </Text>
                      </View>
                      <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeInactive]}>
                        <Text style={[styles.badgeText, isActive ? styles.badgeActiveText : styles.badgeInactiveText]}>
                          {isActive ? 'ACTIVE' : 'INACTIVE'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.patientCardDetails}>
                      <Text style={styles.detailItem}>
                        <Text style={styles.detailLabel}>DOB: </Text>
                        {p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : '—'}
                      </Text>
                      <Text style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Phone: </Text>
                        {p.contact_number || '—'}
                      </Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={styles.actionBtnOutline}
                        onPress={() => navigation.navigate('PatientDetail', { patientId: p.id })}
                      >
                        <MaterialCommunityIcons name="eye-outline" size={15} color="#2563eb" />
                        <Text style={styles.actionBtnOutlineText}>View Record</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtnOutline}
                        onPress={() => openEditModal(p)}
                      >
                        <MaterialCommunityIcons name="pencil-outline" size={15} color="#475569" />
                        <Text style={[styles.actionBtnOutlineText, { color: '#475569' }]}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.statusToggleBtn, isActive ? styles.btnDeactivate : styles.btnActivate]}
                        onPress={() => handleToggleStatus(p)}
                      >
                        <MaterialCommunityIcons
                          name={isActive ? 'power-off' : 'power'}
                          size={15}
                          color={isActive ? '#dc2626' : '#16a34a'}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}

      {/* ─────────────────────────────────────────────────────────────
          EDIT PATIENT MODAL
         ───────────────────────────────────────────────────────────── */}
      {editingPatient && (
        <Modal
          visible={!!editingPatient}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setEditingPatient(null)}
        >
          <KeyboardAvoidingView
            style={styles.modalRoot}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Edit Patient #{editingPatient.id}
              </Text>
              <TouchableOpacity onPress={() => setEditingPatient(null)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.row2}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>First Name</Text>
                  <TextInput
                    style={styles.input}
                    value={editForm.first_name}
                    onChangeText={(v) => setEditForm({ ...editForm, first_name: v })}
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Last Name</Text>
                  <TextInput
                    style={styles.input}
                    value={editForm.last_name}
                    onChangeText={(v) => setEditForm({ ...editForm, last_name: v })}
                  />
                </View>
              </View>

              <View style={styles.row2}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Date of Birth</Text>
                  <TextInput
                    style={styles.input}
                    value={editForm.date_of_birth}
                    onChangeText={(v) => setEditForm({ ...editForm, date_of_birth: formatDateInput(v) })}
                    placeholder="MM/DD/YYYY"
                    maxLength={10}
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Gender</Text>
                  <View style={styles.genderToggleRow}>
                    <TouchableOpacity
                      style={[styles.genderBtn, editForm.gender === 'male' && styles.genderBtnActive]}
                      onPress={() => setEditForm({ ...editForm, gender: 'male' })}
                    >
                      <Text style={[styles.genderBtnText, editForm.gender === 'male' && styles.genderBtnTextActive]}>
                        Male
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.genderBtn, editForm.gender === 'female' && styles.genderBtnActive]}
                      onPress={() => setEditForm({ ...editForm, gender: 'female' })}
                    >
                      <Text style={[styles.genderBtnText, editForm.gender === 'female' && styles.genderBtnTextActive]}>
                        Female
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.fieldFull}>
                <Text style={styles.fieldLabel}>Contact Number</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.contact_number}
                  onChangeText={(v) => setEditForm({ ...editForm, contact_number: v })}
                />
              </View>

              <View style={styles.fieldFull}>
                <Text style={styles.fieldLabel}>Address</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.address}
                  onChangeText={(v) => setEditForm({ ...editForm, address: v })}
                />
              </View>

              <View style={styles.fieldFull}>
                <Text style={styles.fieldLabel}>Allergies</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editForm.allergies}
                  onChangeText={(v) => setEditForm({ ...editForm, allergies: v })}
                  multiline
                />
              </View>

              <View style={styles.fieldFull}>
                <Text style={styles.fieldLabel}>Medical History</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editForm.medical_history}
                  onChangeText={(v) => setEditForm({ ...editForm, medical_history: v })}
                  multiline
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditingPatient(null)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveBtn, isUpdating && { opacity: 0.6 }]}
                disabled={isUpdating}
                onPress={handleUpdatePatient}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSaveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  titleRow: {
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modeTabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  modeTabTextActive: {
    color: '#2563eb',
    fontWeight: '700',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  successBanner: {
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
  },
  successBannerText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
  },
  errorBannerText: {
    color: '#991b1b',
    fontSize: 13,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  row2: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  fieldHalf: {
    flex: 1,
  },
  fieldFull: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  req: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  textArea: {
    minHeight: 56,
    textAlignVertical: 'top',
  },
  genderToggleRow: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    overflow: 'hidden',
    height: 40,
  },
  genderBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  genderBtnActive: {
    backgroundColor: '#2563eb',
  },
  genderBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  genderBtnTextActive: {
    color: '#fff',
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectInputText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemActive: {
    backgroundColor: '#eff6ff',
  },
  dropdownItemText: {
    fontSize: 12,
    color: '#334155',
  },
  dropdownItemTextActive: {
    color: '#2563eb',
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 20,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  // Directory Styles
  directoryContainer: {
    flex: 1,
    padding: 14,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchField: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  filtersSection: {
    marginBottom: 10,
  },
  statusTabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 3,
    marginBottom: 8,
  },
  statusTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusTabActive: {
    backgroundColor: '#fff',
    elevation: 1,
  },
  statusTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  statusTabTextActive: {
    color: '#0f172a',
  },
  sortScroll: {
    marginBottom: 2,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginRight: 4,
  },
  sortPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sortPillActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  sortPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  sortPillTextActive: {
    color: '#2563eb',
  },
  patientListScroll: {
    flex: 1,
  },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 10,
  },
  patientCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  patientCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  patientCardMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeActive: {
    backgroundColor: '#dcfce7',
  },
  badgeInactive: {
    backgroundColor: '#f1f5f9',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  badgeActiveText: {
    color: '#16a34a',
  },
  badgeInactiveText: {
    color: '#64748b',
  },
  patientCardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
    marginVertical: 8,
  },
  detailItem: {
    fontSize: 11,
    color: '#334155',
  },
  detailLabel: {
    fontWeight: '700',
    color: '#64748b',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  actionBtnOutlineText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563eb',
  },
  statusToggleBtn: {
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActivate: {
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
  },
  btnDeactivate: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748b',
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },

  // Modal Styles
  modalRoot: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  modalCancelBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },
  modalSaveBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  modalSaveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
