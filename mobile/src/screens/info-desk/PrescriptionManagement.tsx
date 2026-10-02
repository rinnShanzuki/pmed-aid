import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

const COL_WIDTH = 100;

export default function PrescriptionManagement() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'outpatient' | 'admitted'>('outpatient');
  const [handoverCount, setHandoverCount] = useState(0);

  useEffect(() => {
    console.log('Current logged-in user:', {
      id: user?.id,
      email: user?.email,
      role: user?.role,
      name: `${user?.first_name} ${user?.last_name}`
    });
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    filterPrescriptions();
  }, [searchQuery, prescriptions, activeTab]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/prescriptions');
      const data = response.data.data || [];
      
      // Create deep copy to avoid reference issues
      const deepCopiedData = JSON.parse(JSON.stringify(data));
      
      // Debug: Log all prescriptions
      console.log('Total prescriptions fetched:', deepCopiedData.length);
      console.log('Prescriptions data:', deepCopiedData.map((p: any) => ({
        id: p.id,
        patient: `${p.patient?.first_name} ${p.patient?.last_name}`,
        type: p.type,
        status: p.status,
        admission_id: p.admission_id
      })));
      
      setPrescriptions(deepCopiedData);

      // Count handover prescriptions (pending encoding status)
      const handoverRx = deepCopiedData.filter((p: any) => p.status === 'pending_encoding');
      setHandoverCount(handoverRx.length);
    } catch (err: any) {
      console.error('Prescriptions fetch error:', err);
      setPrescriptions([]);
      setHandoverCount(0);
    } finally {
      setLoading(false);
    }
  };

  const filterPrescriptions = () => {
    let filtered = prescriptions;

    // Apply visibility filter (match web behavior)
    // Outpatient: always visible | In-hospital: only if linked to admission
    filtered = filtered.filter((p: any) => {
      if (p.type === 'outpatient') return true;
      return p.admission_id != null; // In-hospital only if admission confirmed
    });

    // Filter by status (only show active prescriptions)
    filtered = filtered.filter((p: any) => p.status === 'active');

    // Filter by tab
    if (activeTab === 'outpatient') {
      filtered = filtered.filter((p: any) => p.type === 'outpatient');
    } else if (activeTab === 'admitted') {
      filtered = filtered.filter((p: any) => p.type === 'in_hospital');
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p: any) => {
        const patientName = `${p.patient?.first_name} ${p.patient?.last_name}`.toLowerCase();
        const doctorName = `${p.doctor?.first_name} ${p.doctor?.last_name}`.toLowerCase();
        return patientName.includes(query) || doctorName.includes(query);
      });
    }

    console.log(`Filtered prescriptions (tab=${activeTab}, search="${searchQuery}"):`, filtered.map((p: any) => ({
      id: p.id,
      patient: `${p.patient?.first_name} ${p.patient?.last_name}`,
      type: p.type,
      admission_id: p.admission_id
    })));

    setFilteredPrescriptions(filtered);
  };

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
        {/* Search and Handover Button */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search…"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
          </View>
          <TouchableOpacity style={styles.handoverButton}>
            <Text style={styles.handoverButtonText}>Handover ({handoverCount})</Text>
          </TouchableOpacity>
        </View>

        {/* Main Card */}
        <View style={styles.mainCard}>
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'outpatient' && styles.tabActive]}
              onPress={() => setActiveTab('outpatient')}
            >
              <Text style={[styles.tabText, activeTab === 'outpatient' && styles.tabTextActive]}>
                Outpatient ({prescriptions.filter((p: any) => p.type === 'outpatient' && p.status === 'active').length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'admitted' && styles.tabActive]}
              onPress={() => setActiveTab('admitted')}
            >
              <Text style={[styles.tabText, activeTab === 'admitted' && styles.tabTextActive]}>
                Admitted ({prescriptions.filter((p: any) => p.type === 'in_hospital' && p.admission_id !== null && p.status === 'active').length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal Scrolling Table */}
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} style={styles.horizontalScroll}>
            <View style={styles.tableWrapper}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: COL_WIDTH }]}>PATIENT</Text>
                <Text style={[styles.th, { width: COL_WIDTH }]}>DOCTOR</Text>
                <Text style={[styles.th, { width: COL_WIDTH }]}>ITEMS</Text>
                <Text style={[styles.th, { width: COL_WIDTH }]}>STATUS</Text>
                <Text style={[styles.th, { width: COL_WIDTH }]}>DATE</Text>
                <Text style={[styles.th, { width: COL_WIDTH }]}>ACTIONS</Text>
              </View>

              {/* Table Rows */}
              {filteredPrescriptions.length === 0 ? (
                <Text style={styles.emptyState}>No prescriptions found</Text>
              ) : (
                filteredPrescriptions.map((prescription: any, rowIdx) => {
                  const display = {
                    id: prescription.id,
                    patientName: `${prescription.patient?.first_name} ${prescription.patient?.last_name}`,
                    patientId: prescription.patient?.id,
                    type: prescription.type,
                    status: prescription.status,
                    admissionId: prescription.admission_id
                  };
                  console.log(`Row ${rowIdx}:`, display);
                  
                  return (
                  <View key={`rx-${prescription.id}`} style={styles.tableRow}>
                    <Text 
                      style={[styles.td, { width: COL_WIDTH }]} 
                      numberOfLines={2}
                    >
                      {prescription.patient?.first_name} {prescription.patient?.last_name}
                    </Text>
                    <Text 
                      style={[styles.td, { width: COL_WIDTH }]} 
                      numberOfLines={1}
                    >
                      Dr. {prescription.doctor?.last_name || 'N/A'}
                    </Text>
                    <Text style={[styles.td, { width: COL_WIDTH }]}>
                      {prescription.items?.length || 0} items
                    </Text>
                    <View style={[styles.td, { width: COL_WIDTH, justifyContent: 'center' }]}>
                      <View style={[
                        styles.statusBadge,
                        prescription.status === 'active' && styles.statusActive,
                        prescription.status === 'completed' && styles.statusCompleted
                      ]}>
                        <Text style={styles.statusText} numberOfLines={1}>
                          {prescription.status === 'active' ? 'Active' : 'Completed'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.td, { width: COL_WIDTH }]}>
                      {new Date(prescription.created_at || prescription.date).toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric'
                      }).replace(/\//g, '/')}
                    </Text>
                    <View style={[styles.td, { width: COL_WIDTH, justifyContent: 'center' }]}>
                      <TouchableOpacity 
                        style={styles.viewButton}
                        onPress={() => {
                          console.log(`Navigating to PrescriptionDetail with ID: ${prescription.id}, Patient: ${prescription.patient?.first_name} ${prescription.patient?.last_name}`);
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
  statusActive: {
    backgroundColor: '#d1fae5',
  },
  statusCompleted: {
    backgroundColor: '#e0e7ff',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#0f172a',
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
    fontSize: 8,
    fontWeight: '600',
    color: '#3b82f6',
  },
  emptyState: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
