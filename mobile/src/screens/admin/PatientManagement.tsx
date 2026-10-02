import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
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

export default function PatientManagement() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Fixed column widths for horizontal scroll
  const TABLE_WIDTH = 820;
  const COL_PATIENT = 260;
  const COL_GENDER = 100;
  const COL_DOB = 130;
  const COL_CONTACT = 150;
  const COL_STATUS = 120;
  const COL_ACTIONS = 80;

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏥 Patient Management</Text>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
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
      ) : patients.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No patients found</Text>
        </View>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
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
              <ScrollView
                style={styles.tableBody}
                showsVerticalScrollIndicator
                nestedScrollEnabled
              >
                {patients.map((p, idx) => (
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
                        <Text style={styles.actionIcon}>👁</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          {!isTablet ? (
            <Text style={styles.scrollHint}>← Swipe to see more →</Text>
          ) : null}
        </>
      )}
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
  tableScroll: { flex: 1, padding: 16 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
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
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: { fontSize: 16 },

  // Empty
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#94a3b8' },

  scrollHint: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 8,
    fontStyle: 'italic',
  },
});