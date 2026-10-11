import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import theme from '../styles/theme';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  style?: ViewStyle;
}

export default function StatCard({ label, value, icon, iconBg, iconColor, style }: StatCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconContainer, { backgroundColor: iconBg || theme.colors.statBlue }]}>
        {icon && <View style={{ color: iconColor || theme.colors.statBlueIcon }}>{icon}</View>}
      </View>
      <View style={styles.content}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius['3xl'],
    padding: theme.spacing['2xl'],
    flex: 1,
    minWidth: 220,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
  },
  value: {
    fontSize: 26,
    fontWeight: theme.fontWeight.extrabold,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  label: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
});
