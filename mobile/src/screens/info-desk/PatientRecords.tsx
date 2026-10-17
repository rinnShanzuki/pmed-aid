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
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { useOrientation } from '../../hooks/useOrientation';
import api from '../../services/api';

type StatusFilter = 'all' | 'active' | 'inactive';
type SortOption = 'recent-old' | 'old-recent' | 'a-z' | 'z-a' | 'id-asc' | 'id-desc';

export default function PatientRecords() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { width, height, isLandscape } = useOrientation();
  
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('recent-old');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/patients');
      const data = response.data.data || [];
      setPatients(data);
    } catch (err: any) {
      console.error('Patients fetch error:', err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = (patient: any) => {
    const isCurrentlyActive = patient.status === 'active';
    const newStatus = isCurrentlyActive ? 'inactive' : 'active';
    const patientName = `${patient.first_name} ${patient.last_name}`;

    Alert.alert(
      isCurrentlyActive ? 'Deactivate Patient' : 'Activate Patient',
      isCurrentlyActive
        ? `Are you sure you want to mark ${patientName} as Inactive? They will be archived from active doctor queues.`
        : `Mark ${patientName} as Active?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isCurrentlyActive ? 'Deactivate' : 'Activate',
          style: isCurrentlyActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setUpdatingId(patient.id);
              await api.put(`/patients/${patient.id}/status`, { status: newStatus });
              // Update local state smoothly
              setPatients((prev) =>
                prev.map((p) => (p.id === patient.id ? { ...p, status: newStatus } : p))
              );
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to update patient status.');
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  const filteredAndSortedPatients = useMemo(() => {
    const filtered = patients.filter((p: any) => {
      // Status filter
      if (statusFilter === 'active' && p.status !== 'active') return false;
      if (statusFilter === 'inactive' && p.status === 'active') return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
        const contact = (p.contact_number || '').toLowerCase();
        return fullName.includes(query) || contact.includes(query);
      }
      return true;
    });

    return [...filtered].sort((a: any, b: any) => {
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
  }, [patients, searchQuery, statusFilter, sortOption]);

  const calculateAge = (dob: string) => {
    if (!dob) return '—';
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} yrs`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Calculate responsive table column widths
  const availableWidth = isLandscape ? width - 40 : width - 24;
  const numberOfColumns = 6;
  const minColWidth = 90;
  const maxTotalWidth = availableWidth;
  
  const equalWidth = maxTotalWidth / numberOfColumns;
  const colWidth = Math.max(minColWidth, Math.floor(equalWidth));
  const totalTableWidth = colWidth * numberOfColumns;
  const needsHorizontalScroll = totalTableWidth > maxTotalWidth;

  const activeCount = patients.filter((p: any) => p.status === 'active').length;
  const inactiveCount = patients.filter((p: any) => p.status === 'inactive').length;

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          isLandscape && styles.scrollContentLandscape
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar & Status Filters */}
        <View style={styles.filterSection}>
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <TextInput
                placeholder="Search by name or contact…"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                placeholderTextColor="#94a3b8"
              />
            </View>
            <TouchableOpacity
              style={styles.newPatientBtn}
              onPress={() => navigation.navigate('PatientRegistration')}
            >
              <Text style={styles.newPatientBtnText}>+ Register</Text>
            </TouchableOpacity>
          </View>

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
                Active ({activeCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusTab, statusFilter === 'inactive' && styles.statusTabActive]}
              onPress={() => setStatusFilter('inactive')}
            >
              <Text style={[styles.statusTabText, statusFilter === 'inactive' && styles.statusTabTextActive]}>
                Inactive ({inactiveCount})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sort Pills Row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.sortScroll}
            contentContainerStyle={styles.sortContainer}
          >
            <Text style={styles.sortLabel}>Sort:</Text>
            {[
              { id: 'recent-old', label: 'Newest' },
              { id: 'old-recent', label: 'Oldest' },
              { id: 'a-z', label: 'A-Z' },
              { id: 'z-a', label: 'Z-A' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.sortPill, sortOption === opt.id && styles.sortPillActive]}
                onPress={() => setSortOption(opt.id as SortOption)}
              >
                <Text style={[styles.sortPillText, sortOption === opt.id && styles.sortPillTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Main Table Card */}
        <View style={styles.mainCard}>
          <ScrollView 
            horizontal={needsHorizontalScroll} 
            showsHorizontalScrollIndicator={needsHorizontalScroll}
            style={styles.horizontalScroll}
            contentContainerStyle={{
              width: needsHorizontalScroll ? totalTableWidth : '100%'
            }}
          >
            <View style={[
              styles.tableWrapper,
              isLandscape && styles.tableWrapperLandscape
            ]}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: colWidth }]}>PATIENT</Text>
                <Text style={[styles.th, { width: colWidth }]}>AGE/DOB</Text>
                <Text style={[styles.th, { width: colWidth }]}>GENDER</Text>
                <Text style={[styles.th, { width: colWidth }]}>CONTACT</Text>
                <Text style={[styles.th, { width: colWidth }]}>STATUS</Text>
                <Text style={[styles.th, { width: colWidth }]}>ACTIONS</Text>
              </View>

              {/* Table Rows */}
              {filteredAndSortedPatients.length === 0 ? (
                <Text style={styles.emptyState}>No patients found</Text>
              ) : (
                filteredAndSortedPatients.map((patient: any, idx) => (
                  <View key={patient.id || idx} style={styles.tableRow}>
                    <Text 
                      style={[styles.td, { width: colWidth, fontWeight: '600' }]} 
                      numberOfLines={2}
                    >
                      {patient.first_name} {patient.last_name}
                    </Text>
                    <Text style={[styles.td, { width: colWidth }]}>
                      {calculateAge(patient.date_of_birth)}
                    </Text>
                    <View style={[styles.td, { width: colWidth, justifyContent: 'center' }]}>
                      <View style={[
                        styles.genderBadge,
                        patient.gender?.toLowerCase() === 'male' && styles.genderMale,
                        patient.gender?.toLowerCase() === 'female' && styles.genderFemale
                      ]}>
                        <Text style={styles.genderText} numberOfLines={1}>
                          {patient.gender || '—'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.td, { width: colWidth }]} numberOfLines={1}>
                      {patient.contact_number || '—'}
                    </Text>
                    
                    {/* Status Badge */}
                    <View style={[styles.td, { width: colWidth, justifyContent: 'center' }]}>
                      <View style={[
                        styles.statusBadge,
                        patient.status === 'active' ? styles.statusActive : styles.statusInactive
                      ]}>
                        <Text style={[
                          styles.statusBadgeText,
                          patient.status === 'active' ? styles.statusActiveText : styles.statusInactiveText
                        ]} numberOfLines={1}>
                          {patient.status === 'active' ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>

                    {/* Actions: View Record & Status Toggle */}
                    <View style={[styles.td, { width: colWidth, justifyContent: 'center', alignItems: 'center' }]}>
                      <View style={styles.actionsContainer}>
                        <TouchableOpacity 
                          style={styles.viewButton}
                          onPress={() => navigation.navigate('PatientDetail', { patientId: patient.id })}
                        >
                          <Text style={styles.viewButtonText}>View</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={[
                            styles.toggleButton,
                            patient.status === 'active' ? styles.toggleDeactivate : styles.toggleActivate
                          ]}
                          disabled={updatingId === patient.id}
                          onPress={() => handleToggleStatus(patient)}
                        >
                          {updatingId === patient.id ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.toggleButtonText}>
                              {patient.status === 'active' ? '✕' : '✓'}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 40,
  },
  scrollContentLandscape: {
    padding: 16,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  searchContainer: {
    flex: 1,
  },
  newPatientBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newPatientBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0f172a',
  },
  filterSection: {
    marginBottom: 12,
  },
  statusTabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  statusTabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  statusTabText: {
    fontSize: 12,
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
    borderColor: '#3b82f6',
  },
  sortPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  sortPillTextActive: {
    color: '#2563eb',
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
    minWidth: '100%',
  },
  tableWrapperLandscape: {
    width: '100%',
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
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    paddingHorizontal: 6,
    textAlign: 'center',
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
    fontSize: 12,
    color: '#0f172a',
    paddingHorizontal: 6,
    textAlign: 'center',
  },
  genderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  genderMale: {
    backgroundColor: '#dbeafe',
  },
  genderFemale: {
    backgroundColor: '#fce7f3',
  },
  genderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0f172a',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'center',
  },
  statusActive: {
    backgroundColor: '#dcfce7',
  },
  statusInactive: {
    backgroundColor: '#f1f5f9',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusActiveText: {
    color: '#16a34a',
  },
  statusInactiveText: {
    color: '#64748b',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  viewButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3b82f6',
  },
  toggleButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleActivate: {
    backgroundColor: '#16a34a',
  },
  toggleDeactivate: {
    backgroundColor: '#ef4444',
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  emptyState: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
