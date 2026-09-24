import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

type FilterType = 'All' | 'Admitted' | 'Awaiting Discharge' | 'Discharged';

export default function AdmissionManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [admissions, setAdmissions] = useState([]);
  const [filteredAdmissions, setFilteredAdmissions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');

  useEffect(() => {
    fetchAdmissions();
  }, []);

  useEffect(() => {
    filterAdmissions();
  }, [searchQuery, activeFilter, admissions]);

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admissions');
      const data = response.data.data || [];
      setAdmissions(data);
    } catch (err: any) {
      console.error('Admissions fetch error:', err);
      setAdmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAdmissions = () => {
    let filtered = [...admissions];

    // Apply status filter
    if (activeFilter !== 'All') {
      const statusMap: Record<FilterType, string> = {
        'All': '',
        'Admitted': 'active',
        'Awaiting Discharge': 'pending_discharge',
        'Discharged': 'discharged'
      };
      const status = statusMap[activeFilter];
      filtered = filtered.filter((a: any) => a.status === status);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((a: any) => {
        const patientName = `${a.patient?.first_name} ${a.patient?.last_name}`.toLowerCase();
        const doctorName = `${a.doctor?.first_name} ${a.doctor?.last_name}`.toLowerCase();
        const roomNumber = a.room?.room_number?.toLowerCase() || '';
        return patientName.includes(query) || doctorName.includes(query) || roomNumber.includes(query);
      });
    }

    setFilteredAdmissions(filtered);
  };

  const filters: FilterType[] = ['All', 'Admitted', 'Awaiting Discharge', 'Discharged'];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Staff Badge */}
        <View style={styles.staffBadge}>
          <View style={styles.staffAvatar}>
            <Text style={styles.staffInitials}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Text>
          </View>
          <View style={styles.staffInfo}>
            <Text style={styles.staffName}>{user?.first_name} {user?.last_name}</Text>
            <Text style={styles.staffRole}>Information Desk</Text>
          </View>
        </View>

        {/* Main Card */}
        <View style={styles.mainCard}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.headerIcon}>🛏️</Text>
              <Text style={styles.headerTitle}>Admission Management</Text>
            </View>
          </View>

          {/* Search and New Button */}
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search patient..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={styles.newButton}>
              <Text style={styles.plusIcon}>+</Text>
              <Text style={styles.newButtonText}>New Admission</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterTabs}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterTab,
                  activeFilter === filter && styles.filterTabActive
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[
                  styles.filterTabText,
                  activeFilter === filter && styles.filterTabTextActive
                ]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Table Container with Horizontal Scroll */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true}
            style={styles.tableScrollContainer}
          >
            <View style={styles.tableContainer}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.colPatient]}>PATIENT</Text>
                <Text style={[styles.tableHeaderText, styles.colRoom]}>ROOM</Text>
                <Text style={[styles.tableHeaderText, styles.colDoctor]}>DOCTOR</Text>
                <Text style={[styles.tableHeaderText, styles.colAdmitted]}>ADMITTED</Text>
                <Text style={[styles.tableHeaderText, styles.colStatus]}>STATUS</Text>
                <Text style={[styles.tableHeaderText, styles.colActions]}>ACTIONS</Text>
              </View>

              {/* Table Body */}
              <View style={styles.tableBody}>
                {filteredAdmissions.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No admissions found</Text>
                  </View>
                ) : (
                  filteredAdmissions.map((admission: any, index: number) => (
                    <View key={admission.id || index} style={styles.tableRow}>
                      <Text style={[styles.tableCellText, styles.colPatient]}>
                        {admission.patient?.first_name} {admission.patient?.last_name}
                      </Text>
                      <Text style={[styles.tableCellText, styles.colRoom]}>
                        {admission.room?.room_number || 'N/A'}
                      </Text>
                      <Text style={[styles.tableCellText, styles.colDoctor]}>
                        Dr. {admission.doctor?.last_name || 'N/A'}
                      </Text>
                      <Text style={[styles.tableCellText, styles.colAdmitted]}>
                        {new Date(admission.admission_date).toLocaleDateString()}
                      </Text>
                      <View style={[styles.tableCell, styles.colStatus]}>
                        <View style={[
                          styles.statusBadge,
                          admission.status === 'active' && styles.statusActive,
                          admission.status === 'discharged' && styles.statusDischarged
                        ]}>
                          <Text style={styles.statusText}>
                            {admission.status === 'active' ? 'Active' : 
                             admission.status === 'discharged' ? 'Discharged' : 
                             'Pending'}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.tableCell, styles.colActions]}>
                        <TouchableOpacity style={styles.actionButton}>
                          <Text style={styles.actionButtonText}>•••</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
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
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  staffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    alignSelf: 'flex-end',
  },
  staffAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  staffInitials: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  staffInfo: {
    justifyContent: 'center',
  },
  staffName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  staffRole: {
    fontSize: 13,
    color: '#64748b',
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  plusIcon: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
  },
  newButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
  },
  filterTabActive: {
    backgroundColor: '#e0f2fe',
  },
  filterTabText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#3b82f6',
  },
  tableScrollContainer: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  tableContainer: {
    minWidth: 800,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  colPatient: {
    width: 150,
  },
  colRoom: {
    width: 80,
  },
  colDoctor: {
    width: 120,
  },
  colAdmitted: {
    width: 120,
  },
  colStatus: {
    width: 100,
  },
  colActions: {
    width: 80,
  },
  tableBody: {
    minHeight: 200,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  tableCell: {
    justifyContent: 'center',
  },
  tableCellText: {
    fontSize: 13,
    color: '#0f172a',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignSelf: 'flex-start',
  },
  statusActive: {
    backgroundColor: '#d1fae5',
  },
  statusDischarged: {
    backgroundColor: '#e0e7ff',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  actionButton: {
    padding: 4,
  },
  actionButtonText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: '700',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
  },
});
