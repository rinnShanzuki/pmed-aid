import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../services/api';

export default function PrescriptionDetail() {
  const route = useRoute();
  const navigation = useNavigation();
  const { prescriptionId } = route.params as { prescriptionId: number };

  console.log(`PrescriptionDetail mounted/updated with prescriptionId: ${prescriptionId}`);

  const [loading, setLoading] = useState(true);
  const [prescription, setPrescription] = useState<any>(null);
  const [admission, setAdmission] = useState<any>(null);
  const [nurses, setNurses] = useState<any[]>([]);
  const [selectedNurseId, setSelectedNurseId] = useState<number | null>(null);
  const [showNurseDropdown, setShowNurseDropdown] = useState(false);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState('');

  useEffect(() => {
    console.log(`useEffect triggered for prescriptionId: ${prescriptionId}`);
    fetchPrescriptionData();
    fetchNurses();
  }, [prescriptionId]);

  useEffect(() => {
    if (prescription?.patient?.id && prescription?.id) {
      fetchQRCode();
    }
  }, [prescription]);

  const fetchAdmission = async (admissionId: number) => {
    try {
      const res = await api.get(`/admissions/${admissionId}`);
      setAdmission(res.data.data);
      setSelectedNurseId(res.data.data.nurse_id || null);
      console.log(`Fetched admission for RX#${prescription.id}:`, {
        admissionId: res.data.data.id,
        nurse: res.data.data.nurse ? `${res.data.data.nurse.first_name} ${res.data.data.nurse.last_name}` : 'None assigned'
      });
    } catch (err) {
      console.error('Error fetching admission:', err);
    }
  };

  const fetchNurses = async () => {
    try {
      const res = await api.get('/users', { params: { role: 'nurse' } });
      setNurses(res.data.data || []);
      console.log(`Fetched ${res.data.data?.length || 0} nurses`);
    } catch (err) {
      console.error('Error fetching nurses:', err);
    }
  };

  const handleAssignNurse = async (nurseId: number | null) => {
    if (!admission) return;
    try {
      await api.put(`/admissions/${admission.id}`, { assigned_nurse_id: nurseId });
      setSelectedNurseId(nurseId);
      setAdmission({ ...admission, nurse_id: nurseId });
      console.log(`Assigned nurse ${nurseId} to admission ${admission.id}`);
    } catch (err) {
      console.error('Error assigning nurse:', err);
      Alert.alert('Error', 'Failed to assign nurse');
    }
  };

  const fetchPrescriptionData = async () => {
    try {
      setLoading(true);
      console.log(`Fetching prescription with ID: ${prescriptionId}`);
      const res = await api.get(`/prescriptions/${prescriptionId}`);
      console.log(`Fetched prescription:`, {
        id: res.data.data.id,
        patient: `${res.data.data.patient?.first_name} ${res.data.data.patient?.last_name}`,
        type: res.data.data.type,
        status: res.data.data.status,
        admission_id: res.data.data.admission_id
      });
      setPrescription(res.data.data);
      
      // If in-hospital with admission, fetch admission details
      if (res.data.data.type === 'in_hospital' && res.data.data.admission_id) {
        await fetchAdmission(res.data.data.admission_id);
      }
    } catch (err) {
      console.error('Error fetching prescription data:', err);
      Alert.alert('Error', 'Failed to load prescription record');
    } finally {
      setLoading(false);
    }
  };

  const fetchQRCode = async () => {
    try {
      setQrLoading(true);
      setQrImage(null);
      setQrCode('');
      
      const res = await api.get(`/qr-codes/patient/${prescription.patient.id}`);
      const qr = res.data.data.find(
        (q: any) => String(q.prescription_id) === String(prescription.id)
      );
      
      if (qr) {
        setQrImage(qr.qr_image);
        setQrCode(qr.code);
        console.log(`QR code found for RX#${prescription.id}`);
      } else {
        console.log(`No QR code found for RX#${prescription.id}`);
      }
    } catch (err) {
      console.error('Error fetching QR code:', err);
      setQrImage(null);
      setQrCode('');
    } finally {
      setQrLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading prescription record...</Text>
      </View>
    );
  }

  if (!prescription) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Prescription not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('PrescriptionManagement')}
        >
          <Text style={styles.backButtonText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOutpatient = prescription.type === 'outpatient';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('PrescriptionManagement')}
          style={styles.backIcon}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Prescription Record</Text>
          <Text style={styles.meta}>
            ID: {prescription.id} • {new Date(prescription.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Patient & Physician & Nurse Details */}
        <View style={styles.section}>
          <View style={styles.detailsGrid}>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Patient</Text>
              <Text style={styles.detailName}>
                {prescription.patient?.first_name} {prescription.patient?.last_name}
              </Text>
              <Text style={styles.detailSub}>ID: {prescription.patient?.id}</Text>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Physician</Text>
              <Text style={styles.detailName}>
                Dr. {prescription.doctor?.first_name} {prescription.doctor?.last_name}
              </Text>
              <Text style={styles.detailSub}>
                {prescription.status === 'active' ? 'Active' : prescription.status} • {prescription.type?.replace(/_/g, ' ')}
              </Text>
            </View>

            {prescription.type === 'in_hospital' && admission && (
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>Assigned Nurse</Text>
                <TouchableOpacity 
                  style={styles.nurseDropdownButton}
                  onPress={() => setShowNurseDropdown(true)}
                >
                  <Text style={styles.nurseDropdownText}>
                    {selectedNurseId 
                      ? nurses.find(n => n.id === selectedNurseId)?.first_name + ' ' + nurses.find(n => n.id === selectedNurseId)?.last_name
                      : '-- Unassigned --'
                    }
                  </Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </TouchableOpacity>
                <Text style={styles.detailSub}>
                  Room: {admission.room?.room_number || 'N/A'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Nurse Selection Modal */}
        <Modal
          visible={showNurseDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowNurseDropdown(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowNurseDropdown(false)}
          >
            <View style={styles.nurseDropdownModal}>
              <TouchableOpacity
                style={styles.nurseOption}
                onPress={() => {
                  handleAssignNurse(null);
                  setShowNurseDropdown(false);
                }}
              >
                <Text style={styles.nurseOptionText}>-- Unassigned --</Text>
              </TouchableOpacity>
              {nurses.map((nurse) => (
                <TouchableOpacity
                  key={nurse.id}
                  style={[
                    styles.nurseOption,
                    selectedNurseId === nurse.id && styles.nurseOptionSelected
                  ]}
                  onPress={() => {
                    handleAssignNurse(nurse.id);
                    setShowNurseDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.nurseOptionText,
                    selectedNurseId === nurse.id && styles.nurseOptionTextSelected
                  ]}>
                    {nurse.first_name} {nurse.last_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Medications Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prescribed Medications</Text>
          
          {prescription.items && prescription.items.length > 0 ? (
            <View style={styles.medicationsTable}>
              {prescription.items.map((item: any, idx: number) => (
                <View key={idx} style={styles.medicationRow}>
                  <View style={styles.medicationMain}>
                    <Text style={styles.medicationName}>{item.medication_name}</Text>
                    {item.instructions && (
                      <Text style={styles.medicationNote}>Note: {item.instructions}</Text>
                    )}
                  </View>
                  
                  <View style={styles.medicationDetails}>
                    <DetailRow label="Dosage" value={item.dosage} />
                    <DetailRow label="Frequency" value={`${item.frequency}x ${item.frequency_unit}`} />
                    <DetailRow 
                      label="Schedule" 
                      value={`${item.start_time ? item.start_time.slice(0, 5) : 'Auto'} ${item.interval_hours ? `(q${item.interval_hours}h)` : ''}`}
                    />
                    <DetailRow label="Duration" value={item.duration || '—'} />
                    <DetailRow label="Route" value={item.route?.replace(/_/g, ' ') || '—'} />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No medications prescribed</Text>
          )}
        </View>

        {/* Physician Notes */}
        {prescription.notes && (
          <View style={styles.section}>
            <View style={styles.notesBox}>
              <Text style={styles.notesTitle}>Physician Notes</Text>
              <Text style={styles.notesText}>{prescription.notes}</Text>
            </View>
          </View>
        )}

        {/* Status Section */}
        <View style={styles.section}>
          <View style={styles.statusBox}>
            <View style={styles.statusBadge}>
              <Text style={[styles.statusText, {
                color: prescription.status === 'active' ? '#16a34a' : '#6b7280'
              }]}>
                {prescription.status === 'active' ? '✓ Active' : prescription.status}
              </Text>
            </View>
            <Text style={styles.statusType}>
              Type: <Text style={styles.statusTypeValue}>{prescription.type?.replace(/_/g, ' ')}</Text>
            </Text>
          </View>
        </View>

        {/* QR Code Section */}
        {!qrLoading && qrImage && qrCode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Patient QR Code</Text>
            <View style={styles.qrContainer}>
              <Image
                source={{ uri: qrImage }}
                style={styles.qrImage}
              />
              <View style={styles.qrInfo}>
                <Text style={styles.qrTitle}>Scan this QR code to verify patient and medication</Text>
                <Text style={styles.qrDescription}>
                  This code is unique to this prescription and patient. The nurse scans it to pull up pending medications and confirm administration.
                </Text>
                <Text style={styles.qrCode}>{qrCode}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailRowLabel}>{label}</Text>
      <Text style={styles.detailRowValue}>{value}</Text>
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  meta: {
    fontSize: 11,
    color: '#cbd5e1',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  detailsGrid: {
    gap: 12,
  },
  detailCard: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  detailName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  detailSub: {
    fontSize: 11,
    color: '#475569',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  medicationsTable: {
    gap: 12,
  },
  medicationRow: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  medicationMain: {
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  medicationNote: {
    fontSize: 10,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 4,
  },
  medicationDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailRowLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  detailRowValue: {
    fontSize: 10,
    color: '#0f172a',
  },
  notesBox: {
    backgroundColor: '#fefce8',
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    padding: 12,
    borderRadius: 6,
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#854d0e',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 11,
    color: '#854d0e',
    lineHeight: 18,
  },
  statusBox: {
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#dcfce7',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusType: {
    fontSize: 11,
    color: '#64748b',
  },
  statusTypeValue: {
    color: '#0f172a',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 20,
  },
  qrContainer: {
    flexDirection: 'column',
    gap: 16,
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qrImage: {
    width: 140,
    height: 140,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignSelf: 'center',
  },
  qrInfo: {
    gap: 8,
  },
  qrTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  qrDescription: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
  qrCode: {
    fontSize: 9,
    color: '#94a3b8',
    fontFamily: 'monospace',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  nurseDropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
  },
  nurseDropdownText: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500',
  },
  dropdownIcon: {
    fontSize: 10,
    color: '#94a3b8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  nurseDropdownModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '60%',
  },
  nurseOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  nurseOptionSelected: {
    backgroundColor: '#e0e7ff',
  },
  nurseOptionText: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500',
  },
  nurseOptionTextSelected: {
    color: '#4f46e5',
    fontWeight: '700',
  },
});
