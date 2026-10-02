import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────
interface PatientInfo {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  age?: number | string;
  gender?: string;
  civil_status?: string;
  blood_type?: string;
  contact_number?: string;
  address?: string;
  allergies?: string;
  emergency_contact_name?: string;
  emergency_contact_number?: string;
  user?: { email?: string };
}

export default function PatientRecord() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { patientId, id } = route.params as { patientId?: number; id?: number };
  const pid = patientId ?? id;

  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [activeTab, setActiveTab] = useState('timeline');
  const [loading, setLoading] = useState(true);

  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [qrCodes, setQrCodes] = useState<any[]>([]);

  useEffect(() => {
    fetchAllData();
  }, [pid]);

  async function fetchAllData() {
    try {
      setLoading(true);
      const [patRes, consRes, admRes, presRes, schedRes, qrRes] =
        await Promise.all([
          api.get(`/patients/${pid}`),
          api.get(`/consultations?patient_id=${pid}`),
          api.get(`/admissions?patient_id=${pid}`),
          api.get(`/prescriptions?patient_id=${pid}`),
          api.get(`/schedules/patient/${pid}`),
          api.get(`/qr-codes/patient/${pid}`),
        ]);

      setPatient(patRes.data.data);
      setConsultations(consRes.data.data || []);
      setAdmissions(admRes.data.data || []);
      setPrescriptions(presRes.data.data || []);
      setSchedules(schedRes.data.data || []);
      setQrCodes(qrRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch patient record data:', err);
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: 'info', label: 'Patient Info', icon: '👤' },
    { id: 'consultations', label: 'Consultations', icon: '🩺' },
    { id: 'admissions', label: 'Confinements', icon: '🛏️' },
    { id: 'prescriptions', label: 'Prescriptions', icon: '📄' },
    { id: 'medications', label: 'Medications', icon: '💊' },
    { id: 'administrations', label: 'Administrations', icon: '💉' },
    { id: 'discharges', label: 'Discharges', icon: '📤' },
    { id: 'qrcodes', label: 'QR Bindings', icon: '🔗' },
    { id: 'timeline', label: 'Timeline', icon: '🕐' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading Patient Record...</Text>
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.errorContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.notFoundBox}>
          <Text style={styles.notFoundTitle}>Patient Not Found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backIconBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIconText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.patientName} numberOfLines={1}>
            {patient.first_name} {patient.last_name}
          </Text>
          <Text style={styles.patientMeta} numberOfLines={2}>
            ID: {patient.id} •{' '}
            {patient.age ? `${patient.age} yrs` : formatDOB(patient.date_of_birth)}{' '}
            • {patient.gender || '—'} • {patient.blood_type || 'Unknown Blood Type'}
          </Text>
        </View>
      </View>

      {/* Body */}
      <View style={[styles.body, isTablet && styles.bodyTablet]}>
        {/* Sidebar on tablet */}
        {isTablet ? (
          <View style={styles.sidebar}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabBtn,
                  activeTab === tab.id && styles.tabBtnActive,
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === tab.id && styles.tabBtnTextActive,
                  ]}
                >
                  {tab.icon} {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <View style={styles.mainArea}>
          {/* Chip bar on phone */}
          {!isTablet ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsScroll}
            >
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.chip,
                    activeTab === tab.id && styles.chipActive,
                  ]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      activeTab === tab.id && styles.chipTextActive,
                    ]}
                  >
                    {tab.icon} {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}

          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentCard}>
              {activeTab === 'info' && (
                <TabInformation patient={patient} isTablet={isTablet} />
              )}
              {activeTab === 'consultations' && (
                <TabConsultations consultations={consultations} />
              )}
              {activeTab === 'admissions' && (
                <TabAdmissions admissions={admissions} />
              )}
              {activeTab === 'prescriptions' && (
                <TabPrescriptions prescriptions={prescriptions} />
              )}
              {activeTab === 'medications' && (
                <TabMedications prescriptions={prescriptions} />
              )}
              {activeTab === 'administrations' && (
                <TabAdministrations schedules={schedules} />
              )}
              {activeTab === 'discharges' && (
                <TabDischarges admissions={admissions} />
              )}
              {activeTab === 'qrcodes' && <TabQrCodes qrCodes={qrCodes} />}
              {activeTab === 'timeline' && (
                <TabTimeline
                  consultations={consultations}
                  admissions={admissions}
                  prescriptions={prescriptions}
                  schedules={schedules}
                />
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatDOB(dob?: string) {
  if (!dob) return '—';
  return new Date(dob).toLocaleDateString();
}
function fmtDateTime(v?: string) {
  if (!v) return '—';
  return new Date(v).toLocaleString();
}
function pad4(n: number | string) {
  return String(n).padStart(4, '0');
}

// ─────────────────────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────────────────────

function TabInformation({
  patient,
  isTablet,
}: {
  patient: PatientInfo;
  isTablet: boolean;
}) {
  const items = [
    { label: 'First Name', value: patient.first_name },
    { label: 'Last Name', value: patient.last_name },
    { label: 'Date of Birth', value: formatDOB(patient.date_of_birth) },
    { label: 'Gender', value: patient.gender || '—', capitalize: true },
    {
      label: 'Civil Status',
      value: patient.civil_status || '—',
      capitalize: true,
    },
    { label: 'Blood Type', value: patient.blood_type || '—' },
    { label: 'Contact Number', value: patient.contact_number || '—' },
    { label: 'Email Address', value: patient.user?.email || 'No online account' },
    {
      label: 'Emergency Contact Name',
      value: patient.emergency_contact_name || '—',
    },
    {
      label: 'Emergency Contact Number',
      value: patient.emergency_contact_number || '—',
    },
  ];

  return (
    <View>
      <Text style={styles.sectionTitle}>A. Patient Information</Text>
      <View style={styles.infoGrid}>
        {items.map((it) => (
          <View
            key={it.label}
            style={[styles.infoGroup, isTablet && styles.infoGroupHalf]}
          >
            <Text style={styles.infoLabel}>{it.label}</Text>
            <Text
              style={[
                styles.infoValue,
                it.capitalize && { textTransform: 'capitalize' },
              ]}
            >
              {it.value}
            </Text>
          </View>
        ))}
        <View style={[styles.infoGroup, styles.infoGroupFull]}>
          <Text style={styles.infoLabel}>Address</Text>
          <Text style={styles.infoValue}>{patient.address || '—'}</Text>
        </View>
        <View style={[styles.infoGroup, styles.infoGroupFull]}>
          <Text style={styles.infoLabel}>Allergies</Text>
          <Text style={[styles.infoValue, { color: '#dc2626' }]}>
            {patient.allergies || 'None recorded'}
          </Text>
        </View>
      </View>
    </View>
  );
}

function TabConsultations({ consultations }: { consultations: any[] }) {
  if (!consultations.length)
    return <EmptyState title="No Consultation History" />;
  return (
    <View>
      <Text style={styles.sectionTitle}>B. Consultation History</Text>
      {consultations.map((c) => (
        <View key={c.id} style={styles.historyCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              Consultation #{pad4(c.id)}
            </Text>
            <Text style={styles.cardDate}>
              {fmtDateTime(
                c.status === 'completed' || c.status === 'admitted'
                  ? c.updated_at
                  : c.created_at
              )}
            </Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardText}>
              <Text style={styles.cardTextBold}>Doctor: </Text>
              Dr. {c.doctor?.first_name} {c.doctor?.last_name}
            </Text>
            {c.department ? (
              <Text style={styles.cardText}>
                <Text style={styles.cardTextBold}>Department: </Text>
                {c.department}
              </Text>
            ) : null}
            <Text style={styles.cardText}>
              <Text style={styles.cardTextBold}>Chief Complaint: </Text>
              {c.chief_complaint || '—'}
            </Text>
            <Text style={styles.cardText}>
              <Text style={styles.cardTextBold}>Diagnosis: </Text>
              {c.assessment || c.diagnosis || '—'}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function TabAdmissions({ admissions }: { admissions: any[] }) {
  if (!admissions.length)
    return <EmptyState title="No Confinement History" />;
  return (
    <View>
      <Text style={styles.sectionTitle}>
        C. Confinement / Admission History
      </Text>
      {admissions.map((a) => (
        <View key={a.id} style={styles.historyCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              Confinement #{pad4(a.id)}
            </Text>
            <View
              style={[
                styles.badge,
                a.status === 'discharged'
                  ? styles.badgeCompleted
                  : styles.badgeActive,
              ]}
            >
              <Text style={styles.badgeText}>
                {String(a.status || '').toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardText}>
              <Text style={styles.cardTextBold}>Admitted: </Text>
              {fmtDateTime(a.admission_date)}
            </Text>
            <Text style={styles.cardText}>
              <Text style={styles.cardTextBold}>Discharged: </Text>
              {a.discharge_date ? fmtDateTime(a.discharge_date) : 'Ongoing'}
            </Text>
            <Text style={styles.cardText}>
              <Text style={styles.cardTextBold}>Room: </Text>
              {a.room?.room_number || 'Unassigned'}
            </Text>
            <Text style={styles.cardText}>
              <Text style={styles.cardTextBold}>Attending Doctor: </Text>
              Dr. {a.doctor?.first_name} {a.doctor?.last_name}
            </Text>
            <Text style={styles.cardText}>
              <Text style={styles.cardTextBold}>Reason for Admission: </Text>
              {a.reason_for_admission || '—'}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function TabPrescriptions({ prescriptions }: { prescriptions: any[] }) {
  if (!prescriptions.length)
    return <EmptyState title="No Prescription History" />;
  return (
    <View>
      <Text style={styles.sectionTitle}>D. Prescription History</Text>
      {prescriptions.map((p) => (
        <View key={p.id} style={styles.historyCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              Prescription #{pad4(p.id)} ({String(p.type || '').replace('_', ' ')})
            </Text>
            <Text style={styles.cardDate}>
              {fmtDateTime(p.created_at)}
            </Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardText}>
              <Text style={styles.cardTextBold}>Doctor: </Text>
              Dr. {p.doctor?.first_name} {p.doctor?.last_name}
            </Text>
            <Text style={styles.cardText}>
              <Text style={styles.cardTextBold}>Notes: </Text>
              {p.notes || '—'}
            </Text>

            {/* Nested med list */}
            <View style={styles.nestedTable}>
              <View style={styles.nestedHeaderRow}>
                <Text style={[styles.nestedTh, { flex: 2 }]}>Medication</Text>
                <Text style={[styles.nestedTh, { flex: 1 }]}>Dosage</Text>
                <Text style={[styles.nestedTh, { flex: 1 }]}>Frequency</Text>
              </View>
              {p.items?.map((item: any) => (
                <View key={item.id} style={styles.nestedRow}>
                  <Text
                    style={[styles.nestedTd, { flex: 2 }]}
                    numberOfLines={2}
                  >
                    {item.medication_name}
                  </Text>
                  <Text style={[styles.nestedTd, { flex: 1 }]}>
                    {item.dosage}
                  </Text>
                  <Text style={[styles.nestedTd, { flex: 1 }]}>
                    {item.frequency}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function TabMedications({ prescriptions }: { prescriptions: any[] }) {
  const allMeds = prescriptions.flatMap(
    (p: any) => p.items?.map((i: any) => ({ ...i, prescription: p })) || []
  );

  if (!allMeds.length) return <EmptyState title="No Medication History" />;
  return (
    <View>
      <Text style={styles.sectionTitle}>E. Medication History</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={{ minWidth: 660 }}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { width: 110 }]}>Date</Text>
            <Text style={[styles.th, { width: 170 }]}>Medication</Text>
            <Text style={[styles.th, { width: 100 }]}>Dosage</Text>
            <Text style={[styles.th, { width: 100 }]}>Frequency</Text>
            <Text style={[styles.th, { width: 100 }]}>Doctor</Text>
            <Text style={[styles.th, { width: 80 }]}>Status</Text>
          </View>
          {allMeds.map((m: any, idx: number) => (
            <View
              key={m.id}
              style={[styles.tableRow, idx % 2 === 0 && styles.tableRowEven]}
            >
              <Text style={[styles.td, { width: 110 }]}>
                {new Date(m.prescription.created_at).toLocaleDateString()}
              </Text>
              <Text
                style={[styles.td, { width: 170, fontWeight: '600' }]}
                numberOfLines={2}
              >
                {m.medication_name}
              </Text>
              <Text style={[styles.td, { width: 100 }]}>{m.dosage}</Text>
              <Text style={[styles.td, { width: 100 }]}>{m.frequency}</Text>
              <Text style={[styles.td, { width: 100 }]}>
                Dr. {m.prescription.doctor?.last_name}
              </Text>
              <View style={{ width: 80 }}>
                <View
                  style={[
                    styles.badge,
                    m.status === 'active'
                      ? styles.badgeActive
                      : styles.badgeCompleted,
                  ]}
                >
                  <Text style={styles.badgeText}>{m.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function TabAdministrations({ schedules }: { schedules: any[] }) {
  if (!schedules.length)
    return <EmptyState title="No Administration History" />;
  return (
    <View>
      <Text style={styles.sectionTitle}>
        F. Medication Administration History
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={{ minWidth: 680 }}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { width: 150 }]}>Scheduled</Text>
            <Text style={[styles.th, { width: 170 }]}>Medication</Text>
            <Text style={[styles.th, { width: 150 }]}>Administered</Text>
            <Text style={[styles.th, { width: 120 }]}>By</Text>
            <Text style={[styles.th, { width: 90 }]}>Status</Text>
          </View>
          {schedules.map((s: any, idx: number) => (
            <View
              key={s.id}
              style={[styles.tableRow, idx % 2 === 0 && styles.tableRowEven]}
            >
              <Text style={[styles.td, { width: 150 }]}>
                {fmtDateTime(s.scheduled_time)}
              </Text>
              <Text
                style={[styles.td, { width: 170, fontWeight: '600' }]}
                numberOfLines={2}
              >
                {s.prescriptionItem?.medication_name}
              </Text>
              <Text style={[styles.td, { width: 150 }]}>
                {s.actual_administration_time
                  ? fmtDateTime(s.actual_administration_time)
                  : '—'}
              </Text>
              <Text style={[styles.td, { width: 120 }]}>
                {s.administeredBy
                  ? `Nurse ${s.administeredBy.last_name}`
                  : '—'}
              </Text>
              <View style={{ width: 90 }}>
                <View
                  style={[
                    styles.badge,
                    s.status === 'completed'
                      ? styles.badgeCompleted
                      : s.status === 'missed'
                      ? styles.badgeDanger
                      : styles.badgePending,
                  ]}
                >
                  <Text style={styles.badgeText}>{s.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function TabDischarges({ admissions }: { admissions: any[] }) {
  const discharges = admissions.filter(
    (a) => a.status === 'discharged' && a.discharge_date
  );
  if (!discharges.length) return <EmptyState title="No Discharge History" />;
  return (
    <View>
      <Text style={styles.sectionTitle}>G. Discharge History</Text>
      {discharges.map((d) => (
        <View key={d.id} style={styles.historyCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              Discharge for Confinement #{pad4(d.id)}
            </Text>
            <Text style={styles.cardDate}>
              {fmtDateTime(d.discharge_date)}
            </Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardText}>
              <Text style={styles.cardTextBold}>Final Diagnosis: </Text>
              {d.final_diagnosis || '—'}
            </Text>
            <Text style={styles.cardText}>
              <Text style={styles.cardTextBold}>Condition: </Text>
              {d.condition_at_discharge || '—'}
            </Text>
            <Text style={styles.cardText}>
              <Text style={styles.cardTextBold}>Summary: </Text>
              {d.discharge_summary || '—'}
            </Text>
            <Text style={styles.cardText}>
              <Text style={styles.cardTextBold}>Follow-up Date: </Text>
              {d.follow_up_date
                ? new Date(d.follow_up_date).toLocaleDateString()
                : '—'}
            </Text>
            <Text style={styles.cardText}>
              <Text style={styles.cardTextBold}>Instructions: </Text>
              {d.follow_up_instructions || '—'}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function TabQrCodes({ qrCodes }: { qrCodes: any[] }) {
  if (!qrCodes.length) return <EmptyState title="No QR Code History" />;
  return (
    <View>
      <Text style={styles.sectionTitle}>H. QR Binding History</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={{ minWidth: 640 }}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { width: 120 }]}>Type</Text>
            <Text style={[styles.th, { width: 180 }]}>QR Code</Text>
            <Text style={[styles.th, { width: 120 }]}>Created</Text>
            <Text style={[styles.th, { width: 120 }]}>First Scan</Text>
            <Text style={[styles.th, { width: 100 }]}>Status</Text>
          </View>
          {qrCodes.map((q: any, idx: number) => (
            <View
              key={q.id}
              style={[styles.tableRow, idx % 2 === 0 && styles.tableRowEven]}
            >
              <Text
                style={[styles.td, { width: 120, textTransform: 'capitalize' }]}
              >
                {String(q.type || '').replace('_', ' ')}
              </Text>
              <Text style={[styles.td, { width: 180 }]} numberOfLines={1}>
                {q.code}
              </Text>
              <Text style={[styles.td, { width: 120 }]}>
                {new Date(q.created_at).toLocaleDateString()}
              </Text>
              <Text style={[styles.td, { width: 120 }]}>
                {q.first_scan_date
                  ? new Date(q.first_scan_date).toLocaleDateString()
                  : 'Never'}
              </Text>
              <View style={{ width: 100 }}>
                <View
                  style={[
                    styles.badge,
                    q.status === 'bound'
                      ? styles.badgeCompleted
                      : q.status === 'active'
                      ? styles.badgePending
                      : styles.badgeDanger,
                  ]}
                >
                  <Text style={styles.badgeText}>{q.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// EmptyState Component (defined here to be used in TabTimeline)
function EmptyState({ title }: { title: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>
        There are no records available in this section yet.
      </Text>
    </View>
  );
}

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

    consultations.forEach((c) => {
      list.push({
        id: `cons-${c.id}`,
        type: 'consultation',
        icon: '🩺',
        date: new Date(c.created_at),
        title: `Consultation with Dr. ${c.doctor?.last_name || ''}`,
        desc: `Diagnosis: ${c.assessment || 'N/A'}`,
      });
    });

    admissions.forEach((a) => {
      list.push({
        id: `adm-${a.id}`,
        type: 'admission',
        icon: '🛏️',
        date: new Date(a.admission_date),
        title: 'Patient Admitted',
        desc: `Room: ${a.room?.room_number || 'Unassigned'} | Attending: Dr. ${a.doctor?.last_name || ''}`,
      });
      if (a.discharge_date) {
        list.push({
          id: `dis-${a.id}`,
          type: 'discharge',
          icon: '📤',
          date: new Date(a.discharge_date),
          title: 'Patient Discharged',
          desc: `Final Diagnosis: ${a.final_diagnosis || 'N/A'}`,
        });
      }
    });

    prescriptions.forEach((p) => {
      list.push({
        id: `pres-${p.id}`,
        type: 'prescription',
        icon: '📄',
        date: new Date(p.created_at),
        title: `Prescription Created (${String(p.type || '').replace('_', ' ')})`,
        desc: `${p.items?.length || 0} medications prescribed by Dr. ${p.doctor?.last_name || ''}`,
      });
    });

    schedules.forEach((s) => {
      if (s.status === 'completed' && s.actual_administration_time) {
        list.push({
          id: `admin-${s.id}`,
          type: 'administration',
          icon: '💉',
          date: new Date(s.actual_administration_time),
          title: `Medication Administered: ${s.prescriptionItem?.medication_name || ''}`,
          desc: `Administered by Nurse ${s.administeredBy?.last_name || ''}`,
        });
      }
    });

    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [consultations, admissions, prescriptions, schedules]);

  if (!events.length) return <EmptyState title="No Activity Timeline" />;

  const getTimelineIconStyle = (type: string) => {
    const typeStyles: any = {
      consultation: styles.timelineIcon_consultation,
      admission: styles.timelineIcon_admission,
      discharge: styles.timelineIcon_discharge,
      prescription: styles.timelineIcon_prescription,
      administration: styles.timelineIcon_administration,
    };
    return typeStyles[type] || {};
  };

  return (
    <View>
      <Text style={styles.sectionTitle}>I. Patient Record Timeline</Text>
      <View style={styles.timeline}>
        {events.map((event) => (
          <View key={event.id} style={styles.timelineItem}>
            <View
              style={[
                styles.timelineIcon,
                getTimelineIconStyle(event.type),
              ]}
            >
              <Text style={styles.timelineIconText}>{event.icon}</Text>
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineDate}>
                {event.date.toLocaleString()}
              </Text>
              <Text style={styles.timelineTitle}>{event.title}</Text>
              <Text style={styles.timelineDesc}>{event.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: { color: '#64748b', marginTop: 12 },

  errorContainer: { flex: 1, padding: 24, backgroundColor: '#f8fafc' },
  backText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  notFoundBox: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  notFoundTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },

  // Header
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIconText: { fontSize: 18, color: '#475569', fontWeight: '700' },
  patientName: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  patientMeta: { fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 16 },

  // Body
  body: { flex: 1 },
  bodyTablet: { flexDirection: 'row' },
  sidebar: {
    width: 230,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    paddingVertical: 8,
  },
  tabBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: '#eff6ff',
    borderLeftColor: '#3b82f6',
  },
  tabBtnText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  tabBtnTextActive: { color: '#3b82f6' },

  mainArea: { flex: 1 },

  // Phone chips
  tabsScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  chipText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  contentScroll: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 60 },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },

  // Info grid
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  infoGroup: {
    width: '100%',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoGroupHalf: { width: '48%' },
  infoGroupFull: { width: '100%' },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: { fontSize: 14, color: '#1e293b', fontWeight: '500' },

  // History cards
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#334155', flex: 1 },
  cardDate: { fontSize: 11, color: '#64748b' },
  cardBody: { padding: 12, gap: 4 },
  cardText: { fontSize: 13, color: '#1e293b', lineHeight: 18 },
  cardTextBold: { fontWeight: '700', color: '#475569' },

  // Badges
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'capitalize',
  },
  badgeActive: { backgroundColor: '#3b82f6' },
  badgeCompleted: { backgroundColor: '#10b981' },
  badgeDanger: { backgroundColor: '#ef4444' },
  badgePending: { backgroundColor: '#f59e0b' },

  // Nested table
  nestedTable: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  nestedHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  nestedTh: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  nestedRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  nestedTd: { fontSize: 12, color: '#1e293b' },

  // Wide tables
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  tableRowEven: { backgroundColor: '#fafbfc' },
  td: { fontSize: 12, color: '#1e293b' },

  // Timeline
  timeline: { paddingLeft: 8 },
  timelineItem: { flexDirection: 'row', marginBottom: 18, gap: 12 },
  timelineIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
  },
  timelineIcon_consultation: { backgroundColor: '#dbeafe' },
  timelineIcon_admission: { backgroundColor: '#dcfce7' },
  timelineIcon_discharge: { backgroundColor: '#fef3c7' },
  timelineIcon_prescription: { backgroundColor: '#f3e8ff' },
  timelineIcon_administration: { backgroundColor: '#fee2e2' },
  timelineIconText: { fontSize: 16 },
  timelineContent: { flex: 1 },
  timelineDate: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  timelineDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyText: { color: '#64748b', textAlign: 'center', fontSize: 13 },
});