import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useOrientation } from '../../hooks/useOrientation';
import api from '../../services/api';

type TabType = 'all' | 'outpatient' | 'admitted';
type SortOption = 'recent-old' | 'old-recent' | 'a-z' | 'z-a';

export default function PrescriptionManagement() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { width, height, isLandscape } = useOrientation();
  
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [sortOption, setSortOption] = useState<SortOption>('recent-old');
  const [handoverCount, setHandoverCount] = useState(0);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    if (route.params?.patientName) {
      setSearchQuery(route.params.patientName);
    }
    if (route.params?.tab) {
      setActiveTab(route.params.tab);
    }
  }, [route.params]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/prescriptions');
      const data = response.data.data || [];
      setPrescriptions(data);

      const handoverRx = data.filter((p: any) => p.status === 'pending_encoding');
      setHandoverCount(handoverRx.length);
    } catch (err: any) {
      console.error('Prescriptions fetch error:', err);
      setPrescriptions([]);
      setHandoverCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Visibility check matching web app
  const isVisible = (rx: any) => {
    if (rx.type === 'outpatient') return true;
    return rx.admission_id != null;
  };

  // Counts for each tab
  const allCount = useMemo(() => {
    return prescriptions.filter((rx: any) => isVisible(rx)).length;
  }, [prescriptions]);

  const outpatientCount = useMemo(() => {
    return prescriptions.filter((rx: any) => rx.status === 'active' && rx.type === 'outpatient' && isVisible(rx)).length;
  }, [prescriptions]);

  const inpatientCount = useMemo(() => {
    return prescriptions.filter((rx: any) => rx.status === 'active' && rx.type !== 'outpatient' && isVisible(rx)).length;
  }, [prescriptions]);

  // Filtered and sorted prescriptions
  const filteredAndSortedPrescriptions = useMemo(() => {
    const filtered = prescriptions.filter((rx: any) => {
      if (!isVisible(rx)) return false;

      // In specific tabs, show only active. In 'all', show all visible prescriptions
      if (activeTab !== 'all' && rx.status !== 'active') return false;
      if (activeTab === 'outpatient' && rx.type !== 'outpatient') return false;
      if (activeTab === 'admitted' && rx.type === 'outpatient') return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const patientName = `${rx.patient?.first_name || ''} ${rx.patient?.last_name || ''}`.toLowerCase();
        const doctorName = `${rx.doctor?.first_name || ''} ${rx.doctor?.last_name || ''}`.toLowerCase();
        return patientName.includes(query) || doctorName.includes(query);
      }
      return true;
    });

    return [...filtered].sort((a: any, b: any) => {
      const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
      const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
      const nameA = `${a.patient?.first_name || ''} ${a.patient?.last_name || ''}`.toLowerCase();
      const nameB = `${b.patient?.first_name || ''} ${b.patient?.last_name || ''}`.toLowerCase();

      switch (sortOption) {
        case 'old-recent':
          return dateA - dateB;
        case 'a-z':
          return nameA.localeCompare(nameB);
        case 'z-a':
          return nameB.localeCompare(nameA);
        case 'recent-old':
        default:
          return dateB - dateA;
      }
    });
  }, [prescriptions, activeTab, searchQuery, sortOption]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Calculate responsive column widths
  const availableWidth = isLandscape ? width - 40 : width - 24;
  const numberOfColumns = 6;
  const minColWidth = 85;
  const equalWidth = availableWidth / numberOfColumns;
  const colWidth = Math.max(minColWidth, Math.floor(equalWidth));
  const totalTableWidth = colWidth * numberOfColumns;
  const needsHorizontalScroll = totalTableWidth > availableWidth;

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          isLandscape && styles.scrollContentLandscape
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Search and Handover Button */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Search patient or doctor…"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
          </View>
          <TouchableOpacity style={styles.handoverButton}>
            <Text style={styles.handoverButtonText}>Handovers ({handoverCount})</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Section: Tabs & Sort Pills */}
        <View style={styles.filterSection}>
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'all' && styles.tabActive]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
                All ({allCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'outpatient' && styles.tabActive]}
              onPress={() => setActiveTab('outpatient')}
            >
              <Text style={[styles.tabText, activeTab === 'outpatient' && styles.tabTextActive]}>
                Outpatient ({outpatientCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'admitted' && styles.tabActive]}
              onPress={() => setActiveTab('admitted')}
            >
              <Text style={[styles.tabText, activeTab === 'admitted' && styles.tabTextActive]}>
                Admitted ({inpatientCount})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sort Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
            <View style={styles.sortContainer}>
              <Text style={styles.sortLabel}>Sort by:</Text>
              {[
                { id: 'recent-old' as SortOption, label: 'Newest' },
                { id: 'old-recent' as SortOption, label: 'Oldest' },
                { id: 'a-z' as SortOption, label: 'Patient (A-Z)' },
                { id: 'z-a' as SortOption, label: 'Patient (Z-A)' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.sortPill, sortOption === item.id && styles.sortPillActive]}
                  onPress={() => setSortOption(item.id)}
                >
                  <Text style={[styles.sortPillText, sortOption === item.id && styles.sortPillTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Main Card */}
        <View style={styles.mainCard}>
          {/* Table - Responsive scrolling only if needed */}
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
                <Text style={[styles.th, { width: colWidth }]}>DOCTOR</Text>
                <Text style={[styles.th, { width: colWidth }]}>ITEMS</Text>
                <Text style={[styles.th, { width: colWidth }]}>STATUS</Text>
                <Text style={[styles.th, { width: colWidth }]}>DATE</Text>
                <Text style={[styles.th, { width: colWidth }]}>ACTIONS</Text>
              </View>

              {/* Table Rows */}
              {filteredAndSortedPrescriptions.length === 0 ? (
                <Text style={styles.emptyState}>No prescriptions found</Text>
              ) : (
                filteredAndSortedPrescriptions.map((prescription: any) => {
                  const patientName = `${prescription.patient?.first_name || ''} ${prescription.patient?.last_name || ''}`;
                  const doctorName = prescription.doctor?.last_name ? `Dr. ${prescription.doctor.last_name}` : 'N/A';
                  const isCompleted = prescription.status === 'completed';
                  const isPending = prescription.status === 'pending_encoding';

                  return (
                    <View key={`rx-${prescription.id}`} style={styles.tableRow}>
                      <Text 
                        style={[styles.td, styles.tdBold, { width: colWidth }]} 
                        numberOfLines={2}
                      >
                        {patientName}
                      </Text>
                      <Text 
                        style={[styles.td, { width: colWidth }]} 
                        numberOfLines={1}
                      >
                        {doctorName}
                      </Text>
                      <Text style={[styles.td, { width: colWidth }]}>
                        {prescription.items?.length || 0} items
                      </Text>
                      <View style={[styles.td, { width: colWidth, justifyContent: 'center' }]}>
                        <View style={[
                          styles.statusBadge,
                          prescription.status === 'active' && styles.statusActive,
                          isCompleted && styles.statusCompleted,
                          isPending && styles.statusPending,
                        ]}>
                          <Text style={[
                            styles.statusText,
                            prescription.status === 'active' && styles.statusActiveText,
                            isCompleted && styles.statusCompletedText,
                            isPending && styles.statusPendingText,
                          ]} numberOfLines={1}>
                            {isPending ? 'Pending' : prescription.status === 'active' ? 'Active' : 'Completed'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.td, styles.tdDate, { width: colWidth }]}>
                        {new Date(prescription.created_at || prescription.createdAt || 0).toLocaleDateString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: 'numeric'
                        })}
                      </Text>
                      <View style={[styles.td, { width: colWidth, justifyContent: 'center' }]}>
                        <TouchableOpacity 
                          style={styles.viewButton}
                          onPress={() => {
                            navigation.navigate('PrescriptionDetail', { prescriptionId: prescription.id });
                          }}
                        >
                          <Text style={styles.viewButtonText}>View Record</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
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
  handoverButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handoverButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  tabActive: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#3b82f6',
    fontWeight: '700',
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
  filterSection: {
    marginBottom: 12,
  },
  sortScroll: {
    marginTop: 8,
    marginBottom: 4,
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
  tdBold: {
    fontWeight: '600',
  },
  tdDate: {
    fontSize: 11,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  statusActive: {
    backgroundColor: '#dcfce7',
  },
  statusCompleted: {
    backgroundColor: '#eff6ff',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusActiveText: {
    color: '#16a34a',
  },
  statusCompletedText: {
    color: '#2563eb',
  },
  statusPendingText: {
    color: '#d97706',
  },
  viewButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#eff6ff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  viewButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563eb',
  },
  emptyState: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
