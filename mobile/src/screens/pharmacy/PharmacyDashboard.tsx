import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

const { width: SCREEN_W } = Dimensions.get('window');
const isTablet = SCREEN_W >= 768;

// ─── Types ───────────────────────────────────────────────────────────────────
interface Medication {
  id: number;
  name: string;
  generic_name?: string;
  category?: string;
  stock: number;
  unit_price: number;
  status?: string;
}

interface PickupItem {
  id: number;
  medication_name: string;
  dosage: string;
  frequency: number;
  frequency_unit: string;
  duration: string;
  route: string;
  status?: string;
}

interface Pickup {
  id: number;
  type: string;
  patient?: { first_name: string; last_name: string };
  doctor?: { first_name: string; last_name: string };
  items?: PickupItem[];
  created_at: string;
}

interface Summary {
  totalItems: number;
  totalStock: number;
  outOfStock: number;
  lowStock: number;
}

interface DispenseModal {
  itemId: number;
  medicationName: string;
  dosage: string;
  patientName: string;
}

type FilterKey = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, sub, iconBg,
}: {
  icon: string; label: string; value: number | string; sub: string; iconBg: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: iconBg }]}>
        <Text style={styles.statIcon}>{icon}</Text>
      </View>
      <View style={styles.statCardText}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statSub}>{sub}</Text>
      </View>
    </View>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ stock }: { stock: number }) {
  const outOfStock = stock === 0;
  const lowStock = stock > 0 && stock <= 10;
  return (
    <View
      style={[
        styles.statusBadge,
        outOfStock && styles.statusBadgeOut,
        lowStock && styles.statusBadgeLow,
        !outOfStock && !lowStock && styles.statusBadgeIn,
      ]}
    >
      <Text
        style={[
          styles.statusBadgeText,
          outOfStock && styles.statusBadgeTextOut,
          lowStock && styles.statusBadgeTextLow,
          !outOfStock && !lowStock && styles.statusBadgeTextIn,
        ]}
      >
        {outOfStock ? 'Out of Stock' : lowStock ? 'Low Stock' : 'In Stock'}
      </Text>
    </View>
  );
}

