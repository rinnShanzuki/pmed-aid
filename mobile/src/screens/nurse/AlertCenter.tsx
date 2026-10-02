import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../services/api';

interface Alert {
  id: number;
  type: string;
  priority: 'high' | 'medium' | 'low';
  medication: string;
  scheduled_time: string;
  minutes_overdue: number;
  patient_name: string;
  room_number: string;
}

export default function AlertCenter() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/dashboard/alerts');
      setAlerts(data.data || []);
    } catch (err) {
      console.error('Fetch alerts error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return { bg: '#fef2f2', border: '#fecaca', text: '#ef4444', icon: 'alert-circle' };
      case 'medium':
        return { bg: '#fffbeb', border: '#fde68a', text: '#f59e0b', icon: 'alert' };
      default:
        return { bg: '#f0f9ff', border: '#e0f2fe', text: '#3b82f6', icon: 'information' };
    }
  };

  const formatScheduledTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading alerts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <MaterialCommunityIcons name="bell" size={24} color="#3b82f6" />
          <Text style={styles.headerTitle}>Alert Center</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{alerts.length} Active Alerts</Text>
        </View>
      </View>

      {/* Content */}
      {alerts.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <MaterialCommunityIcons name="check-circle" size={48} color="#10b981" />
          <Text style={styles.emptyTitle}>No Active Alerts</Text>
          <Text style={styles.emptySubtitle}>Everything is on schedule.</Text>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.alertsList}
          contentContainerStyle={styles.alertsListContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {alerts.map((alert, idx) => {
            const priorityStyle = getPriorityColor(alert.priority);
            return (
              <View
                key={idx}
                style={[
                  styles.alertCard,
                  {
                    backgroundColor: priorityStyle.bg,
                    borderColor: priorityStyle.border,
                  },
                ]}
              >
                {/* Icon */}
                <View style={[styles.alertIcon, { backgroundColor: `${priorityStyle.text}20` }]}>
                  <MaterialCommunityIcons
                    name={priorityStyle.icon}
                    size={24}
                    color={priorityStyle.text}
                  />
                </View>

                {/* Content */}
                <View style={styles.alertContent}>
                  {/* Header with title and overdue time */}
                  <View style={styles.alertHeader}>
                    <Text style={styles.alertTitle}>
                      {alert.type === 'overdue' ? 'Overdue Medication' : 'Alert'}
                    </Text>
                    <Text style={[styles.alertOverdue, { color: priorityStyle.text }]}>
                      {alert.minutes_overdue} mins overdue
                    </Text>
                  </View>

                  {/* Medication info */}
                  <Text style={styles.alertDescription}>
                    Scheduled dose of{' '}
                    <Text style={styles.alertMedication}>{alert.medication}</Text> was due at{' '}
                    <Text style={styles.alertTime}>
                      {formatScheduledTime(alert.scheduled_time)}
                    </Text>
                    .
                  </Text>

                  {/* Patient info */}
                  {alert.patient_name && (
                    <View style={styles.patientInfo}>
                      <Text style={styles.patientLabel}>Patient:</Text>
                      <Text style={styles.patientName}>
                        {alert.patient_name}
                        {alert.room_number && ` (Room ${alert.room_number})`}
                      </Text>
                    </View>
                  )}

                  {/* Action button */}
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: priorityStyle.text },
                    ]}
                    onPress={() => {
                      // Handle alert action (e.g., mark as addressed)
                      console.log('Alert action for:', alert.id);
                    }}
                  >
                    <Text style={styles.actionButtonText}>Mark as Addressed</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
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
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
  },
  alertsList: {
    flex: 1,
  },
  alertsListContent: {
    padding: 16,
    gap: 12,
  },
  alertCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 4,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  alertContent: {
    flex: 1,
    gap: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  alertOverdue: {
    fontSize: 12,
    fontWeight: '600',
  },
  alertDescription: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  alertMedication: {
    fontWeight: '700',
    color: '#0f172a',
  },
  alertTime: {
    fontWeight: '600',
    color: '#3b82f6',
  },
  patientInfo: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  patientLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  patientName: {
    fontSize: 12,
    color: '#64748b',
  },
  actionButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});
