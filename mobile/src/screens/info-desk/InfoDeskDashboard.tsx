import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { StatCard, Card } from '../../components';
import theme from '../../styles/theme';

const { width } = Dimensions.get('window');

export default function InfoDeskDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    newAdmissions: 0,
    activePatients: 0,
    recentPrescriptions: 0,
    pendingRegistrations: 0,
    dischargedPatients: 0,
    admissionTrend: [],
    adherenceTrend: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const dashboardRes = await api.get('/info-desk/dashboard');
      setStats(dashboardRes.data.data || {});
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'New Admissions Today',
      value: stats.newAdmissions || 0,
      sub: 'Patients admitted today',
      iconBg: theme.colors.statBlue,
      iconColor: theme.colors.statBlueIcon,
      icon: '🛏️',
    },
    {
      label: 'Total Active Patients',
      value: stats.activePatients || 0,
      sub: 'Currently in rooms',
      iconBg: theme.colors.statPurple,
      iconColor: theme.colors.statPurpleIcon,
      icon: '👥',
    },
    {
      label: 'Recent Prescriptions',
      value: stats.recentPrescriptions || 0,
      sub: 'Encoded in the last 7 days',
      iconBg: theme.colors.statGreen,
      iconColor: theme.colors.statGreenIcon,
      icon: '📋',
    },
    {
      label: 'Pending Registrations',
      value: stats.pendingRegistrations || 0,
      sub: 'Require profile completion',
      iconBg: theme.colors.statOrange,
      iconColor: theme.colors.statOrangeIcon,
      icon: '🕐',
    },
  ];

  const admissionTrendData =
    stats.admissionTrend && stats.admissionTrend.length > 0
      ? stats.admissionTrend
      : [
          { day: 'Mon', admissions: 0 },
          { day: 'Tue', admissions: 0 },
          { day: 'Wed', admissions: 0 },
          { day: 'Thu', admissions: 0 },
          { day: 'Fri', admissions: 0 },
        ];

  const patientStatusData = [
    { name: 'Admitted', value: stats.activePatients || 0, color: theme.colors.statBlueIcon },
    { name: 'Discharged', value: stats.dischargedPatients || 0, color: theme.colors.statGreenIcon },
    {
      name: 'Pending Registration',
      value: stats.pendingRegistrations || 0,
      color: theme.colors.statOrangeIcon,
    },
  ];

  const maxAdmissions = Math.max(...admissionTrendData.map((d: any) => d.admissions), 1);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Overview</Text>
          <Text style={styles.subtitle}>Welcome to the Information Desk Portal.</Text>
        </View>

        {/* Stats Grid - 4 Cards */}
        <View style={styles.statsGrid}>
          {statCards.map((card, index) => (
            <View key={index} style={styles.statCardWrapper}>
              <Card style={styles.statCardContainer}>
                <View style={styles.statCardContent}>
                  <View style={[styles.statIconContainer, { backgroundColor: card.iconBg }]}>
                    <Text style={[styles.statIconText, { color: card.iconColor }]}>{card.icon}</Text>
                  </View>
                  <View style={styles.statTextContainer}>
                    <Text style={styles.statLabel}>{card.label}</Text>
                    <Text style={styles.statValue}>{card.value}</Text>
                  </View>
                </View>
                <Text style={styles.statSub}>{card.sub}</Text>
              </Card>
            </View>
          ))}
        </View>

        {/* Medication Adherence Trend (Simplified) */}
        <Card>
          <Text style={styles.chartTitle}>Medication Adherence Trend</Text>
          <Text style={styles.chartSubtitle}>
            7-day movement of medication adherence — given on time vs. overdue / missed doses.
          </Text>
          {stats.adherenceTrend && stats.adherenceTrend.length > 0 ? (
            <View style={styles.chartPlaceholder}>
              {stats.adherenceTrend.slice(0, 7).map((item: any, index: number) => (
                <View key={index} style={styles.adherenceItem}>
                  <Text style={styles.adherenceDate}>{item.date}</Text>
                  <View style={styles.adherenceBars}>
                    <View style={styles.adherenceBarRow}>
                      <View
                        style={[
                          styles.adherenceBar,
                          { width: `${item.givenPct}%`, backgroundColor: theme.colors.success },
                        ]}
                      />
                      <Text style={styles.adherencePct}>{item.givenPct}%</Text>
                    </View>
                    <View style={styles.adherenceBarRow}>
                      <View
                        style={[
                          styles.adherenceBar,
                          { width: `${item.overduePct}%`, backgroundColor: theme.colors.error },
                        ]}
                      />
                      <Text style={styles.adherencePct}>{item.overduePct}%</Text>
                    </View>
                  </View>
                </View>
              ))}
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.colors.success }]} />
                  <Text style={styles.legendText}>Given / Administered</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.colors.error }]} />
                  <Text style={styles.legendText}>Overdue / Missed</Text>
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>No adherence data available.</Text>
          )}
        </Card>

        {/* Two Column Layout for Charts */}
        <View style={styles.twoColumnGrid}>
          {/* Admission Trend */}
          <Card style={styles.chartCard}>
            <Text style={styles.chartTitle}>Admission Trend</Text>
            <Text style={styles.chartSubtitle}>Track patient admissions over the week.</Text>
            <View style={styles.barChartContainer}>
              {admissionTrendData.map((item: any, index: number) => (
                <View key={index} style={styles.barChartItem}>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: maxAdmissions > 0 ? (item.admissions / maxAdmissions) * 200 : 0,
                          backgroundColor: theme.colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{item.day}</Text>
                  <Text style={styles.barValue}>{item.admissions}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Patient Status Distribution */}
          <Card style={styles.chartCard}>
            <Text style={styles.chartTitle}>Patient Status Distribution</Text>
            <Text style={styles.chartSubtitle}>Quick overview of patient current states.</Text>
            <View style={styles.pieChartContainer}>
              {patientStatusData.map((item, index) => (
                <View key={index} style={styles.pieItem}>
                  <View style={[styles.pieDot, { backgroundColor: item.color }]} />
                  <View style={styles.pieTextContainer}>
                    <Text style={styles.pieName}>{item.name}</Text>
                    <Text style={styles.pieValue}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgSecondary,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing['4xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.bgSecondary,
  },
  header: {
    marginBottom: theme.spacing['2xl'],
  },
  greeting: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing['2xl'],
    marginBottom: theme.spacing['4xl'],
  },
  statCardWrapper: {
    flex: 1,
    minWidth: width > 768 ? 240 : '100%',
  },
  statCardContainer: {
    marginBottom: 0,
  },
  statCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconText: {
    fontSize: 24,
  },
  statTextContainer: {
    flex: 1,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 40,
    fontWeight: theme.fontWeight.extrabold,
    color: theme.colors.textPrimary,
    lineHeight: 40,
  },
  statSub: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textTertiary,
  },
  chartTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  chartSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing['2xl'],
  },
  chartPlaceholder: {
    gap: theme.spacing.md,
  },
  adherenceItem: {
    gap: theme.spacing.sm,
  },
  adherenceDate: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  adherenceBars: {
    gap: theme.spacing.xs,
  },
  adherenceBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  adherenceBar: {
    height: 20,
    borderRadius: theme.borderRadius.md,
    minWidth: 2,
  },
  adherencePct: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    minWidth: 40,
  },
  legendContainer: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: theme.borderRadius.full,
  },
  legendText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  emptyText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  twoColumnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing['2xl'],
  },
  chartCard: {
    flex: 1,
    minWidth: width > 768 ? 450 : '100%',
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 240,
    paddingTop: theme.spacing.lg,
  },
  barChartItem: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  barContainer: {
    height: 200,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 40,
    borderTopLeftRadius: theme.borderRadius.md,
    borderTopRightRadius: theme.borderRadius.md,
    minHeight: 4,
  },
  barLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  barValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  pieChartContainer: {
    gap: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  pieItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.bgTertiary,
    borderRadius: theme.borderRadius.lg,
  },
  pieDot: {
    width: 16,
    height: 16,
    borderRadius: theme.borderRadius.full,
  },
  pieTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pieName: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.medium,
  },
  pieValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
});
