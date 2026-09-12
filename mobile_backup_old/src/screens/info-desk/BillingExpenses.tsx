import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export default function BillingExpenses() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBills();
  }, []);

  useEffect(() => {
    filterBills();
  }, [searchQuery, bills]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bills');
      const data = response.data.data || [];
      setBills(data);
    } catch (err: any) {
      console.error('Bills fetch error:', err);
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  const filterBills = () => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = bills.filter((b: any) => {
        const patientName = `${b.patient?.first_name} ${b.patient?.last_name}`.toLowerCase();
        const admissionId = b.admission_id?.toString() || '';
        return patientName.includes(query) || admissionId.includes(query);
      });
      setFilteredBills(filtered);
    } else {
      setFilteredBills(bills);
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
              <Text style={styles.headerIcon}>💰</Text>
              <Text style={styles.headerTitle}>Billing & Expenses</Text>
            </View>
          </View>

          {/* Search and Generate Button */}
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
            <TouchableOpacity style={styles.generateButton}>
              <Text style={styles.plusIcon}>+</Text>
              <Text style={styles.generateButtonText}>Generate Bill</Text>
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
                <Text style={[styles.tableHeaderText, styles.colAdmission]}>ADMISSION</Text>
                <Text style={[styles.tableHeaderText, styles.colTotal]}>TOTAL</Text>
                <Text style={[styles.tableHeaderText, styles.colStatus]}>STATUS</Text>
                <Text style={[styles.tableHeaderText, styles.colDate]}>DATE</Text>
                <Text style={[styles.tableHeaderText, styles.colActions]}>ACTIONS</Text>
              </View>

              {/* Table Body */}
              <View style={styles.tableBody}>
                {filteredBills.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No bills found. Generate one for an admission.</Text>
                  </View>
                ) : (
                  filteredBills.map((bill: any) => (
                    <View key={bill.id} style={styles.tableRow}>
                      <Text style={[styles.tableCellText, styles.colPatient]}>
                        {bill.patient?.first_name} {bill.patient?.last_name}
                      </Text>
                      <Text style={[styles.tableCellText, styles.colAdmission]}>
                        #{bill.admission_id || 'N/A'}
                      </Text>
                      <Text style={[styles.tableCellText, styles.colTotal, styles.totalAmount]}>
                        ₱{parseFloat(bill.total_amount || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </Text>
                      <View style={[styles.tableCell, styles.colStatus]}>
                        <View style={[
                          styles.statusBadge,
                          bill.status === 'paid' && styles.statusPaid,
                          bill.status === 'pending' && styles.statusPending,
                          bill.status === 'partial' && styles.statusPartial
                        ]}>
                          <Text style={styles.statusText}>
                            {bill.status === 'paid' ? 'Paid' : 
                             bill.status === 'pending' ? 'Pending' : 
                             bill.status === 'partial' ? 'Partial' :
                             'Unpaid'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.tableCellText, styles.colDate]}>
                        {new Date(bill.created_at || bill.date).toLocaleDateString()}
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
  generateButton: {
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
  generateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tableScrollContainer: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  tableContainer: {
    minWidth: 850,
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
    width: 180,
  },
  colAdmission: {
    width: 120,
  },
  colTotal: {
    width: 150,
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
  totalAmount: {
    fontWeight: '700',
    color: '#059669',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignSelf: 'flex-start',
  },
  statusPaid: {
    backgroundColor: '#d1fae5',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusPartial: {
    backgroundColor: '#dbeafe',
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
