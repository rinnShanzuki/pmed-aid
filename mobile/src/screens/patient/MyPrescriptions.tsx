import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import ScreenTemplate from '../../components/ScreenTemplate';
import api from '../../services/api';

interface Prescription {
  id: number;
  status: string;
  created_at: string;
  notes?: string;
  doctor?: {
    last_name: string;
  };
  items?: Array<{
    id: number;
    medication_name: string;
    dosage: string;
    dosage_unit: string;
    frequency: string;
  }>;
}

export default function MyPrescriptions({ navigation }: any) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const meRes = await api.get('/patients/me');
        const pId = meRes.data.data.id;

        const presRes = await api.get('/prescriptions', { params: { patient_id: pId } });
        setPrescriptions(presRes.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const active = prescriptions.filter((p) => p.status === 'active');
  const past = prescriptions.filter((p) => p.status !== 'active');

  return (
    <ScreenTemplate title="My Prescriptions">
      <ScrollView>
          {loading ? (
            <Text style={styles.loadingText}>Loading your prescriptions...</Text>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Current Prescriptions</Text>
              {active.length === 0 ? (
                <Text style={styles.emptyText}>You have no active prescriptions.</Text>
              ) : (
                <>
                  {active.map((item) => (
                    <View key={item.id} style={styles.activeCard}>
                      <View style={styles.cardHeader}>
                        <View style={[styles.badge, styles.activeBadge]}>
                          <Text style={styles.badgeText}>Active</Text>
                        </View>
                        <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
                      </View>
                      <Text style={styles.doctorText}>Prescribed by: Dr. {item.doctor?.last_name}</Text>
                      {item.notes && <Text style={styles.notesText}>"{item.notes}"</Text>}

                      <View style={styles.medsContainer}>
                        <Text style={styles.medsLabel}>MEDICATIONS:</Text>
                        {item.items?.map((med) => (
                          <Text key={med.id} style={styles.medItem}>
                            • <Text style={styles.medName}>{med.medication_name}</Text> - {med.dosage} {med.dosage_unit}{' '}
                            <Text style={styles.medFreq}>({med.frequency})</Text>
                          </Text>
                        ))}
                      </View>
                    </View>
                  ))}
                </>
              )}

              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Past Prescriptions</Text>
              {past.length === 0 ? (
                <Text style={styles.emptyText}>No past prescriptions found.</Text>
              ) : (
                <>
                  {past.map((item) => (
                    <View key={item.id} style={styles.pastCard}>
                      <View style={styles.pastLeft}>
                        <Text style={styles.pastDoctor}>Dr. {item.doctor?.last_name}</Text>
                        <Text style={styles.pastMedCount}>{item.items?.length || 0} medications</Text>
                      </View>
                      <View style={styles.pastRight}>
                        <View style={[styles.badge, styles.inactiveBadge]}>
                          <Text style={styles.badgeText}>{item.status}</Text>
                        </View>
                        <Text style={styles.pastDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </>
          )}
        </ScrollView>
      </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  activeCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#10b981',
  },
  inactiveBadge: {
    backgroundColor: '#94a3b8',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
  },
  doctorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  medsContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
  },
  medsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  medItem: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 4,
  },
  medName: {
    fontWeight: '600',
  },
  medFreq: {
    color: '#64748b',
  },
  pastCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pastLeft: {},
  pastDoctor: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  pastMedCount: {
    fontSize: 12,
    color: '#64748b',
  },
  pastRight: {
    alignItems: 'flex-end',
  },
  pastDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  loadingText: {
    color: '#64748b',
  },
  emptyText: {
    color: '#64748b',
    marginBottom: 32,
  },
});

