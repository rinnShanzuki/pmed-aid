import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import api from '../../services/api';

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  gender: string;
  phone_number?: string;
}

export default function PatientManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/patients');
      setPatients(res.data.data || []);
    } catch (err: any) {
      console.error('Fetch patients error:', err);
      Alert.alert('Error', 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase());
    
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
          <Text style={styles.headerIcon}>🏥</Text>
          <Text style={styles.headerTitle}>Patient Management</Text>
        </View>
        
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colPatient]}>PATIENT</Text>
            <Text style={[styles.tableHeaderText, styles.colGender]}>GENDER</Text>
            <Text style={[styles.tableHeaderText, styles.colDob]}>DATE OF BIRTH</Text>
            <Text style={[styles.tableHeaderText, styles.colContact]}>CONTACT</Text>
            <Text style={[styles.tableHeaderText, styles.colActions]}>ACTIONS</Text>
          </View>

          {/* Table Rows */}
          <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
            {filteredPatients.map((patient) => (
              <View key={patient.id} style={styles.tableRow}>
                <View style={[styles.tableCell, styles.colPatient]}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {getInitials(patient.first_name, patient.last_name)}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.patientName}>{patient.first_name} {patient.last_name}</Text>
                    <Text style={styles.patientEmail}>{patient.email}</Text>
                  </View>
                </View>

                <View style={[styles.tableCell, styles.colGender]}>
                  <Text style={styles.genderText}>{patient.gender || 'N/A'}</Text>
                </View>

                <View style={[styles.tableCell, styles.colDob]}>
                  <Text style={styles.dobText}>{formatDate(patient.date_of_birth)}</Text>
                </View>

                <View style={[styles.tableCell, styles.colContact]}>
                  <Text style={styles.contactText}>{patient.phone_number || 'N/A'}</Text>
                </View>

                <View style={[styles.tableCell, styles.colActions]}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionIcon}>👁️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {filteredPatients.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No patients found</Text>
        </View>
      )}
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
  colPatient: {
    width: 250,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colGender: {
    width: 100,
  },
  colDob: {
    width: 120,
  },
  colContact: {
    width: 150,
  },
  colActions: {
    width: 80,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  patientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  patientEmail: {
    fontSize: 12,
    color: '#64748b',
  },
  genderText: {
    fontSize: 13,
    color: '#64748b',
  },
  dobText: {
    fontSize: 13,
    color: '#64748b',
  },
  contactText: {
    fontSize: 13,
    color: '#64748b',
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
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
  },
});

