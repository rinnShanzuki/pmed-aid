import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

interface Admission {
  admissionId: string;
  patientName: string;
  roomNumber: string;
  attendingPhysician: string;
  assignedNurse: string;
  admissionDate: string;
  statusBadge: string;
  nextMedDue: string | null;
  nextMedName: string | null;
}

interface Schedule {
  scheduleId: string;
  patientName: string;
  roomNumber: string;
  medicationName: string;
  scheduledTime: string;
  assignedNurse: string;
  status: string;
  minutesOverdue?: number;
}

interface DashboardData {
  summary: {
    totalConfined: number;
    givenOnTime: { count: number; pct: number };
    overdueMissed: { count: number; pct: number };
    pendingUpcoming: number;
    inProgress: number;
  };
  wardOverview: Admission[];
  pendingSchedule: Schedule[];
  overdueList: Schedule[];
}

const { width: screenWidth } = Dimensions.get('window');
const COL_WIDTH = 120;

export default function PatientMonitoring() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<'admitted' | 'outpatient'>('admitted');
  const [overdueTab, setOverdueTab] = useState<'admitted' | 'outpatient'>('admitted');
  const [wardSearch, setWardSearch] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');
  const [overdueSearch, setOverdueSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/info-desk/medication-dashboard');
      setData(response.data.data);
    } catch (err: any) {
      console.error('Patient monitoring fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Failed to load data</Text>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return '#dc2626';
      case 'in_progress': return '#3b82f6';
      case 'on_track': return '#10b981';
      default: return '#94a3b8';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'overdue': return 'Overdue';
      case 'in_progress': return 'In Progress';
      case 'on_track': return 'On Track';
      default: return 'No Meds Due';
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredWard = data.wardOverview.filter(row => {
    const search = wardSearch.toLowerCase();
    return !search || 
      row.patientName.toLowerCase().includes(search) ||
      row.roomNumber.toLowerCase().includes(search) ||
      row.attendingPhysician.toLowerCase().includes(search) ||
      row.assignedNurse.toLowerCase().includes(search);
  });

  const filteredPending = data.pendingSchedule.filter(row => {
    const search = pendingSearch.toLowerCase();
    const matchesTab = activeTab === 'admitted' ? row.roomNumber !== 'N/A' : row.roomNumber === 'N/A';
    return matchesTab && (!search ||
      row.patientName.toLowerCase().includes(search) ||
      row.roomNumber.toLowerCase().includes(search) ||
      row.medicationName.toLowerCase().includes(search) ||
      row.assignedNurse.toLowerCase().includes(search));
  });

  const filteredOverdue = data.overdueList.filter(row => {
    const search = overdueSearch.toLowerCase();
    const matchesTab = overdueTab === 'admitted' ? row.roomNumber !== 'N/A' : row.roomNumber === 'N/A';
    return matchesTab && (!search ||
      row.patientName.toLowerCase().includes(search) ||
      row.roomNumber.toLowerCase().includes(search) ||
      row.medicationName.toLowerCase().includes(search) ||
      row.assignedNurse.toLowerCase().includes(search));
  });

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchData}>
            <Text style={styles.refreshText}>⟲ Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* 5 Metric Cards - Responsive Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#dbeafe' }]}>
              <Text style={styles.metricIconText}>🛏️</Text>
            </View>
            <Text style={styles.metricLabel}>Total Confined</Text>
            <Text style={styles.metricValue}>{data.summary.totalConfined}</Text>
            <Text style={styles.metricSub}>Currently admitted</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#d1fae5' }]}>
              <Text style={styles.metricIconText}>✓</Text>
            </View>
            <Text style={styles.metricLabel}>Given On Time</Text>
            <Text style={styles.metricValue}>{data.summary.givenOnTime.count}</Text>
            <Text style={styles.metricSub}>{data.summary.givenOnTime.pct}%</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#fee2e2' }]}>
              <Text style={styles.metricIconText}>⚠️</Text>
            </View>
            <Text style={styles.metricLabel}>Overdue</Text>
            <Text style={styles.metricValue}>{data.summary.overdueMissed.count}</Text>
            <Text style={styles.metricSub}>{data.summary.overdueMissed.pct}%</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#fef3c7' }]}>
              <Text style={styles.metricIconText}>🕐</Text>
            </View>
            <Text style={styles.metricLabel}>Pending</Text>
            <Text style={styles.metricValue}>{data.summary.pendingUpcoming}</Text>
            <Text style={styles.metricSub}>Next hour</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#dbeafe' }]}>
              <Text style={styles.metricIconText}>📊</Text>
            </View>
            <Text style={styles.metricLabel}>In Progress</Text>
            <Text style={styles.metricValue}>{data.summary.inProgress}</Text>
            <Text style={styles.metricSub}>Being administered</Text>
          </View>
        </View>

        {/* TABLE 1: ROOM / WARD OVERVIEW (7 columns with horizontal scroll) */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>🏥 Room / Ward Overview</Text>
          <Text style={styles.sectionSubtitle}>Swipe right to see all columns →</Text>
          
          <TextInput
            placeholder="Search…"
            value={wardSearch}
            onChangeText={setWardSearch}
            style={styles.searchInput}
            placeholderTextColor="#94a3b8"
          />

          <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} style={styles.horizontalScroll}>
            <View style={styles.tableWrapper}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: COL_WIDTH }]}>PATIENT</Text>
                <Text style={[styles.th, { width: COL_WIDTH }]}>ROOM</Text>
                <Text style={[styles.th, { width: COL_WIDTH }]}>PHYSICIAN</Text>
                <Text style={[styles.th, { width: COL_WIDTH }]}>NURSE</Text>
                <Text style={[styles.th, { width: COL_WIDTH }]}>ADMIT</Text>
                <Text style={[styles.th, { width: COL_WIDTH }]}>STATUS</Text>
                <Text style={[styles.th, { width: COL_WIDTH }]}>NEXT MED</Text>
              </View>

              {filteredWard.length === 0 ? (
                <Text style={styles.emptyState}>No patients found</Text>
              ) : (
                filteredWard.map((row, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.td, { width: COL_WIDTH }]} numberOfLines={2}>{row.patientName}</Text>
                    <Text style={[styles.td, { width: COL_WIDTH }]}>{row.roomNumber}</Text>
                    <Text style={[styles.td, { width: COL_WIDTH }]} numberOfLines={2}>{row.attendingPhysician}</Text>
                    <Text style={[styles.td, { width: COL_WIDTH }]} numberOfLines={1}>{row.assignedNurse}</Text>
                    <Text style={[styles.td, { width: COL_WIDTH }]}>{formatDate(row.admissionDate)}</Text>
                    <View style={[styles.td, { width: COL_WIDTH, justifyContent: 'center' }]}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(row.statusBadge) + '30' }]}>
                        <Text style={[styles.badgeText, { color: getStatusColor(row.statusBadge) }]} numberOfLines={1}>
                          {getStatusLabel(row.statusBadge)}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.td, { width: COL_WIDTH }]}>{row.nextMedDue ? formatTime(row.nextMedDue) : '—'}</Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>

        {/* TABLE 2: PENDING / UPCOMING SCHEDULE (7 columns with horizontal scroll) */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>🕐 Pending / Upcoming</Text>
          <Text style={styles.sectionSubtitle}>Swipe right to see all columns →</Text>
          
          <TextInput
            placeholder="Search…"
            value={pendingSearch}
            onChangeText={setPendingSearch}
            style={styles.searchInput}
            placeholderTextColor="#94a3b8"
          />

          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'admitted' && styles.tabActive]}
              onPress={() => setActiveTab('admitted')}
            >
              <Text style={[styles.tabText, activeTab === 'admitted' && styles.tabTextActive]}>Admitted</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'outpatient' && styles.tabActive]}
              onPress={() => setActiveTab('outpatient')}
            >
              <Text style={[styles.tabText, activeTab === 'outpatient' && styles.tabTextActive]}>Outpatient</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} style={styles.horizontalScroll}>
            <View style={styles.tableWrapper}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: COL_WIDTH }]}>PATIENT</Text>
                <Text style={[styles.th, { width: COL_WIDTH }]}>ROOM</Text>
                <Text style={[styles.th, { width: COL_WIDTH }]}>MEDICATION</Text>
                <Text style={[styles.th, { width: COL_WIDTH }]}>SCHEDULED</Text>
                <Text style={[styles.th, { width: COL_WIDTH }]}>NURSE</Text>
                <Text style={[styles.th, { width: COL_WIDTH }]}>TIME LEFT</Text>
                <Text style={[styles.th, { width: COL_WIDTH }]}>STATUS</Text>
              </View>

              {filteredPending.length === 0 ? (
                <Text style={styles.emptyState}>No pending medications</Text>
              ) : (
                filteredPending.map((row, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.td, { width: COL_WIDTH }]} numberOfLines={2}>{row.patientName}</Text>
                    <Text style={[styles.td, { width: COL_WIDTH }]}>{row.roomNumber}</Text>
                    <Text style={[styles.td, { width: COL_WIDTH }]} numberOfLines={2}>{row.medicationName}</Text>
                    <Text style={[styles.td, { width: COL_WIDTH }]}>{formatTime(row.scheduledTime)}</Text>
                    <Text style={[styles.td, { width: COL_WIDTH }]} numberOfLines={1}>{row.assignedNurse}</Text>
                    <Text style={[styles.td, { width: COL_WIDTH, color: '#d97706' }]}>—</Text>
                    <View style={[styles.td, { width: COL_WIDTH, justifyContent: 'center' }]}>
                      <View style={[styles.statusBadge, { backgroundColor: '#fef3c7' }]}>
                        <Text style={[styles.badgeText, { color: '#d97706' }]} numberOfLines={1}>
                          {row.status === 'due_now' ? 'Due Now' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>

        {/* TABLE 3: OVERDUE / MISSED MEDICATIONS (7 columns with horizontal scroll) */}
        <View style={[styles.sectionContainer, { borderTopWidth: 3, borderTopColor: '#dc2626' }]}>
          <Text style={[styles.sectionTitle, { color: '#dc2626' }]}>⚠️ Overdue / Missed</Text>
          <Text style={styles.sectionSubtitle}>Swipe right to see all columns →</Text>
          
          <TextInput
            placeholder="Search…"
            value={overdueSearch}
            onChangeText={setOverdueSearch}
            style={styles.searchInput}
            placeholderTextColor="#94a3b8"
          />

          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, overdueTab === 'admitted' && styles.tabActive]}
              onPress={() => setOverdueTab('admitted')}
            >
              <Text style={[styles.tabText, overdueTab === 'admitted' && styles.tabTextActive]}>Admitted</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, overdueTab === 'outpatient' && styles.tabActive]}
              onPress={() => setOverdueTab('outpatient')}
            >
              <Text style={[styles.tabText, overdueTab === 'outpatient' && styles.tabTextActive]}>Outpatient</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} style={styles.horizontalScroll}>
            <View style={styles.tableWrapper}>
              <View style={[styles.tableHeader, { backgroundColor: '#fee2e2' }]}>
                <Text style={[styles.th, { width: COL_WIDTH, color: '#991b1b' }]}>PATIENT</Text>
                <Text style={[styles.th, { width: COL_WIDTH, color: '#991b1b' }]}>ROOM</Text>
                <Text style={[styles.th, { width: COL_WIDTH, color: '#991b1b' }]}>MEDICATION</Text>
                <Text style={[styles.th, { width: COL_WIDTH, color: '#991b1b' }]}>SCHEDULED</Text>
                <Text style={[styles.th, { width: COL_WIDTH, color: '#991b1b' }]}>OVERDUE</Text>
                <Text style={[styles.th, { width: COL_WIDTH, color: '#991b1b' }]}>NURSE</Text>
                <Text style={[styles.th, { width: COL_WIDTH, color: '#991b1b' }]}>ACTION</Text>
              </View>

              {filteredOverdue.length === 0 ? (
                <Text style={styles.emptyState}>No overdue medications</Text>
              ) : (
                filteredOverdue.map((row, idx) => (
                  <View key={idx} style={[styles.tableRow, { backgroundColor: '#fef2f2' }]}>
                    <Text style={[styles.td, { width: COL_WIDTH, color: '#991b1b', fontWeight: '600' }]} numberOfLines={2}>{row.patientName}</Text>
                    <Text style={[styles.td, { width: COL_WIDTH }]}>{row.roomNumber}</Text>
                    <Text style={[styles.td, { width: COL_WIDTH }]} numberOfLines={2}>{row.medicationName}</Text>
                    <Text style={[styles.td, { width: COL_WIDTH, color: '#dc2626', fontWeight: '600' }]}>{formatTime(row.scheduledTime)}</Text>
                    <Text style={[styles.td, { width: COL_WIDTH, color: '#dc2626', fontWeight: '600' }]}>{row.minutesOverdue}m</Text>
                    <Text style={[styles.td, { width: COL_WIDTH }]} numberOfLines={1}>{row.assignedNurse}</Text>
                    <TouchableOpacity style={[styles.td, { width: COL_WIDTH, justifyContent: 'center' }]}>
                      <View style={styles.actionBtn}>
                        <Text style={styles.actionBtnText}>✓</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>

        {/* Status Legend */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Status Legend:</Text>
          <View style={styles.legendGrid}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.legendText}>In Progress</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.legendText}>Completed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#dc2626' }]} />
              <Text style={styles.legendText}>Missed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#94a3b8' }]} />
              <Text style={styles.legendText}>Not Yet Due</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 14,
  },
  refreshButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
  },
  refreshText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricIconText: {
    fontSize: 16,
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 2,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  metricSub: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    marginBottom: 8,
    color: '#0f172a',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  horizontalScroll: {
    marginHorizontal: -10,
    paddingHorizontal: 10,
  },
  tableWrapper: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  th: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  td: {
    fontSize: 10,
    color: '#1e293b',
    paddingHorizontal: 6,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '700',
  },
  actionBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 12,
  },
  legendContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  legendTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '48%',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 9,
    color: '#475569',
    flex: 1,
  },
});
