import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

// ─── Icon Components (text-based emojis) ─────────────────────────
const PillIcon = ({ size = 20, color = '#3b82f6' }) => (
  <Text style={{ fontSize: size, color }}>💊</Text>
);

const SearchIcon = ({ size = 18, color = '#64748b' }) => (
  <Text style={{ fontSize: size, color }}>🔍</Text>
);

const ClockIcon = ({ size = 14, color = '#64748b' }) => (
  <Text style={{ fontSize: size, color }}>🕐</Text>
);

const QrCodeIcon = ({ size = 16, color = '#ffffff' }) => (
  <Text style={{ fontSize: size, color }}>📱</Text>
);

const CheckCircleIcon = ({ size = 18, color = '#ffffff' }) => (
  <Text style={{ fontSize: size, color }}>✓</Text>
);

// ─── Types ──────────────────────────────────────────────────────
interface Schedule {
  id: number;
  scheduled_time: string;
  status: string;
  administered_at?: string;
  patient_id: number;
  patient?: {
    first_name: string;
    last_name: string;
  };
  prescriptionItem?: {
    medication_name: string;
    dosage: string;
    dosage_unit: string;
    route: string;
  };
  administeredBy?: {
    first_name: string;
    last_name: string;
  };
}

type FilterType = 'pending' | 'completed' | 'missed';

// ─── Helper ─────────────────────────────────────────────────────
function formatTime(isoString: string) {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '—';
  }
}

function formatDate(isoString: string) {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch (e) {
    return '—';
  }
}

function formatFullDate(isoString: string) {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    return '—';
  }
}

