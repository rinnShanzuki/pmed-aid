import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import api from '../../services/api';

interface Medication {
  id: number;
  name: string;
  generic_name: string;
  category: string;
  stock_quantity: number;
  status: string;
}

export default function MedicationManagement() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/medications');
      setMedications(res.data.data || []);
    } catch (err: any) {
      console.error('Fetch medications error:', err);
      // Show empty state if API fails
      setMedications([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available': return '#dcfce7';
      case 'low stock': return '#fef3c7';
      case 'out of stock': return '#fee2e2';
      default: return '#f3f4f6';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available': return '#10b981';
      case 'low stock': return '#f59e0b';
      case 'out of stock': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const filteredMedications = medications.filter(med => {
    const matchesSearch = 
      med.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.generic_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.headerIcon}>💊</Text>
          <Text style={styles.headerTitle}>Medication Catalog</Text>
        </View>
        
        <View style={styles.controls}>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search medications..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
          </View>
          
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonIcon}>+</Text>
            <Text style={styles.addButtonText}>Add Medication</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colName]}>NAME</Text>
            <Text style={[styles.tableHeaderText, styles.colGeneric]}>GENERIC NAME</Text>
            <Text style={[styles.tableHeaderText, styles.colCategory]}>CATEGORY</Text>
            <Text style={[styles.tableHeaderText, styles.colStock]}>STOCK</Text>
            <Text style={[styles.tableHeaderText, styles.colStatus]}>STATUS</Text>
            <Text style={[styles.tableHeaderText, styles.colActions]}>ACTIONS</Text>
          </View>

          {/* Table Rows */}
          <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
            {filteredMedications.length > 0 ? (
              filteredMedications.map((med) => (
                <View key={med.id} style={styles.tableRow}>
                  <View style={[styles.tableCell, styles.colName]}>
                    <Text style={styles.medName}>{med.name}</Text>
                  </View>

                  <View style={[styles.tableCell, styles.colGeneric]}>
                    <Text style={styles.genericText}>{med.generic_name || 'N/A'}</Text>
                  </View>

                  <View style={[styles.tableCell, styles.colCategory]}>
                    <Text style={styles.categoryText}>{med.category || 'N/A'}</Text>
                  </View>

                  <View style={[styles.tableCell, styles.colStock]}>
                    <Text style={styles.stockText}>{med.stock_quantity || 0}</Text>
                  </View>

                  <View style={[styles.tableCell, styles.colStatus]}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(med.status) }]}>
                      <Text style={[styles.statusText, { color: getStatusTextColor(med.status) }]}>
                        {med.status || 'Unknown'}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.tableCell, styles.colActions]}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Text style={styles.actionIcon}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Text style={styles.actionIcon}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>No medications found</Text>
              </View>
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  controls: {
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    alignSelf: 'flex-end',
  },
  addButtonIcon: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  addButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  tableContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableBody: {
    maxHeight: 600,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tableCell: {
    justifyContent: 'center',
  },
  colName: {
    width: 180,
  },
  colGeneric: {
    width: 180,
  },
  colCategory: {
    width: 140,
  },
  colStock: {
    width: 80,
  },
  colStatus: {
    width: 120,
  },
  colActions: {
    width: 100,
    flexDirection: 'row',
    gap: 8,
  },
  medName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  genericText: {
    fontSize: 13,
    color: '#64748b',
  },
  categoryText: {
    fontSize: 13,
    color: '#64748b',
  },
  stockText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#f8fafc',
  },
  actionIcon: {
    fontSize: 16,
  },
  emptyRow: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
  },
});

