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
import ScreenTemplate from '../../components/ScreenTemplate';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export default function PatientRecord() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { id } = route.params;

  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [activeTab, setActiveTab] = useState('timeline');
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [qrCodes, setQrCodes] = useState<any[]>([]);

  useEffect(() => {
    async function fetchAllData() {
      try {
        setLoading(true);
        const [patRes, consRes, admRes, presRes, schedRes, qrRes] =
          await Promise.all([
            api.get(`/patients/${id}`),
            api.get(`/consultations?patient_id=${id}`),
            api.get(`/admissions?patient_id=${id}`),
            api.get(`/prescriptions?patient_id=${id}`),
            api.get(`/schedules/patient/${id}`),
            api.get(`/qr-codes/patient/${id}`),
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
    fetchAllData();
  }, [id]);

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

  async function handleNewConsultation() {
    try {
      await api.post('/consultations', {
        patient_id: patient.id,
        doctor_id: user?.id,
        notes: 'Ad-hoc Consultation / Rounds',
      });
      navigation.navigate('Consultations');
    } catch (err: any) {
      console.error('Failed to create consultation:', err);
    }
  }

  if (loading) {
    return (
      <ScreenTemplate title="Patient Record">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading Patient Record...</Text>
        </View>
      </ScreenTemplate>
    );
  }

  if (!patient) {
    return (
      <ScreenTemplate title="Patient Record">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.notFoundCard}>
          <Text style={styles.notFoundTitle}>Patient Not Found</Text>
        </View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate title="Patient Record">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backIcon}
            >
              <Text style={styles.backIconText}>←</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.patientName} numberOfLines={1}>
                {patient.first_name} {patient.last_name}
              </Text>
              <Text style={styles.patientMeta} numberOfLines={2}>
                ID: {patient.id} • {patient.age ? `${patient.age} yrs` : patient.date_of_birth}{' '}
                • {patient.gender} • {patient.blood_type || 'Unknown Blood Type'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.newConsultBtn}
            onPress={handleNewConsultation}
          >
            <Text style={styles.newConsultBtnText}>🩺 New Consult</Text>
          </TouchableOpacity>
        </View>

        {/* Body: Sidebar (tablet) or Horizontal tabs (phone) */}
        <View style={[styles.body, isTablet && styles.bodyTablet]}>
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
                {activeTab === 'info' && <TabInformation patient={patient} isTablet={isTablet} />}
                {activeTab === 'consultations' && (
                  <TabConsultations consultations={consultations} />
                )}
                {activeTab === 'admissions' && (
                  <TabAdmissions admissions={admissions} />
                )}
                {activeTab === 'prescriptions' && (
                  <TabPrescriptions prescriptions={prescriptions} isTablet={isTablet} />
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
    </ScreenTemplate>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────────────────────

function TabInformation({ patient, isTablet }: any) {
  const items = [
    { label: 'First Name', value: patient.first_name },
    { label: 'Last Name', value: patient.last_name },
    {
      label: 'Date of Birth',
      value: patient.date_of_birth
        ? new Date(patient.date_of_birth).toLocaleDateString()
        : '—',
    },
    { label: 'Gender', value: patient.gender, capitalize: true },
    {
      label: 'Civil Status',
      value: patient.civil_status || '—',
      capitalize: true,
    },
    { label: 'Blood Type', value: patient.blood_type || '—' },
    { label: 'Contact Number', value: patient.contact_number || '—' },
    { label: 'Email', value: patient.user?.email || 'No online account' },
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

function TabConsultations({ consultations }: any) {
  if (!consultations.length) return <EmptyState title="No Consultation History" />;
  return (
    <View>
      <Text style={styles.sectionTitle}>B. Consultation History</Text>
      {consultations.map((c: any) => (
        <View key={c.id} style={styles.historyCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              Consultation #{String(c.id).padStart(4, '0')}
            </Text>
            <Text style={styles.cardDate}>
              {new Date(
                c.status === 'completed' || c.status === 'admitted'
                  ? c.updated_at
                  : c.created_at
              ).toLocaleString()}
            </Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardText}>
              <Text style={styles.cardTextBold}>Doctor: </Text>
              Dr. {c.doctor?.first_name} {c.doctor?.last_name}
            </Text>
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

function TabAdmissions({ admissions }: any) {
  if (!admissions.length) return <EmptyState title="No Confinement History" />;
  return (
    <View>
      <Text style={styles.sectionTitle}>C. Confinement / Admission History</Text>
      {admissions.map((a: any) => (
        <View key={a.id} style={styles.historyCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              Confinement #{String(a.id).padStart(4, '0')}
            </Text>
            <View
              style={[
                styles.badge,
                a.status === 'discharged'
                  ? styles.badgeCompleted
                  : styles.badgeActive,
              ]}
            >
              <Text style={styles.badgeText}>{a.status?.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardText}>
              <Text style={styles.cardTextBold}>Admitted: </Text>
              {new Date(a.admission_date).toLocaleString()}
            </Text>
            <Text style={styles.cardText}>
              <Text style={styles.cardTextBold}>Discharged: </Text>
              {a.discharge_date
                ? new Date(a.discharge_date).toLocaleString()
                : 'Ongoing'}
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
              <Text style={styles.cardTextBold}>Reason: </Text>
              {a.reason_for_admission || '—'}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function TabPrescriptions({ prescriptions }: any) {
  if (!prescriptions.length) return <EmptyState title="No Prescription History" />;
  return (
    <View>
      <Text style={styles.sectionTitle}>D. Prescription History</Text>
      {prescriptions.map((p: any) => (
        <View key={p.id} style={styles.historyCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              Rx #{String(p.id).padStart(4, '0')} ({p.type?.replace('_', ' ')})
            </Text>
            <Text style={styles.cardDate}>
              {new Date(p.created_at).toLocaleString()}
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

            {/* Nested med table */}
            <View style={styles.nestedTable}>
              <View style={styles.nestedHeaderRow}>
                <Text style={[styles.nestedTh, { flex: 2 }]}>Medication</Text>
                <Text style={[styles.nestedTh, { flex: 1 }]}>Dosage</Text>
                <Text style={[styles.nestedTh, { flex: 1 }]}>Frequency</Text>
              </View>
              {p.items?.map((item: any) => (
                <View key={item.id} style={styles.nestedRow}>
                  <Text style={[styles.nestedTd, { flex: 2 }]} numberOfLines={2}>
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

function TabMedications({ prescriptions }: any) {
  const allMeds = prescriptions.flatMap(
    (p: any) => p.items?.map((i: any) => ({ ...i, prescription: p })) || []
  );

  if (!allMeds.length) return <EmptyState title="No Medication History" />;
  return (
    <View>
      <Text style={styles.sectionTitle}>E. Medication History</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={{ minWidth: 640 }}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { width: 110 }]}>Date</Text>
            <Text style={[styles.th, { width: 160 }]}>Medication</Text>
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
                style={[styles.td, { width: 160, fontWeight: '600' }]}
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

function TabAdministrations({ schedules }: any) {
  if (!schedules.length) return <EmptyState title="No Administration History" />;
  return (
    <View>
      <Text style={styles.sectionTitle}>F. Medication Administration History</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={{ minWidth: 640 }}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { width: 150 }]}>Scheduled</Text>
            <Text style={[styles.th, { width: 160 }]}>Medication</Text>
            <Text style={[styles.th, { width: 150 }]}>Administered</Text>
            <Text style={[styles.th, { width: 110 }]}>By</Text>
            <Text style={[styles.th, { width: 90 }]}>Status</Text>
          </View>
          {schedules.map((s: any, idx: number) => (
            <View
              key={s.id}
              style={[styles.tableRow, idx % 2 === 0 && styles.tableRowEven]}
            >
              <Text style={[styles.td, { width: 150 }]}>
                {new Date(s.scheduled_time).toLocaleString()}
              </Text>
              <Text
                style={[styles.td, { width: 160, fontWeight: '600' }]}
                numberOfLines={2}
              >
                {s.prescriptionItem?.medication_name}
              </Text>
              <Text style={[styles.td, { width: 150 }]}>
                {s.actual_administration_time
                  ? new Date(s.actual_administration_time).toLocaleString()
                  : '—'}
              </Text>
              <Text style={[styles.td, { width: 110 }]}>
                {s.administeredBy ? `Nurse ${s.administeredBy.last_name}` : '—'}
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

function TabDischarges({ admissions }: any) {
  const discharges = admissions.filter(
    (a: any) => a.status === 'discharged' && a.discharge_date
  );
  if (!discharges.length) return <EmptyState title="No Discharge History" />;
  return (
    <View>
      <Text style={styles.sectionTitle}>G. Discharge History</Text>
      {discharges.map((d: any) => (
        <View key={d.id} style={styles.historyCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              Discharge for Confinement #{String(d.id).padStart(4, '0')}
            </Text>
            <Text style={styles.cardDate}>
              {new Date(d.discharge_date).toLocaleString()}
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
              <Text style={styles.cardTextBold}>Follow-up: </Text>
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

function TabQrCodes({ qrCodes }: any) {
  if (!qrCodes.length) return <EmptyState title="No QR Code History" />;
  return (
    <View>
      <Text style={styles.sectionTitle}>H. QR Binding History</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={{ minWidth: 620 }}>
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
                {q.type?.replace('_', ' ')}
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

function TabTimeline({
  consultations,
  admissions,
  prescriptions,
  schedules,
}: any) {
  const events = useMemo(() => {
    const list: any[] = [];

    consultations.forEach((c: any) => {
      list.push({
        id: `cons-${c.id}`,
        type: 'consultation',
        icon: '🩺',
        date: new Date(c.created_at),
        title: `Consultation with Dr. ${c.doctor?.last_name}`,
        desc: `Diagnosis: ${c.assessment || 'N/A'}`,
      });
    });

    admissions.forEach((a: any) => {
      list.push({
        id: `adm-${a.id}`,
        type: 'admission',
        icon: '🛏️',
        date: new Date(a.admission_date),
        title: 'Patient Admitted',
        desc: `Room: ${a.room?.room_number || 'Unassigned'} | Attending: Dr. ${a.doctor?.last_name}`,
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

    prescriptions.forEach((p: any) => {
      list.push({
        id: `pres-${p.id}`,
        type: 'prescription',
        icon: '📄',
        date: new Date(p.created_at),
        title: `Prescription Created (${p.type?.replace('_', ' ')})`,
        desc: `${p.items?.length || 0} medications prescribed by Dr. ${p.doctor?.last_name}`,
      });
    });

    schedules.forEach((s: any) => {
      if (s.status === 'completed' && s.actual_administration_time) {
        list.push({
          id: `admin-${s.id}`,
          type: 'administration',
          icon: '💉',
          date: new Date(s.actual_administration_time),
          title: `Medication Administered: ${s.prescriptionItem?.medication_name}`,
          desc: `Administered by Nurse ${s.administeredBy?.last_name}`,
        });
      }
    });

    return list.sort((a, b) => b.date - a.date);
  }, [consultations, admissions, prescriptions, schedules]);

  if (!events.length) return <EmptyState title="No Activity Timeline" />;

  return (
    <View>
      <Text style={styles.sectionTitle}>I. Patient Record Timeline</Text>
      <View style={styles.timeline}>
        {events.map((event) => (
          <View key={event.id} style={styles.timelineItem}>
            <View style={[styles.timelineIcon, (styles as any)[`timelineIcon_${event.type}`]]}>
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

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: { color: '#64748b', marginTop: 12 },

  backButton: { marginBottom: 16 },
  backText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  notFoundCard: {
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIconText: { fontSize: 18, color: '#475569', fontWeight: '700' },
  patientName: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  patientMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },
  newConsultBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  newConsultBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Body
  body: { flex: 1 },
  bodyTablet: { flexDirection: 'row' },
  sidebar: {
    width: 220,
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

  // Phone tabs
  tabsScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
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
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    flex: 1,
  },
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

  // Nested med table
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

  // Tables
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
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 18,
    gap: 12,
  },
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
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyText: { color: '#64748b', textAlign: 'center', fontSize: 13 },
});