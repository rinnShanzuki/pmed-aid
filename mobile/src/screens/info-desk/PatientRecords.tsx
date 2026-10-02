import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

const COL_WIDTH = 100;

export default function PatientRecords() {
  const { user } = useAuth();
  const navigation = useNavigation();
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
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = patients.filter((p: any) => {
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
        return fullName.includes(query);
      });
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  };

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

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search patients…"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Main Card */}
        <View style={styles.mainCard}>

          {/* Horizontal Scrolling Table */}
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} style={styles.horizontalScroll}>
            <View style={styles.tableWrapper}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: COL_WIDTH }]}>PATIENT</Text>
                <Text style={[styles.th, { width: COL_WIDTH }]}>AGE/DOB</Text>
                <Text style={[styles.th, { width: COL_WIDTH }]}>GENDER</Text>
                <Text style={[styles.th, { width: COL_WIDTH }]}>CONTACT</Text>
                <Text style={[styles.th, { width: COL_WIDTH }]}>BLOOD TYPE</Text>
                <Text style={[styles.th, { width: COL_WIDTH }]}>ACTIONS</Text>
              </View>

              {/* Table Rows */}
              {filteredPatients.length === 0 ? (
                <Text style={styles.emptyState}>No patients found</Text>
              ) : (
                filteredPatients.map((patient: any, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text 
                      style={[styles.td, { width: COL_WIDTH }]} 
                      numberOfLines={2}
                    >
                      {patient.first_name} {patient.last_name}
                    </Text>
                    <Text style={[styles.td, { width: COL_WIDTH }]}>
                      {calculateAge(patient.date_of_birth)}
                    </Text>
                    <View style={[styles.td, { width: COL_WIDTH, justifyContent: 'center' }]}>
                      <View style={[
                        styles.genderBadge,
                        patient.gender?.toLowerCase() === 'male' && styles.genderMale,
                        patient.gender?.toLowerCase() === 'female' && styles.genderFemale
                      ]}>
                        <Text style={styles.genderText} numberOfLines={1}>
                          {patient.gender}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.td, { width: COL_WIDTH }]} numberOfLines={1}>
                      {patient.contact_number || '—'}
                    </Text>
                    <Text style={[styles.td, { width: COL_WIDTH }]}>
                      {patient.blood_type || '—'}
                    </Text>
                    <View style={[styles.td, { width: COL_WIDTH, justifyContent: 'center' }]}>
                      <TouchableOpacity 
                        style={styles.viewButton}
                        onPress={() => navigation.navigate('PatientDetail', { patientId: patient.id })}
                      >
                        <Text style={styles.viewButtonText}>View Record</Text>
                      </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  searchContainer: {
    marginBottom: 12,
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
