import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useOrientation } from '../../hooks/useOrientation';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  contact_number?: string;
  patient_type?: string;
  user?: { email?: string };
}

const PATIENT_TABS = [
  { value: 'all', label: 'All Patients' },
  { value: 'admitted', label: 'Active / Admitted' },
  { value: 'pending_admission', label: 'Pending' },
  { value: 'outpatient', label: 'Outpatient' },
];

export default function PatientManagement({ route }: any) {
  const navigation = useNavigation<any>();
  const { width, height, isLandscape } = useOrientation();
  const isTablet = width >= 768;

  const targetTab = route?.params?.initialTab || route?.params?.tab || route?.params?.status;
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(targetTab || 'all');
  const [loading, setLoading] = useState(true);

  // Sync tab whenever route params change (e.g. from AdminDashboard cards)
  useEffect(() => {
    const newTab = route?.params?.initialTab || route?.params?.tab || route?.params?.status;
    if (newTab) {
      setActiveTab(newTab);
    }
  }, [route?.params?.initialTab, route?.params?.tab, route?.params?.status, route?.params?.timestamp]);

  // Responsive column widths
  const minColWidth = 80;
  const availableWidth = Math.max(width - 32, minColWidth * 6);
  const totalCols = 6; // Patient, Gender, DOB, Contact, Status, Actions
  
  const COL_PATIENT = Math.max(140, availableWidth * 0.28);
  const COL_GENDER = Math.max(minColWidth, availableWidth * 0.12);
  const COL_DOB = Math.max(minColWidth, availableWidth * 0.18);
  const COL_CONTACT = Math.max(minColWidth, availableWidth * 0.18);
  const COL_STATUS = Math.max(minColWidth, availableWidth * 0.15);
  const COL_ACTIONS = Math.max(minColWidth, availableWidth * 0.09);
  
  const TABLE_WIDTH = COL_PATIENT + COL_GENDER + COL_DOB + COL_CONTACT + COL_STATUS + COL_ACTIONS;
  const needsHorizontalScroll = TABLE_WIDTH > width - 32;

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

  function getInitials(p: Patient) {
    return `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase();
  }

  // Matches web's getStatusBadge exactly
  function StatusBadge({ type }: { type?: string }) {
    let bg = '#f1f5f9';
    let color = '#64748b';
    let label = 'None';

    switch (type) {
      case 'admitted':
        bg = '#dcfce7';
        color = '#16a34a';
        label = 'Admitted';
        break;
      case 'pending_admission':
        bg = '#dbeafe';
        color = '#2563eb';
        label = 'Pending Admission';
        break;
      case 'outpatient':
        bg = '#fef3c7';
        color = '#d97706';
        label = 'Outpatient';
        break;
    }

    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color }]}>{label}</Text>
      </View>
    );
  }

  // Filter patients by active status tab
  const filteredPatients = patients.filter((p) => {
    if (activeTab === 'all') return true;
    const pType = (p.patient_type || '').toLowerCase();
    if (activeTab === 'admitted') return pType === 'admitted';
    if (activeTab === 'pending_admission') return pType === 'pending_admission';
    if (activeTab === 'outpatient') return pType === 'outpatient';
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Status Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {PATIENT_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.value}
              onPress={() => setActiveTab(tab.value)}
              style={[styles.tab, activeTab === tab.value && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.value && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Table */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : filteredPatients.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No patients found in this category</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.tableVerticalScroll}
          showsVerticalScrollIndicator={true}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={needsHorizontalScroll}
            style={styles.tableScroll}
          >
            <View style={{ width: TABLE_WIDTH }}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: COL_PATIENT }]}>Patient</Text>
                <Text style={[styles.th, { width: COL_GENDER }]}>Gender</Text>
                <Text style={[styles.th, { width: COL_DOB }]}>
                  Date of Birth
                </Text>
                <Text style={[styles.th, { width: COL_CONTACT }]}>Contact</Text>
                <Text style={[styles.th, { width: COL_STATUS }]}>Status</Text>
                <Text style={[styles.th, { width: COL_ACTIONS }]}>
                  Actions
                </Text>
              </View>

              {/* Table Rows */}
              {filteredPatients.map((p, idx) => (
                <View
                  key={p.id}
                  style={[
                    styles.tableRow,
                    idx % 2 === 0 && styles.tableRowEven,
                  ]}
                >
                  {/* Patient */}
                  <View
                    style={[styles.patientCell, { width: COL_PATIENT }]}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {getInitials(p)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={styles.patientName}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {p.first_name} {p.last_name}
                      </Text>
                      <Text
                        style={styles.patientEmail}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {p.user?.email || '—'}
                      </Text>
                    </View>
                  </View>

                  {/* Gender */}
                  <Text
                    style={[
                      styles.td,
                      { width: COL_GENDER, textTransform: 'capitalize' },
                    ]}
                    numberOfLines={1}
                  >
                    {p.gender || '—'}
                  </Text>

                  {/* DOB */}
                  <Text
                    style={[styles.tdMuted, { width: COL_DOB }]}
                    numberOfLines={1}
                  >
                    {p.date_of_birth
                      ? new Date(p.date_of_birth).toLocaleDateString()
                      : '—'}
                  </Text>

                  {/* Contact */}
                  <Text
                    style={[styles.tdMuted, { width: COL_CONTACT }]}
                    numberOfLines={1}
                  >
                    {p.contact_number || '—'}
                  </Text>

                  {/* Status */}
                  <View style={{ width: COL_STATUS }}>
                    <StatusBadge type={p.patient_type} />
                  </View>

                  {/* Actions */}
                  <View
                    style={[styles.actionsCell, { width: COL_ACTIONS }]}
                  >
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() =>
                        navigation.navigate('PatientRecord', {
                          patientId: p.id,
                        })
                      }
                    >
                      <Text style={styles.actionBtnText}>View</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      )}

      {!isTablet && patients.length > 0 && needsHorizontalScroll ? (
        <Text style={styles.scrollHint}>← Swipe to see more →</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b' },

  // Tabs
  tabsRow: {
    gap: 8,
    paddingBottom: 2,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  tabActive: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#3b82f6',
    fontWeight: '700',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1e293b' },

  // Table
  tableVerticalScroll: { flex: 1 },
  tableScroll: { flex: 1 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  tableBody: { maxHeight: 600 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  tableRowEven: { backgroundColor: '#fafbfc' },

  patientCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  patientName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  patientEmail: { fontSize: 12, color: '#64748b', marginTop: 2 },
  td: { fontSize: 14, color: '#1e293b' },
  tdMuted: { fontSize: 13, color: '#64748b' },

  // Status badge
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // Actions
  actionsCell: { alignItems: 'center', justifyContent: 'center' },
  actionBtn: {
    width: 60,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  // Empty
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#94a3b8' },

  scrollHint: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 8,

  },
});