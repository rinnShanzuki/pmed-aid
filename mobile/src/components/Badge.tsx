import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import theme from '../styles/theme';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'active' | 'inactive' | 'pending' | 'discharged' | 'success' | 'warning' | 'error' | 'info';
  style?: TextStyle;
}

export default function Badge({ children, variant = 'active', style }: BadgeProps) {
  return (
    <Text style={[styles.badge, styles[variant], style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.full,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'capitalize',
    overflow: 'hidden',
  },
  active: {
    backgroundColor: theme.colors.successBg,
    color: theme.colors.successText,
  },
  inactive: {
    backgroundColor: theme.colors.errorBg,
    color: theme.colors.errorText,
  },
  pending: {
    backgroundColor: theme.colors.warningBg,
    color: theme.colors.warningText,
  },
  discharged: {
    backgroundColor: theme.colors.slate100,
    color: theme.colors.slate600,
  },
  success: {
    backgroundColor: theme.colors.successBg,
    color: theme.colors.successText,
  },
  warning: {
    backgroundColor: theme.colors.warningBg,
    color: theme.colors.warningText,
  },
  error: {
    backgroundColor: theme.colors.errorBg,
    color: theme.colors.errorText,
  },
  info: {
    backgroundColor: theme.colors.infoBg,
    color: theme.colors.infoText,
  },
});