// ─── Main Component ─────────────────────────────────────────────
export default function MedAdministration() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('pending');
  const [search, setSearch] = useState('');

  // Scan modal state
  const [scanModal, setScanModal] = useState<Schedule | null>(null);
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState('');

  useEffect(() => {
    fetchSchedules();
  }, [filter]);

  async function fetchSchedules() {
    try {
      setLoading(true);
      const { data } = await api.get('/schedules', {
        params: { status: filter },
      });
      setSchedules(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedules();
  };

  // ─── Administer via QR (simulated) ──────────────────────────
  async function handleSimulateScan() {
    if (!scanModal) return;
    try {
      setScanError('');
      setScanSuccess('');

      const res = await api.get(`/qr-codes/test-get/${scanModal.patient_id}`);
      if (!res.data.code) {
        setScanError('No QR code found for this patient.');
        return;
      }

      const decodedText = res.data.code;
      const { data } = await api.post('/qr-codes/verify', { code: decodedText });

      if (!data.data.is_active || data.data.type !== 'in_hospital') {
        setScanError('Invalid or inactive wristband QR.');
        return;
      }
      if (data.data.patient_id !== scanModal.patient_id) {
        setScanError('Mismatch! This wristband belongs to a different patient.');
        return;
      }

      setScanSuccess('Patient verified! Administering dose...');
      await api.post(`/schedules/${scanModal.id}/administer`, {
        notes: 'Administered via QR confirmation (Simulated)',
      });

      setTimeout(() => {
        setScanModal(null);
        fetchSchedules();
      }, 1500);
    } catch (err) {
      setScanError('Failed to verify QR code.');
    }
  }

  // ─── Filtered list ──────────────────────────────────────────
  const filtered = schedules.filter((s) => {
    if (!search) return true;
    const name = `${s.patient?.first_name} ${s.patient?.last_name}`.toLowerCase();
    const med = s.prescriptionItem?.medication_name?.toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || (med && med.includes(q));
  });

  // ─── Render schedule card ──────────────────────────────────
  const renderSchedule = ({ item }: { item: Schedule }) => {
    const schedDate = new Date(item.scheduled_time);

    return (
      <View style={styles.scheduleCard}>
        {/* Time Section */}
        <View style={styles.timeSection}>
          <View style={styles.timeIconRow}>
            <ClockIcon size={14} color="#64748b" />
            <Text style={styles.timeText}>{formatTime(item.scheduled_time)}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(item.scheduled_time)}</Text>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.patientName} numberOfLines={1}>
            {item.patient?.first_name} {item.patient?.last_name}
          </Text>
          <Text style={styles.medName} numberOfLines={1}>
            {item.prescriptionItem?.medication_name}
          </Text>
          <Text style={styles.dosage} numberOfLines={1}>
            {item.prescriptionItem?.dosage} {item.prescriptionItem?.dosage_unit} —{' '}
            {item.prescriptionItem?.route?.replace('_', ' ')}
          </Text>

          {filter === 'completed' && item.administeredBy && (
            <Text style={styles.adminBy}>
              By: {item.administeredBy.first_name} {item.administeredBy.last_name}
              {item.administered_at && ` · ${formatTime(item.administered_at)}`}
            </Text>
          )}
        </View>

        {/* Action Section */}
        <View style={styles.actionSection}>
          {filter === 'pending' ? (
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => {
                setScanError('');
                setScanSuccess('');
                setScanModal(item);
              }}
              activeOpacity={0.8}
            >
              <QrCodeIcon size={14} color="#ffffff" />
              <Text style={styles.scanButtonText}>Scan ID</Text>
            </TouchableOpacity>
          ) : (
            <View
              style={[
                styles.statusBadge,
                item.status === 'completed'
                  ? styles.completedBadge
                  : styles.missedBadge,
              ]}
            >
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // ─── Main Return ─────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <View style={styles.container}>
        {/* Header with Pill Icon */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <PillIcon size={22} color="#3b82f6" />
            <Text style={styles.headerTitle}>Medication Administration</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patient or med..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {(['pending', 'completed', 'missed'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterButton, filter === f && styles.filterActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f && styles.filterTextActive,
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {loading && !refreshing ? (
          <View style={styles.centeredState}>
            <ActivityIndicator size="small" color="#64748b" />
            <Text style={styles.loadingText}>Loading schedules...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.centeredState}>
            <Text style={styles.emptyText}>No {filter} medications found.</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            renderItem={renderSchedule}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#3b82f6"
              />
            }
          />
        )}
      </View>

      {/* ─── QR Scan Modal ──────────────────────────────────── */}
      <Modal
        visible={!!scanModal}
        transparent
        animationType="fade"
        onRequestClose={() => setScanModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Scan Patient Wristband</Text>
              <Text style={styles.modalSubtitle}>
                Verify identity for:{' '}
                <Text style={styles.modalSubtitleBold}>
                  {scanModal?.patient?.first_name} {scanModal?.patient?.last_name}
                </Text>
              </Text>
            </View>

            {/* Modal Body */}
            <View style={styles.modalBody}>
              {scanError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{scanError}</Text>
                </View>
              ) : null}

              {scanSuccess ? (
                <View style={styles.successBox}>
                  <Text style={styles.successText}>{scanSuccess}</Text>
                </View>
              ) : null}

              {/* QR Reader Placeholder – in real app use react-native-qrcode-scanner */}
              <View style={styles.qrPlaceholder}>
                <QrCodeIcon size={64} color="#94a3b8" />
                <Text style={styles.qrPlaceholderText}>
                  Camera preview would appear here
                </Text>
                <Text style={styles.qrPlaceholderSubtext}>
                  Use simulated scan below for testing
                </Text>
              </View>

              <TouchableOpacity
                style={styles.simulateButton}
                onPress={handleSimulateScan}
                activeOpacity={0.8}
              >
                <Text style={styles.simulateButtonText}>Simulate QR Scan (Test)</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setScanModal(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },

  // Header
  header: {
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.3,
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    padding: 0,
    margin: 0,
  },

  // Filter Row
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  filterActive: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
  },
  filterText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },

  // List
  listContent: {
    paddingBottom: 24,
    gap: 12,
  },

  // Schedule Card
  scheduleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eef2f6',
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  // Time Section
  timeSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#eef2f6',
    minWidth: 80,
  },
  timeIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  dateText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },

  // Info Section
  infoSection: {
    flex: 1,
    minWidth: 0,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  medName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 2,
  },
  dosage: {
    fontSize: 12,
    color: '#64748b',
  },
  adminBy: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },

  // Action Section
  actionSection: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    minWidth: 80,
  },
  scanButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: '#10b981',
  },
  missedBadge: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  // States
  centeredState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },

  // ─── Modal ──────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 480,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 10,
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  modalSubtitleBold: {
    fontWeight: '700',
    color: '#0f172a',
  },
  modalBody: {
    padding: 20,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  successBox: {
    backgroundColor: '#dcfce7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  qrPlaceholder: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  qrPlaceholderText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  qrPlaceholderSubtext: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  simulateButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  simulateButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  cancelButtonText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
});