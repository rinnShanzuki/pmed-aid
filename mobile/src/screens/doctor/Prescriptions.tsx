import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import ScreenTemplate from '../../components/ScreenTemplate';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface PrescriptionItem {
  id: number;
  medication_name: string;
  dosage: string;
  dosage_unit?: string;
  frequency: number | string;
  frequency_unit: string;
  duration: string;
  route: string;
  instructions?: string;
  start_time?: string;
  interval_hours?: number | null;
}

interface Prescription {
  id: number;
  created_at?: string;
  createdAt?: string;
  status: string;
  type: string;
  doctor_id?: number;
  patient_id?: number;
  patient?: { first_name: string; last_name: string };
  notes?: string;
  items?: PrescriptionItem[];
}

export default function Prescriptions() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // View modal
  const [viewData, setViewData] = useState<Prescription | null>(null);
  const [viewVisible, setViewVisible] = useState(false);

  // Adherence
  const [adherenceStats, setAdherenceStats] = useState<any>(null);

  // Edit item
  const [editItem, setEditItem] = useState<PrescriptionItem | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Table column widths for horizontal scroll
  const TABLE_WIDTH = 780;
  const COL_PATIENT = 180;
  const COL_TYPE = 130;
  const COL_ITEMS = 90;
  const COL_STATUS = 110;
  const COL_DATE = 120;
  const COL_ACTIONS = 150;

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  async function fetchPrescriptions() {
    try {
      setLoading(true);
      const { data } = await api.get('/prescriptions');
      const filtered =
        data.data?.filter(
          (rx: Prescription) => String(rx.doctor_id) === String(user?.id)
        ) || [];
      setPrescriptions(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function openView(id: number) {
    try {
      const { data } = await api.get(`/prescriptions/${id}`);
      setViewData(data.data);
      setViewVisible(true);

      if (data.data.type === 'in_hospital' && data.data.patient_id) {
        try {
          const adh = await api.get(
            `/analytics/adherence?patient_id=${data.data.patient_id}`
          );
          setAdherenceStats(adh.data.data);
        } catch (e) {
          console.error(e);
          setAdherenceStats(null);
        }
      } else {
        setAdherenceStats(null);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function closeView() {
    setViewVisible(false);
    setTimeout(() => {
      setViewData(null);
      setAdherenceStats(null);
    }, 200);
  }

  async function handleUpdateItem() {
    if (!editItem) return;
    setIsUpdating(true);
    try {
      await api.put(`/prescriptions/items/${editItem.id}`, editItem);
      const { data } = await api.get(`/prescriptions/${viewData!.id}`);
      setViewData(data.data);
      setEditVisible(false);
      setEditItem(null);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update item.');
    } finally {
      setIsUpdating(false);
    }
  }

  const filtered = prescriptions.filter((rx) => {
    if (!search) return true;
    const name = `${rx.patient?.first_name} ${rx.patient?.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  // ============================================================
  // VIEW MODAL
  // ============================================================
  function renderViewModal() {
    if (!viewData) return null;

    return (
      <Modal
        visible={viewVisible}
        animationType="slide"
        onRequestClose={closeView}
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Back */}
            <TouchableOpacity onPress={closeView} style={styles.backButton}>
              <Text style={styles.backText}>← Back to Prescriptions</Text>
            </TouchableOpacity>

            {/* Header card */}
            <View style={styles.viewHeaderCard}>
              <View style={styles.viewIconCircle}>
                <Text style={styles.viewIconText}>📄</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.viewTitle}>Prescription #{viewData.id}</Text>
                <Text style={styles.viewSubtitle} numberOfLines={2}>
                  Patient:{' '}
                  <Text style={styles.viewSubtitleBold}>
                    {viewData.patient?.first_name} {viewData.patient?.last_name}
                  </Text>
                </Text>
                <Text style={styles.viewSubtitle}>
                  Date:{' '}
                  {new Date(
                    viewData.created_at || viewData.createdAt || ''
                  ).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {/* Info grid */}
            <View style={styles.infoGrid}>
              <View style={[styles.infoCard, isTablet && styles.infoCardHalf]}>
                <Text style={styles.infoLabel}>Type</Text>
                <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>
                  {viewData.type?.replace('_', ' ')}
                </Text>
              </View>
              <View style={[styles.infoCard, isTablet && styles.infoCardHalf]}>
                <Text style={styles.infoLabel}>Status</Text>
                <View style={{ marginTop: 4 }}>
                  <View
                    style={[
                      styles.badge,
                      viewData.status === 'active' && styles.badgeActive,
                      viewData.status === 'completed' && styles.badgeCompleted,
                    ]}
                  >
                    <Text style={styles.badgeText}>{viewData.status}</Text>
                  </View>
                </View>
              </View>
              {viewData.notes ? (
                <View style={[styles.infoCard, styles.infoCardFull]}>
                  <Text style={styles.infoLabel}>Notes / Clinical Impression</Text>
                  <Text style={styles.infoValue}>{viewData.notes}</Text>
                </View>
              ) : null}
            </View>

            {/* Adherence tracker */}
            {adherenceStats ? (
              <View style={styles.adherenceCard}>
                <Text style={styles.adherenceTitle}>📈 Adherence Tracker</Text>
                <View style={styles.adherenceGrid}>
                  <View style={styles.adherenceItem}>
                    <Text style={styles.adherenceLabel}>Compliance</Text>
                    <Text style={styles.adherenceValue}>
                      {adherenceStats.adherence_rate}%
                    </Text>
                  </View>
                  <View style={styles.adherenceItem}>
                    <Text style={styles.adherenceLabel}>Completed</Text>
                    <Text style={styles.adherenceValue}>
                      {adherenceStats.completed} /{' '}
                      {adherenceStats.total_doses - adherenceStats.pending}
                    </Text>
                  </View>
                  <View style={styles.adherenceItem}>
                    <Text style={styles.adherenceLabel}>Missed / Skipped</Text>
                    <Text style={[styles.adherenceValue, { color: '#dc2626' }]}>
                      {adherenceStats.missed} / {adherenceStats.skipped}
                    </Text>
                  </View>
                  <View style={styles.adherenceItem}>
                    <Text style={styles.adherenceLabel}>Pending</Text>
                    <Text style={[styles.adherenceValue, { color: '#ca8a04' }]}>
                      {adherenceStats.pending}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            {/* Medication items */}
            <View style={styles.itemsSection}>
              <Text style={styles.sectionTitle}>💊 Medication Items</Text>
              {!viewData.items?.length ? (
                <Text style={styles.emptyText}>No medication items.</Text>
              ) : (
                viewData.items.map((it, i) => (
                  <View key={it.id || i} style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemHeaderName} numberOfLines={2}>
                        {it.medication_name}
                      </Text>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => {
                          setEditItem(it);
                          setEditVisible(true);
                        }}
                      >
                        <Text style={styles.editBtnText}>✏ Edit</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.itemBody}>
                      <View style={styles.itemRow}>
                        <Text style={styles.itemRowLabel}>Dosage</Text>
                        <Text style={styles.itemRowValue}>{it.dosage}</Text>
                      </View>
                      <View style={styles.itemRow}>
                        <Text style={styles.itemRowLabel}>Frequency</Text>
                        <Text style={styles.itemRowValue}>
                          {it.frequency}x / {it.frequency_unit}
                        </Text>
                      </View>
                      <View style={styles.itemRow}>
                        <Text style={styles.itemRowLabel}>Schedule</Text>
                        <Text style={styles.itemRowValue}>
                          {it.start_time ? it.start_time.slice(0, 5) : 'Auto'}
                          {it.interval_hours ? ` (q${it.interval_hours}h)` : ''}
                        </Text>
                      </View>
                      <View style={styles.itemRow}>
                        <Text style={styles.itemRowLabel}>Duration</Text>
                        <Text style={styles.itemRowValue}>{it.duration}</Text>
                      </View>
                      <View style={styles.itemRow}>
                        <Text style={styles.itemRowLabel}>Route</Text>
                        <Text style={styles.itemRowValue}>{it.route}</Text>
                      </View>
                      {it.instructions ? (
                        <View style={[styles.itemRow, styles.itemRowFull]}>
                          <Text style={styles.itemRowLabel}>Instructions</Text>
                          <Text
                            style={[styles.itemRowValue, { fontStyle: 'italic' }]}
                          >
                            {it.instructions}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Edit Item Modal */}
        {renderEditModal()}
      </Modal>
    );
  }

  // ============================================================
  // EDIT ITEM MODAL
  // ============================================================
  function renderEditModal() {
    if (!editItem) return null;

    return (
      <Modal
        visible={editVisible}
        animationType="fade"
        transparent
        onRequestClose={() => {
          setEditVisible(false);
          setEditItem(null);
        }}
      >
        <KeyboardAvoidingView
          style={styles.dialogOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.dialogBox}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.dialogTitle}>Edit Medication Item</Text>

              <Text style={styles.label}>Medication Name</Text>
              <TextInput
                style={styles.input}
                value={editItem.medication_name}
                onChangeText={(v) =>
                  setEditItem({ ...editItem, medication_name: v })
                }
              />

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Dosage</Text>
                  <TextInput
                    style={styles.input}
                    value={editItem.dosage}
                    onChangeText={(v) =>
                      setEditItem({ ...editItem, dosage: v })
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Route</Text>
                  <TextInput
                    style={styles.input}
                    value={editItem.route}
                    onChangeText={(v) =>
                      setEditItem({ ...editItem, route: v })
                    }
                  />
                </View>
              </View>

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Frequency</Text>
                  <TextInput
                    style={styles.input}
                    value={String(editItem.frequency)}
                    onChangeText={(v) =>
                      setEditItem({ ...editItem, frequency: v })
                    }
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Frequency Unit</Text>
                  <TextInput
                    style={styles.input}
                    value={editItem.frequency_unit}
                    onChangeText={(v) =>
                      setEditItem({ ...editItem, frequency_unit: v })
                    }
                    placeholder="daily / weekly / monthly"
                  />
                </View>
              </View>

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Interval Hours</Text>
                  <TextInput
                    style={styles.input}
                    value={
                      editItem.interval_hours != null
                        ? String(editItem.interval_hours)
                        : ''
                    }
                    onChangeText={(v) =>
                      setEditItem({
                        ...editItem,
                        interval_hours: v ? parseInt(v) : null,
                      })
                    }
                    keyboardType="numeric"
                    placeholder="optional"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Duration</Text>
                  <TextInput
                    style={styles.input}
                    value={editItem.duration}
                    onChangeText={(v) =>
                      setEditItem({ ...editItem, duration: v })
                    }
                  />
                </View>
              </View>

              <Text style={styles.label}>Instructions</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editItem.instructions || ''}
                onChangeText={(v) =>
                  setEditItem({ ...editItem, instructions: v })
                }
                multiline
              />

              <View style={styles.dialogActions}>
                <TouchableOpacity
                  style={[styles.dialogBtn, styles.dialogCancelBtn]}
                  onPress={() => {
                    setEditVisible(false);
                    setEditItem(null);
                  }}
                  disabled={isUpdating}
                >
                  <Text style={styles.dialogCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dialogBtn, styles.dialogSaveBtn]}
                  onPress={handleUpdateItem}
                  disabled={isUpdating}
                >
                  <Text style={styles.dialogSaveText}>
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  // ============================================================
  // MAIN LIST VIEW
  // ============================================================
  return (
    <ScreenTemplate title="Prescriptions">
      <View style={styles.container}>
        {/* Header + Search */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>📄 Prescription Management</Text>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search patient..."
          value={search}
          onChangeText={setSearch}
        />

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#3b82f6"
            style={{ marginTop: 40 }}
          />
        ) : filtered.length === 0 ? (
          <Text style={styles.emptyText}>No prescriptions found.</Text>
        ) : (
          <ScrollView
            style={styles.tableWrapper}
            horizontal
            showsHorizontalScrollIndicator
          >
            <View style={{ width: TABLE_WIDTH }}>
              {/* Header row */}
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: COL_PATIENT }]}>Patient</Text>
                <Text style={[styles.th, { width: COL_TYPE }]}>Type</Text>
                <Text style={[styles.th, { width: COL_ITEMS }]}>Items</Text>
                <Text style={[styles.th, { width: COL_STATUS }]}>Status</Text>
                <Text style={[styles.th, { width: COL_DATE }]}>Date</Text>
                <Text style={[styles.th, { width: COL_ACTIONS }]}>Actions</Text>
              </View>

              {/* Rows */}
              {filtered.map((rx, idx) => (
                <View
                  key={rx.id}
                  style={[
                    styles.tableRow,
                    idx % 2 === 0 && styles.tableRowEven,
                  ]}
                >
                  <Text
                    style={[styles.td, styles.tdName, { width: COL_PATIENT }]}
                    numberOfLines={1}
                  >
                    {rx.patient?.first_name} {rx.patient?.last_name}
                  </Text>
                  <View style={{ width: COL_TYPE }}>
                    <View
                      style={[
                        styles.badge,
                        rx.type === 'discharge'
                          ? styles.badgeDischarged
                          : styles.badgeActive,
                      ]}
                    >
                      <Text style={styles.badgeText}>
                        {rx.type?.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.td, { width: COL_ITEMS }]}>
                    {rx.items?.length || 0} items
                  </Text>
                  <View style={{ width: COL_STATUS }}>
                    <View
                      style={[
                        styles.badge,
                        rx.status === 'active' && styles.badgeActive,
                        rx.status === 'completed' && styles.badgeCompleted,
                      ]}
                    >
                      <Text style={styles.badgeText}>{rx.status}</Text>
                    </View>
                  </View>
                  <Text
                    style={[styles.td, styles.tdMuted, { width: COL_DATE }]}
                  >
                    {new Date(
                      rx.created_at || rx.createdAt || ''
                    ).toLocaleDateString()}
                  </Text>
                  <View style={{ width: COL_ACTIONS }}>
                    <TouchableOpacity
                      style={styles.viewBtn}
                      onPress={() => openView(rx.id)}
                    >
                      <Text style={styles.viewBtnText}>👁 View</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {!isTablet && filtered.length > 0 ? (
          <Text style={styles.scrollHint}>← Swipe to see more →</Text>
        ) : null}
      </View>

      {renderViewModal()}
    </ScreenTemplate>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header / search
  headerRow: { marginBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  searchInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 14,
  },

  // Table
  tableWrapper: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#fff',
    maxHeight: 560,
  },
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
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  tableRowEven: { backgroundColor: '#fafbfc' },
  td: { fontSize: 13, color: '#1e293b' },
  tdName: { fontWeight: '600' },
  tdMuted: { fontSize: 12, color: '#64748b' },

  // Badges
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#94a3b8',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'capitalize',
  },
  badgeActive: { backgroundColor: '#3b82f6' },
  badgeCompleted: { backgroundColor: '#10b981' },
  badgeDischarged: { backgroundColor: '#a855f7' },

  // Buttons
  viewBtn: {
    backgroundColor: '#1d64c1',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 40,
    fontSize: 14,
  },
  scrollHint: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 8,
    fontStyle: 'italic',
  },

  // Modal
  modalRoot: { flex: 1, backgroundColor: '#f8fafc' },
  modalScroll: { flex: 1 },
  modalScrollContent: { padding: 16, paddingBottom: 60 },
  backButton: { marginBottom: 16 },
  backText: { color: '#64748b', fontSize: 14, fontWeight: '600' },

  // View header
  viewHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    gap: 12,
  },
  viewIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewIconText: { fontSize: 26 },
  viewTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  viewSubtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  viewSubtitleBold: { color: '#0f172a', fontWeight: '700' },

  // Info grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
  },
  infoCardHalf: { width: '48%' },
  infoCardFull: { width: '100%' },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: { fontSize: 14, color: '#1e293b', fontWeight: '500' },

  // Adherence
  adherenceCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  adherenceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 12,
  },
  adherenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  adherenceItem: { width: '48%' },
  adherenceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 4,
  },
  adherenceValue: { fontSize: 20, fontWeight: '800', color: '#15803d' },

  // Items
  itemsSection: { marginTop: 8 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  itemHeaderName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    flex: 1,
  },
  editBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
  },
  editBtnText: { color: '#3b82f6', fontSize: 12, fontWeight: '700' },
  itemBody: { padding: 12, gap: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  itemRowFull: { flexDirection: 'column', gap: 2 },
  itemRowLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    width: 90,
  },
  itemRowValue: { fontSize: 13, color: '#1e293b', flex: 1 },

  // Edit modal
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  dialogBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '90%',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    fontSize: 14,
    color: '#0f172a',
  },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  twoCol: { flexDirection: 'row', gap: 12 },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  dialogBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogCancelBtn: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dialogSaveBtn: { backgroundColor: '#3b82f6' },
  dialogCancelText: { color: '#475569', fontWeight: '700', fontSize: 14 },
  dialogSaveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});