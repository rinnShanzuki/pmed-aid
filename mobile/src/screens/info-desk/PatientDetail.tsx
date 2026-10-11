import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../services/api';

export default function PatientDetail() {
  const route = useRoute();
  const navigation = useNavigation();
  const { patientId } = route.params as { patientId: number };

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'consultations' | 'admissions' | 'prescriptions'>('info');
  const [consultations, setConsultations] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    fetchPatientData();
  }, []);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const [patRes, consRes, admRes, presRes] = await Promise.all([
        api.get(`/patients/${patientId}`),
        api.get(`/consultations?patient_id=${patientId}`),
        api.get(`/admissions?patient_id=${patientId}`),
        api.get(`/prescriptions?patient_id=${patientId}`),
      ]);

      setPatient(patRes.data.data);
      setConsultations(consRes.data.data || []);
      setAdmissions(admRes.data.data || []);
      setPrescriptions(presRes.data.data || []);
    } catch (err) {
      console.error('Error fetching patient data:', err);
      Alert.alert('Error', 'Failed to load patient record');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading patient record...</Text>
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Patient not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('PatientRecords')}
        >
          <Text style={styles.backButtonText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const calculateAge = (dob: string) => {
    if (!dob) return '—';
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const tabs = [
    { id: 'info' as const, label: 'Information', icon: 'account' },
    { id: 'consultations' as const, label: 'Consultations', icon: 'stethoscope', count: consultations.length },
    { id: 'admissions' as const, label: 'Admissions', icon: 'hospital-box', count: admissions.length },
    { id: 'prescriptions' as const, label: 'Prescriptions', icon: 'clipboard-list', count: prescriptions.length },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('PatientRecords')}
          style={styles.backIcon}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.patientName}>{patient.first_name} {patient.last_name}</Text>
          <Text style={styles.patientMeta}>
            ID: {patient.id} • {calculateAge(patient.date_of_birth)} yrs • {patient.gender} • {patient.blood_type || 'Unknown'}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <MaterialCommunityIcons 
                name={tab.icon} 
                size={16} 
                color={activeTab === tab.id ? '#3b82f6' : '#94a3b8'}
                style={styles.tabIcon}
              />
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {tab.count !== undefined && tab.count > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{tab.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'info' && <TabInformation patient={patient} />}
        {activeTab === 'consultations' && <TabConsultations consultations={consultations} />}
        {activeTab === 'admissions' && <TabAdmissions admissions={admissions} />}
        {activeTab === 'prescriptions' && <TabPrescriptions prescriptions={prescriptions} />}
      </ScrollView>
    </View>
  );
}

function TabInformation({ patient }: any) {
  return (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <InfoRow label="First Name" value={patient.first_name} />
        <InfoRow label="Last Name" value={patient.last_name} />
        <InfoRow label="Date of Birth" value={patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : '—'} />
        <InfoRow label="Gender" value={patient.gender || '—'} />
        <InfoRow label="Blood Type" value={patient.blood_type || '—'} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <InfoRow label="Contact Number" value={patient.contact_number || '—'} />
        <InfoRow label="Address" value={patient.address || '—'} />
        <InfoRow label="Civil Status" value={patient.civil_status || '—'} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medical Information</Text>
        <InfoRow label="Allergies" value={patient.allergies || 'None'} />
        <InfoRow label="Emergency Contact" value={patient.emergency_contact_name || '—'} />
        <InfoRow label="Emergency Number" value={patient.emergency_contact_number || '—'} />
      </View>
    </View>
  );
}

function TabConsultations({ consultations }: any) {
  if (consultations.length === 0) {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.emptyText}>No consultations found</Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      {consultations.map((c: any, idx: number) => (
        <View key={idx} style={styles.listCard}>
          <View style={styles.listCardHeader}>
            <Text style={styles.listCardTitle}>
              Dr. {c.doctor?.first_name} {c.doctor?.last_name}
            </Text>
            <View style={[styles.badge, { backgroundColor: c.status === 'completed' ? '#dcfce7' : '#dbeafe' }]}>
              <Text style={[styles.badgeText, { color: c.status === 'completed' ? '#16a34a' : '#0284c7' }]}>
                {c.status?.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>
          <Text style={styles.listCardSubtitle}>
            {new Date(c.created_at).toLocaleDateString()}
          </Text>
          {c.notes && <Text style={styles.listCardNote}>{c.notes}</Text>}
        </View>
      ))}
    </View>
  );
}

function TabAdmissions({ admissions }: any) {
  if (admissions.length === 0) {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.emptyText}>No admissions found</Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      {admissions.map((a: any, idx: number) => (
        <View key={idx} style={styles.listCard}>
          <View style={styles.listCardHeader}>
            <Text style={styles.listCardTitle}>
              Room {a.room?.room_number}
            </Text>
            <View style={[styles.badge, { backgroundColor: a.status === 'admitted' ? '#dbeafe' : '#f3f4f6' }]}>
              <Text style={[styles.badgeText, { color: a.status === 'admitted' ? '#0284c7' : '#6b7280' }]}>
                {a.status}
              </Text>
            </View>
          </View>
          <Text style={styles.listCardSubtitle}>
            Admitted: {new Date(a.admission_date).toLocaleDateString()}
          </Text>
          {a.discharge_date && (
            <Text style={styles.listCardSubtitle}>
              Discharged: {new Date(a.discharge_date).toLocaleDateString()}
            </Text>
          )}
          {a.diagnosis && <Text style={styles.listCardNote}>{a.diagnosis}</Text>}
        </View>
      ))}
    </View>
  );
}

function TabPrescriptions({ prescriptions }: any) {
  if (prescriptions.length === 0) {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.emptyText}>No prescriptions found</Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      {prescriptions.map((p: any, idx: number) => (
        <View key={idx} style={styles.listCard}>
          <View style={styles.listCardHeader}>
            <Text style={styles.listCardTitle}>
              Dr. {p.doctor?.first_name} {p.doctor?.last_name}
            </Text>
            <View style={[styles.badge, { backgroundColor: p.status === 'active' ? '#dcfce7' : '#f3f4f6' }]}>
              <Text style={[styles.badgeText, { color: p.status === 'active' ? '#16a34a' : '#6b7280' }]}>
                {p.status}
              </Text>
            </View>
          </View>
          <Text style={styles.listCardSubtitle}>
            {p.type?.replace(/_/g, ' ')} • {p.items?.length || 0} items
          </Text>
          <Text style={styles.listCardSubtitle}>
            {new Date(p.created_at).toLocaleDateString()}
          </Text>
          {p.notes && <Text style={styles.listCardNote}>{p.notes}</Text>}
        </View>
      ))}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#1e3a5f',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 12,
    gap: 12,
  },
  backIcon: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  patientMeta: {
    fontSize: 11,
    color: '#cbd5e1',
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabsScroll: {
    paddingHorizontal: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3b82f6',
  },
  tabIcon: {
    marginRight: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  tabLabelActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  tabContent: {
    paddingBottom: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '500',
  },
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  listCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  listCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  listCardSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  listCardNote: {
    fontSize: 11,
    color: '#475569',
    marginTop: 6,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 40,
  },
});
