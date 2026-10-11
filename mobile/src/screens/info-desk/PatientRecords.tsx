import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { useOrientation } from '../../hooks/useOrientation';
import api from '../../services/api';

export default function PatientRecords() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { width, height, isLandscape } = useOrientation();
  
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

  // Calculate responsive column widths
  // In landscape, use more of the available width
  const availableWidth = isLandscape ? width - 40 : width - 24; // Account for padding and margins
  const numberOfColumns = 6;
  const minColWidth = 90;
  const maxTotalWidth = availableWidth;
  
  // Calculate column width: either divide equally or use min width if that's larger
  const equalWidth = maxTotalWidth / numberOfColumns;
  const colWidth = Math.max(minColWidth, Math.floor(equalWidth));
  const totalTableWidth = colWidth * numberOfColumns;
  
  // Allow horizontal scroll only if necessary (content doesn't fit)
  const needsHorizontalScroll = totalTableWidth > maxTotalWidth;

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          isLandscape && styles.scrollContentLandscape
        ]}
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
                <Text style={[styles.th, { width: colWidth }]}>AGE/DOB</Text>
                <Text style={[styles.th, { width: colWidth }]}>GENDER</Text>
                <Text style={[styles.th, { width: colWidth }]}>CONTACT</Text>
                <Text style={[styles.th, { width: colWidth }]}>BLOOD TYPE</Text>
                <Text style={[styles.th, { width: colWidth }]}>ACTIONS</Text>
              </View>

              {/* Table Rows */}
              {filteredPatients.length === 0 ? (
                <Text style={styles.emptyState}>No patients found</Text>
              ) : (
                filteredPatients.map((patient: any, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text 
                      style={[styles.td, { width: colWidth }]} 
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
                          {patient.gender}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.td, { width: colWidth }]} numberOfLines={1}>
                      {patient.contact_number || '—'}
                    </Text>
                    <Text style={[styles.td, { width: colWidth }]}>
                      {patient.blood_type || '—'}
                    </Text>
                    <View style={[styles.td, { width: colWidth, justifyContent: 'center' }]}>
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
  emptyState: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
