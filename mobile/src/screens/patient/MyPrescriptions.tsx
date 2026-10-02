import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import ScreenTemplate from '../../components/ScreenTemplate';
import api from '../../services/api';

interface Prescription {
  id: number;
  status: string;
  created_at: string;
  notes?: string;
  doctor?: {
    first_name?: string;
    last_name: string;
  };
  items?: Array<{
    id: number;
    medication_name: string;
    dosage: string;
    dosage_unit?: string;
    frequency: string;
  }>;
}

export default function MyPrescriptions() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isSmallPhone = width < 375;

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const meRes = await api.get('/patients/me');
      const pId = meRes.data.data.id;
      const presRes = await api.get('/prescriptions', {
        params: { patient_id: pId },
      });
      setPrescriptions(presRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const active = prescriptions.filter((p) => p.status === 'active');
  const past = prescriptions.filter((p) => p.status !== 'active');

  return (
    <ScreenTemplate title="My Prescriptions">
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          isSmallPhone && styles.contentContainerSmall,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>📄</Text>
          <Text style={styles.sectionTitle}>My Prescriptions</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>
              Loading your prescriptions...
            </Text>
          </View>
        ) : (
          <>
            {/* ── Current Prescriptions ── */}
            <Text style={styles.groupTitle}>Current Prescriptions</Text>
            {active.length === 0 ? (
              <Text style={styles.emptyText}>
                You have no active prescriptions.
              </Text>
            ) : (
              <View
                style={[
                  styles.activeGrid,
                  isTablet && styles.activeGridTablet,
                ]}
              >
                {active.map((p) => (
                  <View
                    key={p.id}
                    style={[
                      styles.activeCard,
                      isTablet && styles.activeCardTablet,
                    ]}
                  >
                    {/* Header row */}
                    <View style={styles.cardHeader}>
                      <View style={[styles.badge, styles.activeBadge]}>
                        <Text style={styles.badgeText}>Active</Text>
                      </View>
                      <Text style={styles.dateText}>
                        📅 {new Date(p.created_at).toLocaleDateString()}
                      </Text>
                    </View>

                    {/* Doctor */}
                    <Text style={styles.doctorText}>
                      Prescribed by:{' '}
                      <Text style={styles.doctorName}>
                        Dr. {p.doctor?.last_name}
                      </Text>
                    </Text>

                    {/* Notes */}
                    {p.notes ? (
                      <Text style={styles.notesText}>"{p.notes}"</Text>
                    ) : null}

                    {/* Medications box */}
                    <View style={styles.medsContainer}>
                      <Text style={styles.medsLabel}>MEDICATIONS:</Text>
                      {p.items?.length ? (
                        p.items.map((item) => (
                          <View key={item.id} style={styles.medItemRow}>
                            <Text style={styles.medBullet}>•</Text>
                            <Text style={styles.medItem}>
                              <Text style={styles.medName}>
                                {item.medication_name}
                              </Text>
                              {' - '}
                              {item.dosage}
                              {item.dosage_unit
                                ? ` ${item.dosage_unit}`
                                : ''}{' '}
                              <Text style={styles.medFreq}>
                                ({item.frequency})
                              </Text>
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.noMedsText}>
                          No medications listed.
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* ── Past Prescriptions ── */}
            <Text style={[styles.groupTitle, { marginTop: 28 }]}>
              Past Prescriptions
            </Text>
            {past.length === 0 ? (
              <Text style={styles.emptyText}>
                No past prescriptions found.
              </Text>
            ) : (
              <View style={styles.pastList}>
                {past.map((p) => (
                  <View key={p.id} style={styles.pastCard}>
                    <View style={styles.pastLeft}>
                      <Text style={styles.pastDoctor} numberOfLines={1}>
                        Dr. {p.doctor?.last_name}
                      </Text>
                      <Text style={styles.pastMedCount}>
                        {p.items?.length || 0} medication
                        {p.items?.length === 1 ? '' : 's'}
                      </Text>
                    </View>
                    <View style={styles.pastRight}>
                      <View style={[styles.badge, styles.inactiveBadge]}>
                        <Text style={styles.badgeText}>{p.status}</Text>
                      </View>
                      <Text style={styles.pastDate}>
                        {new Date(p.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  contentContainer: { padding: 16, paddingBottom: 40 },
  contentContainerSmall: { padding: 12 },

  // Section header (matches web's .id-section-header)
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIcon: { fontSize: 22, marginRight: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b' },

  // Loading
  loadingContainer: { paddingVertical: 60, alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#64748b', fontSize: 14 },

  // Group titles
  groupTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 14,
  },

  // Active grid
  activeGrid: { gap: 16, marginBottom: 8 },
  activeGridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  activeCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  activeCardTablet: { width: '48%' },

  // Card header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },

  // Badges (match web's .badge.active / .badge.inactive)
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  activeBadge: { backgroundColor: '#10b981' },
  inactiveBadge: { backgroundColor: '#94a3b8' },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  dateText: { fontSize: 12, color: '#64748b' },

  // Doctor + notes
  doctorText: {
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 4,
  },
  doctorName: { fontWeight: '700' },
  notesText: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 18,
  },

  // Meds container
  medsContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  medsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  medItemRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  medBullet: {
    color: '#64748b',
    marginRight: 6,
    fontSize: 14,
  },
  medItem: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  medName: { fontWeight: '700', color: '#0f172a' },
  medFreq: { color: '#64748b' },
  noMedsText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },

  // Past prescriptions
  pastList: { gap: 10 },
  pastCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  pastLeft: { flex: 1, minWidth: 0 },
  pastDoctor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 2,
  },
  pastMedCount: { fontSize: 12, color: '#64748b' },
  pastRight: { alignItems: 'flex-end', gap: 4 },
  pastDate: { fontSize: 12, color: '#64748b' },

  // Empty
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 24,
    paddingVertical: 8,
  },
});