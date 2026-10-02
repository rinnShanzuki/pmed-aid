import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

// ─── Icon Components (text-based emojis) ─────────────────────────
const SearchIcon = ({ size = 16, color = '#64748b' }) => (
  <Text style={{ fontSize: size, color }}>🔍</Text>
);

const UserIcon = ({ size = 18, color = '#0284c7' }) => (
  <Text style={{ fontSize: size, color }}>👤</Text>
);

const BedDoubleIcon = ({ size = 16, color = '#64748b' }) => (
  <Text style={{ fontSize: size, color }}>🛏️</Text>
);

// ─── Types ──────────────────────────────────────────────────────
interface Admission {
  id: number;
  admission_date: string;
  status: string;
  patient?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  room?: {
    room_number: string;
    type: string;
  };
  doctor?: {
    last_name: string;
  };
}

// ─── Helper ─────────────────────────────────────────────────────
function formatDateTime(isoString: string) {
  try {
    const date = new Date(isoString);
    return date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return '—';
  }
}

function formatDate(isoString: string) {
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
export default function AssignedPatients() {
  const { user } = useAuth();
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) fetchAdmissions();
  }, [search, user]);

  async function fetchAdmissions() {
    try {
      setLoading(true);
      const { data } = await api.get('/admissions', {
        params: {
          status: 'admitted',
          search,
          assigned_nurse_id: user?.id,
        },
      });
      setAdmissions(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdmissions();
  };

  // ─── Render Patient Card ─────────────────────────────────────
  const renderPatient = ({ item }: { item: Admission }) => {
    const firstName = item.patient?.first_name || '';
    const lastName = item.patient?.last_name || '';
    const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();

    return (
      <View style={styles.patientCard}>
        {/* Patient Header */}
        <View style={styles.patientHeader}>
          <View style={styles.avatar}>
            {initials ? (
              <Text style={styles.avatarText}>{initials}</Text>
            ) : (
              <UserIcon size={20} color="#0284c7" />
            )}
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName} numberOfLines={1}>
              {firstName} {lastName}
            </Text>
            <Text style={styles.patientEmail} numberOfLines={1}>
              {item.patient?.email || '—'}
            </Text>
          </View>
        </View>

        {/* Details Row – Room & Doctor */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <View style={styles.detailLabelRow}>
              <BedDoubleIcon size={14} color="#64748b" />
              <Text style={styles.detailLabel}>Room</Text>
            </View>
            <Text style={styles.detailValue}>
              Room {item.room?.room_number || 'Unassigned'}
            </Text>
            {item.room?.type && (
              <Text style={styles.detailSub}>
                {item.room.type.replace('_', ' ')}
              </Text>
            )}
          </View>

          <View style={styles.detailItem}>
            <View style={styles.detailLabelRow}>
              <UserIcon size={14} color="#64748b" />
              <Text style={styles.detailLabel}>Doctor</Text>
            </View>
            <Text style={styles.detailValue} numberOfLines={1}>
              {item.doctor ? `Dr. ${item.doctor.last_name}` : 'Not assigned'}
            </Text>
          </View>
        </View>

        {/* Footer – Admission Date & Status */}
        <View style={styles.footer}>
          <Text style={styles.admissionDate}>
            Admitted: {formatDate(item.admission_date)}
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>
    );
  };

  // ─── Main Return ─────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by patient name or room..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>

        {/* Content */}
        {loading && !refreshing ? (
          <View style={styles.centeredState}>
            <ActivityIndicator size="small" color="#64748b" />
            <Text style={styles.loadingText}>Loading patients...</Text>
          </View>
        ) : admissions.length === 0 ? (
          <View style={styles.centeredState}>
            <Text style={styles.emptyText}>No admitted patients found.</Text>
          </View>
        ) : (
          <FlatList
            data={admissions}
            renderItem={renderPatient}
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

  // ─── Search Bar ─────────────────────────────────────────────
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
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

  // ─── List ───────────────────────────────────────────────────
  listContent: {
    paddingBottom: 24,
    gap: 12,
  },

  // ─── Patient Card ───────────────────────────────────────────
  patientCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eef2f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  // Header
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0284c7',
  },
  patientInfo: {
    flex: 1,
    minWidth: 0,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  patientEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },

  // Details Row
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  detailItem: {
    flex: 1,
    minWidth: 0,
  },
  detailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  detailSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    textTransform: 'capitalize',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eef2f6',
    paddingTop: 12,
  },
  admissionDate: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },

  // ─── States ─────────────────────────────────────────────────
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
});