import React, { useState, useEffect, useMemo } from 'react';
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

type TabType =
  | 'info'
  | 'timeline'
  | 'consultations'
  | 'admissions'
  | 'prescriptions'
  | 'medications'
  | 'administrations'
  | 'discharges'
  | 'qrcodes';

export default function PatientDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const patientId = route.params?.patientId;

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [consultations, setConsultations] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [qrCodes, setQrCodes] = useState<any[]>([]);

  useEffect(() => {
    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const [patRes, consRes, admRes, presRes, schedRes, qrRes] = await Promise.all([
        api.get(`/patients/${patientId}`),
        api.get(`/consultations?patient_id=${patientId}`),
        api.get(`/admissions?patient_id=${patientId}`),
        api.get(`/prescriptions?patient_id=${patientId}`),
        api.get(`/schedules/patient/${patientId}`).catch(() => ({ data: { data: [] } })),
        api.get(`/qr-codes/patient/${patientId}`).catch(() => ({ data: { data: [] } })),
      ]);

      setPatient(patRes.data.data);
      setConsultations(consRes.data.data || []);
      setAdmissions(admRes.data.data || []);
      setPrescriptions(presRes.data.data || []);
      setSchedules(schedRes.data.data || []);
      setQrCodes(qrRes.data.data || []);
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
        <Text style={styles.loadingText}>Loading comprehensive patient record...</Text>
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

  const medicationCount = prescriptions.reduce((acc, p) => acc + (p.items?.length || 0), 0);
  const dischargeCount = admissions.filter((a) => a.status === 'discharged' || a.discharge_date).length;

  const tabs: Array<{ id: TabType; label: string; icon: string; count?: number }> = [
    { id: 'info', label: 'Info', icon: 'account' },
    { id: 'timeline', label: 'Timeline', icon: 'clock-outline' },
    { id: 'consultations', label: 'Consultations', icon: 'stethoscope', count: consultations.length },
    { id: 'admissions', label: 'Confinements', icon: 'hospital-building', count: admissions.length },
    { id: 'prescriptions', label: 'Prescriptions', icon: 'clipboard-text-outline', count: prescriptions.length },
    { id: 'medications', label: 'Medications', icon: 'pill', count: medicationCount },
    { id: 'administrations', label: 'Admin History', icon: 'needle', count: schedules.length },
    { id: 'discharges', label: 'Discharges', icon: 'logout', count: dischargeCount },
    { id: 'qrcodes', label: 'QR Codes', icon: 'qrcode', count: qrCodes.length },
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.patientName}>{patient.first_name} {patient.last_name}</Text>
            {patient.status && (
              <View style={[
                styles.statusHeaderBadge,
                patient.status === 'active' ? styles.statusActive : styles.statusInactive
              ]}>
                <Text style={[
                  styles.statusHeaderBadgeText,
                  patient.status === 'active' ? styles.statusActiveText : styles.statusInactiveText
                ]}>
                  {patient.status.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.patientMeta}>
            ID: {patient.id} • {calculateAge(patient.date_of_birth)} yrs • {patient.gender || '—'} • Blood: {patient.blood_type || '—'}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <View style={styles.tabIcon}>
                  <MaterialCommunityIcons 
                    name={tab.icon as any} 
                    size={16} 
                    color={isActive ? '#3b82f6' : '#94a3b8'}
                  />
                </View>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                {tab.count !== undefined && tab.count > 0 && (
                  <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                    <Text style={styles.tabBadgeText}>{tab.count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'info' && <TabInformation patient={patient} />}
        {activeTab === 'timeline' && (
          <TabTimeline
            consultations={consultations}
            admissions={admissions}
            prescriptions={prescriptions}
            schedules={schedules}
          />
        )}
        {activeTab === 'consultations' && <TabConsultations consultations={consultations} />}
        {activeTab === 'admissions' && <TabAdmissions admissions={admissions} />}
        {activeTab === 'prescriptions' && <TabPrescriptions prescriptions={prescriptions} navigation={navigation} />}
        {activeTab === 'medications' && <TabMedications prescriptions={prescriptions} />}
        {activeTab === 'administrations' && <TabAdministrations schedules={schedules} />}
        {activeTab === 'discharges' && <TabDischarges admissions={admissions} />}
        {activeTab === 'qrcodes' && <TabQrCodes qrCodes={qrCodes} />}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. INFORMATION TAB
// ─────────────────────────────────────────────────────────────
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
        <InfoRow label="Record Status" value={patient.status ? patient.status.toUpperCase() : 'ACTIVE'} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <InfoRow label="Contact Number" value={patient.contact_number || '—'} />
        <InfoRow label="Address" value={patient.address || '—'} />
        <InfoRow label="Civil Status" value={patient.civil_status || '—'} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency & Medical Notes</Text>
        <InfoRow label="Emergency Contact" value={patient.emergency_contact_name || '—'} />
        <InfoRow label="Emergency Phone" value={patient.emergency_contact_number || '—'} />
        <InfoRow label="Allergies" value={patient.allergies || 'No known allergies'} />
        <InfoRow label="Medical History" value={patient.medical_history || 'No medical history recorded'} />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. TIMELINE TAB
// ─────────────────────────────────────────────────────────────
function TabTimeline({
  consultations,
  admissions,
  prescriptions,
  schedules,
}: {
  consultations: any[];
  admissions: any[];
  prescriptions: any[];
  schedules: any[];
}) {
  const events = useMemo(() => {
    const list: any[] = [];

    consultations.forEach((c: any) => {
      list.push({
        id: `cons-${c.id}`,
        type: 'consultation',
        icon: 'stethoscope',
        color: '#0284c7',
        date: new Date(c.created_at || c.createdAt),
        title: `Consultation with Dr. ${c.doctor?.last_name || 'Physician'}`,
        desc: c.assessment ? `Assessment: ${c.assessment}` : (c.notes || 'Routine consultation'),
      });
    });

    admissions.forEach((a: any) => {
      list.push({
        id: `adm-${a.id}`,
        type: 'admission',
        icon: 'hospital-building',
        color: '#3b82f6',
        date: new Date(a.admission_date || a.created_at),
        title: `Patient Admitted (Room ${a.room?.room_number || 'TBD'})`,
        desc: `Attending Doctor: Dr. ${a.doctor?.last_name || 'N/A'}${a.reason_for_admission ? ` • Reason: ${a.reason_for_admission}` : ''}`,
      });
      if (a.discharge_date) {
        list.push({
          id: `dis-${a.id}`,
          type: 'discharge',
          icon: 'logout',
          color: '#16a34a',
          date: new Date(a.discharge_date),
          title: `Patient Discharged`,
          desc: a.final_diagnosis ? `Final Diagnosis: ${a.final_diagnosis}` : 'Discharged from confinement',
        });
      }
    });

    prescriptions.forEach((p: any) => {
      list.push({
        id: `pres-${p.id}`,
        type: 'prescription',
        icon: 'clipboard-text-outline',
        color: '#8b5cf6',
        date: new Date(p.created_at || p.createdAt),
        title: `Prescription #${p.id} (${p.type?.replace(/_/g, ' ') || 'Outpatient'})`,
        desc: `${p.items?.length || 0} medications prescribed by Dr. ${p.doctor?.last_name || 'N/A'}`,
      });
    });

    schedules.forEach((s: any) => {
      if (s.status === 'completed' && s.actual_administration_time) {
        list.push({
          id: `admin-${s.id}`,
          type: 'administration',
          icon: 'needle',
          color: '#10b981',
          date: new Date(s.actual_administration_time),
          title: `Medication Administered: ${s.prescriptionItem?.medication_name || 'Dose'}`,
          desc: s.administeredBy?.last_name ? `Administered by Nurse ${s.administeredBy.last_name}` : 'Completed administration',
        });
      }
    });

    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [consultations, admissions, prescriptions, schedules]);

  if (events.length === 0) {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.emptyText}>No activity recorded in timeline</Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      {events.map((e, idx) => (
        <View key={e.id || idx} style={styles.timelineItem}>
          <View style={[styles.timelineIconWrapper, { backgroundColor: `${e.color}18`, borderColor: e.color }]}>
            <MaterialCommunityIcons name={e.icon as any} size={16} color={e.color} />
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.timelineDate}>{e.date.toLocaleString()}</Text>
            <Text style={styles.timelineTitle}>{e.title}</Text>
            <Text style={styles.timelineDesc}>{e.desc}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. CONSULTATIONS TAB
// ─────────────────────────────────────────────────────────────
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
        <View key={c.id || idx} style={styles.listCard}>
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
            {new Date(c.created_at).toLocaleString()}
          </Text>
          {c.notes && <Text style={styles.listCardNote}>{c.notes}</Text>}
          {c.assessment && <Text style={styles.listCardNote}>Assessment: {c.assessment}</Text>}
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. ADMISSIONS TAB
// ─────────────────────────────────────────────────────────────
function TabAdmissions({ admissions }: any) {
  if (admissions.length === 0) {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.emptyText}>No confinements found</Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      {admissions.map((a: any, idx: number) => (
        <View key={a.id || idx} style={styles.listCard}>
          <View style={styles.listCardHeader}>
            <Text style={styles.listCardTitle}>
              Room {a.room?.room_number || 'Unassigned'}
            </Text>
            <View style={[styles.badge, { backgroundColor: a.status === 'admitted' ? '#dbeafe' : '#f3f4f6' }]}>
              <Text style={[styles.badgeText, { color: a.status === 'admitted' ? '#0284c7' : '#6b7280' }]}>
                {a.status}
              </Text>
            </View>
          </View>
          <Text style={styles.listCardSubtitle}>
            Admitted: {new Date(a.admission_date).toLocaleString()}
          </Text>
          <Text style={styles.listCardSubtitle}>
            Discharged: {a.discharge_date ? new Date(a.discharge_date).toLocaleString() : 'Ongoing'}
          </Text>
          <Text style={styles.listCardSubtitle}>
            Attending: Dr. {a.doctor?.first_name} {a.doctor?.last_name}
          </Text>
          {a.reason_for_admission && (
            <Text style={styles.listCardNote}>Reason: {a.reason_for_admission}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. PRESCRIPTIONS TAB
// ─────────────────────────────────────────────────────────────
function TabPrescriptions({ prescriptions, navigation }: any) {
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
        <View key={p.id || idx} style={styles.listCard}>
          <View style={styles.listCardHeader}>
            <Text style={styles.listCardTitle}>
              Prescription #{String(p.id).padStart(4, '0')}
            </Text>
            <View style={[styles.badge, { backgroundColor: p.status === 'active' ? '#dcfce7' : '#f3f4f6' }]}>
              <Text style={[styles.badgeText, { color: p.status === 'active' ? '#16a34a' : '#6b7280' }]}>
                {p.status}
              </Text>
            </View>
          </View>
          <Text style={styles.listCardSubtitle}>
            Type: {p.type?.replace(/_/g, ' ')} • Doctor: Dr. {p.doctor?.last_name || 'N/A'}
          </Text>
          <Text style={styles.listCardSubtitle}>
            Issued: {new Date(p.created_at).toLocaleDateString()}
          </Text>

          {/* Items Preview */}
          <View style={styles.nestedItemList}>
            {p.items?.map((item: any, i: number) => (
              <View key={item.id || i} style={styles.nestedItemRow}>
                <Text style={styles.nestedItemName}>• {item.medication_name}</Text>
                <Text style={styles.nestedItemDetails}>{item.dosage} {item.dosage_unit || ''} ({item.frequency}x)</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.cardActionBtn}
            onPress={() => navigation.navigate('PrescriptionDetail', { prescriptionId: p.id })}
          >
            <Text style={styles.cardActionBtnText}>View Full Prescription →</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. MEDICATION HISTORY TAB
// ─────────────────────────────────────────────────────────────
function TabMedications({ prescriptions }: { prescriptions: any[] }) {
  const allMeds = useMemo(() => {
    return prescriptions.flatMap((p: any) =>
      p.items?.map((i: any) => ({ ...i, prescription: p })) || []
    );
  }, [prescriptions]);

  if (allMeds.length === 0) {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.emptyText}>No medication history recorded</Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      {allMeds.map((med: any, idx: number) => {
        const isOngoing = med.status === 'active' || med.prescription?.status === 'active';
        return (
          <View key={med.id || idx} style={[styles.listCard, { borderLeftColor: '#10b981' }]}>
            <View style={styles.listCardHeader}>
              <Text style={styles.listCardTitle}>{med.medication_name}</Text>
              <View style={[styles.badge, { backgroundColor: isOngoing ? '#dcfce7' : '#f1f5f9' }]}>
                <Text style={[styles.badgeText, { color: isOngoing ? '#16a34a' : '#64748b' }]}>
                  {med.status || (isOngoing ? 'active' : 'completed')}
                </Text>
              </View>
            </View>
            <Text style={styles.medDetailText}>
              Dosage: <Text style={styles.boldText}>{med.dosage} {med.dosage_unit || ''}</Text> • Frequency: <Text style={styles.boldText}>{med.frequency}x {med.frequency_unit || 'daily'}</Text>
            </Text>
            {med.duration && (
              <Text style={styles.listCardSubtitle}>
                Duration: {med.duration} {med.duration_unit || 'days'} • Route: {med.route || 'oral'}
              </Text>
            )}
            <Text style={styles.listCardSubtitle}>
              Prescribed by Dr. {med.prescription?.doctor?.last_name || 'N/A'} on {new Date(med.prescription?.created_at || med.created_at).toLocaleDateString()}
            </Text>
            {med.instructions ? (
              <Text style={styles.listCardNote}>"{med.instructions}"</Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. ADMINISTRATION HISTORY TAB
// ─────────────────────────────────────────────────────────────
function TabAdministrations({ schedules }: { schedules: any[] }) {
  if (schedules.length === 0) {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.emptyText}>No medication administration records found</Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      {schedules.map((s: any, idx: number) => {
        const isDone = s.status === 'completed';
        const isMissed = s.status === 'missed';
        return (
          <View key={s.id || idx} style={[styles.listCard, { borderLeftColor: isDone ? '#3b82f6' : isMissed ? '#ef4444' : '#f59e0b' }]}>
            <View style={styles.listCardHeader}>
              <Text style={styles.listCardTitle}>
                {s.prescriptionItem?.medication_name || 'Dose Administration'}
              </Text>
              <View style={[styles.badge, { backgroundColor: isDone ? '#dbeafe' : isMissed ? '#fee2e2' : '#fef3c7' }]}>
                <Text style={[styles.badgeText, { color: isDone ? '#1d4ed8' : isMissed ? '#dc2626' : '#d97706' }]}>
                  {s.status}
                </Text>
              </View>
            </View>
            <Text style={styles.medDetailText}>
              Scheduled: <Text style={styles.boldText}>{new Date(s.scheduled_time).toLocaleString()}</Text>
            </Text>
            {s.actual_administration_time && (
              <Text style={styles.listCardSubtitle}>
                Administered: {new Date(s.actual_administration_time).toLocaleString()}
              </Text>
            )}
            <Text style={styles.listCardSubtitle}>
              Administered By: {s.administeredBy?.last_name ? `Nurse ${s.administeredBy.last_name}` : 'Pending / Unassigned'}
            </Text>
            {s.notes && (
              <Text style={styles.listCardNote}>{s.notes}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// 8. DISCHARGE HISTORY TAB
// ─────────────────────────────────────────────────────────────
function TabDischarges({ admissions }: { admissions: any[] }) {
  const discharges = useMemo(() => {
    return admissions.filter((a: any) => a.status === 'discharged' || a.discharge_date);
  }, [admissions]);

  if (discharges.length === 0) {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.emptyText}>No discharge records found</Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      {discharges.map((d: any, idx: number) => (
        <View key={d.id || idx} style={[styles.listCard, { borderLeftColor: '#6366f1' }]}>
          <View style={styles.listCardHeader}>
            <Text style={styles.listCardTitle}>
              Discharge for Confinement #{String(d.id).padStart(4, '0')}
            </Text>
            <View style={[styles.badge, { backgroundColor: '#e0e7ff' }]}>
              <Text style={[styles.badgeText, { color: '#4338ca' }]}>Discharged</Text>
            </View>
          </View>
          <Text style={styles.listCardSubtitle}>
            Discharged: {d.discharge_date ? new Date(d.discharge_date).toLocaleString() : 'N/A'} • Room: {d.room?.room_number || 'N/A'}
          </Text>
          <View style={styles.dischargeSection}>
            <Text style={styles.dischargeLabel}>Final Diagnosis:</Text>
            <Text style={styles.dischargeValue}>{d.final_diagnosis || '—'}</Text>
          </View>
          <View style={styles.dischargeSection}>
            <Text style={styles.dischargeLabel}>Condition at Discharge:</Text>
            <Text style={styles.dischargeValue}>{d.condition_at_discharge || 'Improved'}</Text>
          </View>
          {d.discharge_summary && (
            <View style={styles.dischargeSection}>
              <Text style={styles.dischargeLabel}>Summary:</Text>
              <Text style={styles.dischargeValue}>{d.discharge_summary}</Text>
            </View>
          )}
          {d.follow_up_date && (
            <View style={styles.dischargeSection}>
              <Text style={styles.dischargeLabel}>Follow-up Date:</Text>
              <Text style={[styles.dischargeValue, { color: '#2563eb', fontWeight: '600' }]}>
                {new Date(d.follow_up_date).toLocaleDateString()}
              </Text>
            </View>
          )}
          {d.follow_up_instructions && (
            <Text style={styles.listCardNote}>Instructions: "{d.follow_up_instructions}"</Text>
          )}
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// 9. QR BINDING HISTORY TAB
// ─────────────────────────────────────────────────────────────
function TabQrCodes({ qrCodes }: { qrCodes: any[] }) {
  if (qrCodes.length === 0) {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.emptyText}>No QR code bindings found</Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      {qrCodes.map((q: any, idx: number) => {
        const isBound = q.status === 'bound';
        return (
          <View key={q.id || idx} style={[styles.listCard, { borderLeftColor: '#8b5cf6' }]}>
            <View style={styles.listCardHeader}>
              <Text style={styles.listCardTitle}>
                {q.type?.replace(/_/g, ' ').toUpperCase() || 'PATIENT QR'}
              </Text>
              <View style={[styles.badge, { backgroundColor: isBound ? '#dcfce7' : '#fef3c7' }]}>
                <Text style={[styles.badgeText, { color: isBound ? '#16a34a' : '#d97706' }]}>
                  {q.status?.toUpperCase() || 'ACTIVE'}
                </Text>
              </View>
            </View>
            <Text style={styles.codeText}>Token: {q.code}</Text>
            <Text style={styles.listCardSubtitle}>
              Generated: {new Date(q.created_at).toLocaleDateString()} • First Scan: {q.first_scan_date ? new Date(q.first_scan_date).toLocaleDateString() : 'Never'}
            </Text>
          </View>
        );
      })}
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
  statusHeaderBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'center',
  },
  statusHeaderBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  statusActive: {
    backgroundColor: '#dcfce7',
  },
  statusInactive: {
    backgroundColor: '#f1f5f9',
  },
  statusActiveText: {
    color: '#16a34a',
  },
  statusInactiveText: {
    color: '#64748b',
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabsScroll: {
    paddingHorizontal: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 3,
  },
  tabBadgeActive: {
    backgroundColor: '#3b82f6',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  tabContent: {
    paddingBottom: 30,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
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
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  listCardSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 3,
  },
  listCardNote: {
    fontSize: 11,
    color: '#475569',
    marginTop: 6,
    fontStyle: 'italic',
  },
  medDetailText: {
    fontSize: 12,
    color: '#1e293b',
    marginBottom: 4,
  },
  boldText: {
    fontWeight: '700',
  },
  dischargeSection: {
    marginTop: 4,
  },
  dischargeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  dischargeValue: {
    fontSize: 12,
    color: '#0f172a',
    marginTop: 1,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '700',
    marginBottom: 4,
  },
  nestedItemList: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  nestedItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  nestedItemName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1e293b',
  },
  nestedItemDetails: {
    fontSize: 11,
    color: '#64748b',
  },
  cardActionBtn: {
    marginTop: 10,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 6,
  },
  cardActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  timelineIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  timelineDate: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 2,
  },
  timelineTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  timelineDesc: {
    fontSize: 11,
    color: '#475569',
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 40,
  },
});
