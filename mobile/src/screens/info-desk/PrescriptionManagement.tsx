import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export default function PrescriptionManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [handoverCount, setHandoverCount] = useState(0);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    filterPrescriptions();
  }, [searchQuery, prescriptions]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/prescriptions');
      const data = response.data.data || [];
      setPrescriptions(data);
      
      // Count handover prescriptions
      const handoverRx = data.filter((p: any) => p.type === 'handover' && p.status === 'active');
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
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = prescriptions.filter((p: any) => {
        const patientName = `${p.patient?.first_name} ${p.patient?.last_name}`.toLowerCase();
        const doctorName = `${p.doctor?.first_name} ${p.doctor?.last_name}`.toLowerCase();
        return patientName.includes(query) || doctorName.includes(query);
      });
      setFilteredPrescriptions(filtered);
    } else {
      setFilteredPrescriptions(prescriptions);
    }
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
              <Text style={styles.headerIcon}>📋</Text>
              <Text style={styles.headerTitle}>Prescription Management</Text>
            </View>
          </View>

          {/* Search and Handover Button */}
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={styles.handoverButton}>
              <Text style={styles.handoverIcon}>✈️</Text>
              <Text style={styles.handoverButtonText}>Handover ({handoverCount})</Text>
            </TouchableOpacity>
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
                <Text style={[styles.tableHeaderText, styles.colDoctor]}>DOCTOR</Text>
                <Text style={[styles.tableHeaderText, styles.colType]}>TYPE</Text>
                <Text style={[styles.tableHeaderText, styles.colItems]}>ITEMS</Text>
                <Text style={[styles.tableHeaderText, styles.colStatus]}>STATUS</Text>
                <Text style={[styles.tableHeaderText, styles.colDate]}>DATE</Text>
                <Text style={[styles.tableHeaderText, styles.colActions]}>ACTIONS</Text>
              </View>

              {/* Table Body */}
              <View style={styles.tableBody}>
                {filteredPrescriptions.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No prescriptions found</Text>
                  </View>
                ) : (
                  filteredPrescriptions.map((prescription: any) => (
                    <View key={prescription.id} style={styles.tableRow}>
                      <Text style={[styles.tableCellText, styles.colPatient]}>
                        {prescription.patient?.first_name} {prescription.patient?.last_name}
                      </Text>
                      <Text style={[styles.tableCellText, styles.colDoctor]}>
                        Dr. {prescription.doctor?.last_name || 'N/A'}
                      </Text>
                      <View style={[styles.tableCell, styles.colType]}>
                        <View style={[
                          styles.typeBadge,
                          prescription.type === 'in-hospital' && styles.typeInHospital,
                          prescription.type === 'handover' && styles.typeHandover
                        ]}>
                          <Text style={styles.typeText}>
                            {prescription.type === 'in-hospital' ? 'In-Hospital' : 'Handover'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.tableCellText, styles.colItems]}>
                        {prescription.items?.length || 0} items
                      </Text>
                      <View style={[styles.tableCell, styles.colStatus]}>
                        <View style={[
                          styles.statusBadge,
                          prescription.status === 'active' && styles.statusActive,
                          prescription.status === 'completed' && styles.statusCompleted
                        ]}>
                          <Text style={styles.statusText}>
                            {prescription.status === 'active' ? 'Active' : 
                             prescription.status === 'completed' ? 'Completed' : 
                             'Pending'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.tableCellText, styles.colDate]}>
                        {new Date(prescription.created_at || prescription.date).toLocaleDateString()}
                      </Text>
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
  handoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  handoverIcon: {
    fontSize: 18,
  },
  handoverButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tableScrollContainer: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  tableContainer: {
    minWidth: 950,
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
  colDoctor: {
    width: 130,
  },
  colType: {
    width: 130,
  },
  colItems: {
    width: 100,
  },
  colStatus: {
    width: 110,
  },
  colDate: {
    width: 120,
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
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignSelf: 'flex-start',
  },
  typeInHospital: {
    backgroundColor: '#e0e7ff',
  },
  typeHandover: {
    backgroundColor: '#fef3c7',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
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
  statusCompleted: {
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