// ─── Category Pill ────────────────────────────────────────────────────────────
function CategoryPill({ label }: { label?: string }) {
  if (!label) return <Text style={styles.cellMuted}>—</Text>;
  return (
    <View style={styles.categoryPill}>
      <Text style={styles.categoryPillText} numberOfLines={1}>{label}</Text>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PharmacyDashboard() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'inventory' | 'pickups'>('inventory');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Inventory
  const [inventory, setInventory] = useState<Medication[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalItems: 0, totalStock: 0, outOfStock: 0, lowStock: 0 });
  const [invSearch, setInvSearch] = useState('');
  const [invFilter, setInvFilter] = useState<FilterKey>('all');
  const [showDropdown, setShowDropdown] = useState(false);

  // Pickups
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [pickupSearch, setPickupSearch] = useState('');

  // Modals
  const [dispenseModal, setDispenseModal] = useState<DispenseModal | null>(null);
  const [dispenseForm, setDispenseForm] = useState({ medication_id: '', quantity: '1' });
  const [restockModal, setRestockModal] = useState<Medication | null>(null);
  const [restockQty, setRestockQty] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchInventory = useCallback(async () => {
    try {
      const res = await api.get('/pharmacy/inventory');
      setInventory(res.data.data?.medications || []);
      setSummary(res.data.data?.summary || { totalItems: 0, totalStock: 0, outOfStock: 0, lowStock: 0 });
    } catch (e) {
      console.error('Inventory fetch error:', e);
    }
  }, []);

  const fetchPickups = useCallback(async () => {
    try {
      const res = await api.get('/pharmacy/pending-pickups');
      setPickups(res.data.data || []);
    } catch (e) {
      console.error('Pickups fetch error:', e);
      setPickups([]);
    }
  }, []);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    await Promise.all([fetchInventory(), fetchPickups()]);
    setLoading(false);
    setRefreshing(false);
  }, [fetchInventory, fetchPickups]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  async function handleDispense() {
    if (!dispenseModal) return;
    setActionLoading(true);
    try {
      await api.post('/pharmacy/dispense', {
        prescription_item_id: dispenseModal.itemId,
        medication_id: parseInt(dispenseForm.medication_id),
        quantity: parseInt(dispenseForm.quantity),
      });
      setDispenseModal(null);
      setDispenseForm({ medication_id: '', quantity: '1' });
      await fetchAll(true);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to dispense medication.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRestock() {
    if (!restockModal) return;
    setActionLoading(true);
    try {
      await api.post(`/pharmacy/restock/${restockModal.id}`, { quantity: parseInt(restockQty) });
      setRestockModal(null);
      setRestockQty('');
      await fetchAll(true);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to restock medication.');
    } finally {
      setActionLoading(false);
    }
  }

  // ─── Filtered data ────────────────────────────────────────────────────────
  const filteredInventory = inventory.filter((m) => {
    const q = invSearch.toLowerCase();
    const matchSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      (m.generic_name || '').toLowerCase().includes(q) ||
      (m.category || '').toLowerCase().includes(q);
    const matchFilter =
      invFilter === 'all' ||
      (invFilter === 'in_stock' && m.stock > 10) ||
      (invFilter === 'low_stock' && m.stock > 0 && m.stock <= 10) ||
      (invFilter === 'out_of_stock' && (m.stock === 0 || m.status === 'out_of_stock'));
    return matchSearch && matchFilter;
  });

  const filteredPickups = pickups.filter((p) => {
    if (!pickupSearch) return true;
    const q = pickupSearch.toLowerCase();
    const patient = `${p.patient?.first_name} ${p.patient?.last_name}`.toLowerCase();
    const doctor = `${p.doctor?.first_name} ${p.doctor?.last_name}`.toLowerCase();
    const items = (p.items || []).map((i) => i.medication_name.toLowerCase()).join(' ');
    return patient.includes(q) || doctor.includes(q) || items.includes(q);
  });

  const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All Stock Levels' },
    { key: 'in_stock', label: 'In Stock' },
    { key: 'low_stock', label: 'Low Stock (≤ 10)' },
    { key: 'out_of_stock', label: 'Out of Stock' },
  ];

  const activeFilterLabel = FILTER_OPTIONS.find((f) => f.key === invFilter)?.label ?? 'All Stock Levels';

  // ─── Loading screen ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Loading pharmacy data…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} colors={['#7c3aed']} tintColor="#7c3aed" />
        }
      >
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderLeft}>
            <Text style={styles.pageTitle}>Pharmacy Inventory</Text>
            <Text style={styles.pageSubtitle}>Monitor stock levels and dispense medications to patients.</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchAll(true)} activeOpacity={0.8}>
            <Text style={styles.refreshBtnText}>↻  Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* ── Stat Cards ──────────────────────────────────────────────────── */}
        <View style={styles.statsColumn}>
          <StatCard icon="📦" label="Total Items"   value={summary.totalItems}                  sub="Unique medications in inventory"    iconBg="#dbeafe" />
          <StatCard icon="📊" label="Total Stock"   value={summary.totalStock.toLocaleString()} sub="Combined units across all items"    iconBg="#ede9fe" />
          <StatCard icon="📉" label="Low Stock"     value={summary.lowStock}                    sub="Items with ≤ 10 units remaining"   iconBg="#fef3c7" />
          <StatCard icon="⚠️" label="Out of Stock" value={summary.outOfStock}                  sub="Items needing immediate restock"   iconBg="#fee2e2" />
        </View>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'inventory' && styles.tabItemActive]}
            onPress={() => setActiveTab('inventory')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabLabel, activeTab === 'inventory' && styles.tabLabelActive]}>
              🗂  Inventory Management
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'pickups' && styles.tabItemActive]}
            onPress={() => setActiveTab('pickups')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabLabel, activeTab === 'pickups' && styles.tabLabelActive]}>
              🛒  Pending Pickups{pickups.length > 0 ? ` ${pickups.length}` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ═══════════════════ INVENTORY TAB ═══════════════════════════════ */}
        {activeTab === 'inventory' && (
          <View style={styles.tabContent}>

            {/* Search + Dropdown row */}
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search medications..."
                  placeholderTextColor="#94a3b8"
                  value={invSearch}
                  onChangeText={setInvSearch}
                />
                {invSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setInvSearch('')}>
                    <Text style={styles.clearBtn}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Dropdown */}
              <View style={styles.dropdownWrap}>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => setShowDropdown((v) => !v)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownBtnText} numberOfLines={1}>{activeFilterLabel}</Text>
                  <Text style={styles.dropdownArrow}>{showDropdown ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {showDropdown && (
                  <View style={styles.dropdownMenu}>
                    {FILTER_OPTIONS.map((f, i) => (
                      <TouchableOpacity
                        key={f.key}
                        style={[
                          styles.dropdownOption,
                          i === 0 && styles.dropdownOptionFirst,
                          i === FILTER_OPTIONS.length - 1 && styles.dropdownOptionLast,
                          invFilter === f.key && styles.dropdownOptionActive,
                        ]}
                        onPress={() => { setInvFilter(f.key); setShowDropdown(false); }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.dropdownOptionText, invFilter === f.key && styles.dropdownOptionTextActive]}>
                          {f.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Table */}
            {filteredInventory.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyText}>No medications match your search.</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ paddingBottom: 8 }}>
                <View style={styles.table}>
                  {/* Header row */}
                  <View style={[styles.tableRow, styles.tableHeaderRow]}>
                    <Text style={[styles.th, { width: 160 }]}>MEDICATION NAME ↕</Text>
                    <Text style={[styles.th, { width: 150 }]}>GENERIC NAME</Text>
                    <Text style={[styles.th, { width: 130 }]}>CATEGORY</Text>
                    <Text style={[styles.th, { width: 80 }]}>STOCK ↕</Text>
                    <Text style={[styles.th, { width: 100 }]}>UNIT PRICE</Text>
                    <Text style={[styles.th, { width: 120 }]}>STATUS</Text>
                    <Text style={[styles.th, { width: 100 }]}>ACTIONS</Text>
                  </View>

                  {/* Data rows */}
                  {filteredInventory.map((med, idx) => (
                    <View key={med.id} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                      {/* Medication Name */}
                      <View style={{ width: 160, paddingRight: 8 }}>
                        <Text style={styles.tdBold} numberOfLines={2}>{med.name}</Text>
                      </View>

                      {/* Generic Name */}
                      <View style={{ width: 150, paddingRight: 8 }}>
                        <Text style={styles.td} numberOfLines={2}>{med.generic_name || '—'}</Text>
                      </View>

                      {/* Category */}
                      <View style={{ width: 130, paddingRight: 8, justifyContent: 'center' }}>
                        <CategoryPill label={med.category} />
                      </View>

                      {/* Stock */}
                      <View style={{ width: 80, paddingRight: 8 }}>
                        <Text
                          style={[
                            styles.tdBold,
                            med.stock === 0 ? styles.stockOut :
                            med.stock <= 10 ? styles.stockLow :
                            styles.stockOk,
                          ]}
                        >
                          {med.stock.toLocaleString()}
                        </Text>
                      </View>

                      {/* Unit Price */}
                      <View style={{ width: 100, paddingRight: 8 }}>
                        <Text style={styles.td}>
                          ₱{parseFloat(String(med.unit_price ?? 0)).toFixed(2)}
                        </Text>
                      </View>

                      {/* Status */}
                      <View style={{ width: 120, paddingRight: 8, justifyContent: 'center' }}>
                        <StatusBadge stock={med.stock} />
                      </View>

                      {/* Actions */}
                      <View style={{ width: 100, justifyContent: 'center' }}>
                        <TouchableOpacity
                          style={styles.restockBtn}
                          onPress={() => { setRestockModal(med); setRestockQty(''); }}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.restockBtnText}>Restock</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        )}

        {/* ═══════════════════ PICKUPS TAB ════════════════════════════════ */}
        {activeTab === 'pickups' && (
          <View style={styles.tabContent}>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search patient, doctor, medication..."
                placeholderTextColor="#94a3b8"
                value={pickupSearch}
                onChangeText={setPickupSearch}
              />
            </View>

            {filteredPickups.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyIcon}>✅</Text>
                <Text style={styles.emptyText}>No pending prescriptions</Text>
              </View>
            ) : (
              <View style={styles.pickupList}>
                {filteredPickups.map((rx) => (
                  <View
                    key={rx.id}
                    style={[
                      styles.pickupCard,
                      { borderLeftColor: rx.type === 'discharge' ? '#f59e0b' : '#7c3aed' },
                    ]}
                  >
                    <View style={styles.pickupCardHeader}>
                      <View style={styles.pickupCardLeft}>
                        <Text style={styles.pickupPatient} numberOfLines={1}>
                          👤 {rx.patient?.first_name} {rx.patient?.last_name}
                        </Text>
                        <View style={[styles.typeBadge, rx.type === 'discharge' ? styles.typeBadgeDischarge : styles.typeBadgeOut]}>
                          <Text style={[styles.typeBadgeText, rx.type === 'discharge' ? styles.typeBadgeTextD : styles.typeBadgeTextO]}>
                            {rx.type}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.rxId}>Rx #{rx.id}</Text>
                    </View>

                    <Text style={styles.pickupDoctor} numberOfLines={1}>
                      Dr. {rx.doctor?.first_name} {rx.doctor?.last_name}
                      {'  ·  '}
                      {new Date(rx.created_at).toLocaleDateString()}
                    </Text>

                    {(rx.items || []).map((item) => (
                      <View key={item.id} style={styles.pickupItem}>
                        <View style={styles.pickupItemInfo}>
                          <Text style={styles.pickupItemName} numberOfLines={1}>{item.medication_name}</Text>
                          <Text style={styles.pickupItemSub}>
                            {item.dosage} · {item.frequency}× {item.frequency_unit} · {item.duration}
                          </Text>
                          <Text style={styles.pickupItemRoute}>Route: {item.route}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.dispenseBtn}
                          onPress={() => {
                            setDispenseModal({
                              itemId: item.id,
                              medicationName: item.medication_name,
                              dosage: item.dosage,
                              patientName: `${rx.patient?.first_name} ${rx.patient?.last_name}`,
                            });
                            setDispenseForm({ medication_id: '', quantity: '1' });
                          }}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.dispenseBtnText}>Dispense</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ═══ DISPENSE MODAL ══════════════════════════════════════════════════ */}
      <Modal visible={!!dispenseModal} transparent animationType="fade" onRequestClose={() => setDispenseModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Dispense Medication</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setDispenseModal(null)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            {dispenseModal && (
              <View style={styles.modalBody}>
                <View style={styles.modalInfoBox}>
                  <Text style={styles.modalInfoRow}>Patient: <Text style={styles.modalInfoVal}>{dispenseModal.patientName}</Text></Text>
                  <Text style={styles.modalInfoRow}>Medication: <Text style={styles.modalInfoVal}>{dispenseModal.medicationName}</Text></Text>
                  <Text style={styles.modalInfoRow}>Dosage: <Text style={styles.modalInfoVal}>{dispenseModal.dosage}</Text></Text>
                </View>
                <Text style={styles.inputLabel}>Medication ID *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter medication ID"
                  placeholderTextColor="#94a3b8"
                  value={dispenseForm.medication_id}
                  onChangeText={(t) => setDispenseForm({ ...dispenseForm, medication_id: t })}
                  keyboardType="numeric"
                />
                <Text style={styles.inputLabel}>Quantity *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter quantity"
                  placeholderTextColor="#94a3b8"
                  value={dispenseForm.quantity}
                  onChangeText={(t) => setDispenseForm({ ...dispenseForm, quantity: t })}
                  keyboardType="numeric"
                />
                <View style={styles.modalFooter}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setDispenseModal(null)} activeOpacity={0.8}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmBtn, actionLoading && styles.confirmBtnDisabled]}
                    onPress={handleDispense}
                    disabled={actionLoading}
                    activeOpacity={0.8}
                  >
                    {actionLoading
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.confirmBtnText}>Confirm Dispense</Text>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ═══ RESTOCK MODAL ═══════════════════════════════════════════════════ */}
      <Modal visible={!!restockModal} transparent animationType="fade" onRequestClose={() => setRestockModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Restock Medication</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setRestockModal(null)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            {restockModal && (
              <View style={styles.modalBody}>
                <View style={styles.modalInfoBox}>
                  <Text style={styles.modalInfoRow}>Medication: <Text style={styles.modalInfoVal}>{restockModal.name}</Text></Text>
                  <Text style={styles.modalInfoRow}>Current Stock: <Text style={styles.modalInfoVal}>{restockModal.stock}</Text></Text>
                </View>
                <Text style={styles.inputLabel}>Quantity to Add *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter quantity"
                  placeholderTextColor="#94a3b8"
                  value={restockQty}
                  onChangeText={setRestockQty}
                  keyboardType="numeric"
                />
                <View style={styles.modalFooter}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setRestockModal(null)} activeOpacity={0.8}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmBtn, actionLoading && styles.confirmBtnDisabled]}
                    onPress={handleRestock}
                    disabled={actionLoading}
                    activeOpacity={0.8}
                  >
                    {actionLoading
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.confirmBtnText}>Confirm Restock</Text>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 16 },

  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#64748b', fontWeight: '500' },

  // ── Page header ──────────────────────────────────────────────────────────
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  pageHeaderLeft: { flex: 1 },
  pageTitle: { fontSize: isTablet ? 24 : 20, fontWeight: '700', color: '#0f172a' },
  pageSubtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    gap: 6,
  },
  refreshBtnText: { fontSize: 13, color: '#475569', fontWeight: '600' },

  // ── Stat cards ────────────────────────────────────────────────────────────
  statsColumn: { gap: 10 },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  statIcon: { fontSize: 22 },
  statCardText: { flex: 1, gap: 2 },
  statLabel: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  statValue: { fontSize: 26, fontWeight: '700', color: '#0f172a', lineHeight: 32 },
  statSub: { fontSize: 12, color: '#94a3b8' },

  // ── Tab bar ───────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#7c3aed',
    backgroundColor: '#faf5ff',
  },
  tabLabel: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabLabelActive: { color: '#7c3aed' },

  // ── Tab content wrapper ───────────────────────────────────────────────────
  tabContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    gap: 12,
  },

  // ── Search + dropdown row ─────────────────────────────────────────────────
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    gap: 8,
  },
  searchIcon: { fontSize: 14, color: '#94a3b8' },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#0f172a' },
  clearBtn: { fontSize: 13, color: '#94a3b8', padding: 4 },

  // Dropdown
  dropdownWrap: { position: 'relative', zIndex: 99 },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    minWidth: isTablet ? 180 : 140,
  },
  dropdownBtnText: { flex: 1, fontSize: 13, color: '#374151', fontWeight: '500' },
  dropdownArrow: { fontSize: 10, color: '#6b7280' },
  dropdownMenu: {
    position: 'absolute',
    top: 44,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownOptionFirst: {},
  dropdownOptionLast: { borderBottomWidth: 0 },
  dropdownOptionActive: { backgroundColor: '#faf5ff' },
  dropdownOptionText: { fontSize: 13, color: '#374151' },
  dropdownOptionTextActive: { color: '#7c3aed', fontWeight: '600' },

  // ── Table ─────────────────────────────────────────────────────────────────
  table: { borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  tableHeaderRow: {
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableRowAlt: { backgroundColor: '#fafafa' },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    paddingRight: 8,
  },
  td: { fontSize: 13, color: '#374151' },
  tdBold: { fontSize: 13, fontWeight: '600', color: '#111827' },
  cellMuted: { fontSize: 13, color: '#94a3b8' },

  stockOk: { color: '#16a34a' },
  stockLow: { color: '#d97706' },
  stockOut: { color: '#dc2626' },

  // Status badge
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  statusBadgeIn: { backgroundColor: '#dcfce7' },
  statusBadgeLow: { backgroundColor: '#fef9c3' },
  statusBadgeOut: { backgroundColor: '#fee2e2' },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },
  statusBadgeTextIn: { color: '#16a34a' },
  statusBadgeTextLow: { color: '#d97706' },
  statusBadgeTextOut: { color: '#dc2626' },

  // Category pill
  categoryPill: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  categoryPillText: { fontSize: 11, color: '#475569', fontWeight: '500' },

  // Restock button
  restockBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#7c3aed', backgroundColor: '#faf5ff' },
  restockBtnText: { fontSize: 12, color: '#7c3aed', fontWeight: '600' },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyWrap: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 14, color: '#64748b', fontWeight: '500' },

  // ── Pickups ───────────────────────────────────────────────────────────────
  pickupList: { gap: 12 },
  pickupCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    backgroundColor: '#fff',
    padding: 14,
    gap: 8,
  },
  pickupCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickupCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  pickupPatient: { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1 },
  rxId: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  typeBadgeOut: { backgroundColor: '#ede9fe' },
  typeBadgeDischarge: { backgroundColor: '#fef3c7' },
  typeBadgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  typeBadgeTextO: { color: '#6d28d9' },
  typeBadgeTextD: { color: '#92400e' },
  pickupDoctor: { fontSize: 12, color: '#64748b' },
  pickupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    gap: 10,
  },
  pickupItemInfo: { flex: 1, gap: 2 },
  pickupItemName: { fontSize: 13, fontWeight: '600', color: '#111827' },
  pickupItemSub: { fontSize: 12, color: '#64748b' },
  pickupItemRoute: { fontSize: 11, color: '#94a3b8' },
  dispenseBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#7c3aed' },
  dispenseBtnText: { fontSize: 12, color: '#fff', fontWeight: '600' },

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, overflow: 'hidden' },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  modalClose: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  modalCloseText: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  modalBody: { padding: 18, gap: 12 },
  modalInfoBox: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 12, gap: 6 },
  modalInfoRow: { fontSize: 13, color: '#374151' },
  modalInfoVal: { fontWeight: '600', color: '#111827' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  modalFooter: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 11, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center' },
  cancelBtnText: { fontSize: 14, color: '#374151', fontWeight: '600' },
  confirmBtn: { flex: 2, paddingVertical: 11, borderRadius: 8, backgroundColor: '#7c3aed', alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: '#a78bfa' },
  confirmBtnText: { fontSize: 14, color: '#fff', fontWeight: '600' },
});
