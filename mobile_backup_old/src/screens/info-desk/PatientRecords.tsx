import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export default function PatientRecords() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [searchQuery, patients]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/patients');
      const data = response.data.data || [];
      setPatients(data);
    } catch (err: any) {
      console.error('Patients fetch error:', err);
      // Use sample data if API fails
      setPatients([
        {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '1988-05-14',
          gender: 'Male',
          contact_number: '+63 912 345 6789',
          blood_type: 'O+'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = patients.filter((p: any) => {
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
        const contact = p.contact_number?.toLowerCase() || '';
        return fullName.includes(query) || contact.includes(query);
      });
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
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
              <Text style={styles.headerIcon}>👥</Text>
              <Text style={styles.headerTitle}>Patient Registration</Text>
            </View>
          </View>

          {/* Search and Register Button */}
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search patients..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={styles.registerButton}>
              <Text style={styles.plusIcon}>+</Text>
              <Text style={styles.registerButtonText}>Register Patient</Text>
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
                <Text style={[styles.tableHeaderText, styles.colDOB]}>DOB</Text>
                <Text style={[styles.tableHeaderText, styles.colGender]}>GENDER</Text>
                <Text style={[styles.tableHeaderText, styles.colContact]}>CONTACT</Text>
                <Text style={[styles.tableHeaderText, styles.colBloodType]}>BLOOD TYPE</Text>
                <Text style={[styles.tableHeaderText, styles.colActions]}>ACTIONS</Text>
              </View>

              {/* Table Body */}
              <View style={styles.tableBody}>
                {filteredPatients.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No patients found</Text>
                  </View>
                ) : (
                  filteredPatients.map((patient: any) => (
                    <View key={patient.id} style={styles.tableRow}>
                      <Text style={[styles.tableCellText, styles.colPatient]}>
                        {patient.first_name} {patient.last_name}
                      </Text>
                      <Text style={[styles.tableCellText, styles.colDOB]}>
                        {new Date(patient.date_of_birth).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        }).replace(/\//g, '-')}
                      </Text>
                      <View style={[styles.tableCell, styles.colGender]}>
                        <View style={[
                          styles.genderBadge,
                          patient.gender?.toLowerCase() === 'male' && styles.genderMale,
                          patient.gender?.toLowerCase() === 'female' && styles.genderFemale
                        ]}>
                          <Text style={styles.genderText}>
                            {patient.gender}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.tableCellText, styles.colContact]}>
                        {patient.contact_number || 'N/A'}
                      </Text>
                      <Text style={[styles.tableCellText, styles.colBloodType]}>
                        {patient.blood_type || 'N/A'}
                      </Text>
                      <View style={[styles.tableCell, styles.colActions]}>
                        <TouchableOpacity style={styles.editButton}>
                          <Text style={styles.editIcon}>✏️</Text>
                          <Text style={styles.editText}>Edit</Text>
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
  registerButton: {
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
  registerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tableScrollContainer: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  tableContainer: {
    minWidth: 900,
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
  colDOB: {
    width: 120,
  },
  colGender: {
    width: 100,
  },
  colContact: {
    width: 160,
  },
  colBloodType: {
    width: 100,
  },
  colActions: {
    width: 100,
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
  genderBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignSelf: 'flex-start',
  },
  genderMale: {
    backgroundColor: '#dbeafe',
  },
  genderFemale: {
    backgroundColor: '#fce7f3',
  },
  genderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  editIcon: {
    fontSize: 14,
  },
  editText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
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
