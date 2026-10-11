/**
 * Global Theme - Exact match with Web CSS
 * This file replicates the design system from web frontend
 */

export const colors = {
  // Primary colors
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  primaryLight: '#60a5fa',
  
  // Emerald/Green (Doctor, Success)
  emerald: '#10b981',
  emeraldDark: '#059669',
  emeraldLight: '#34d399',
  
  // Purple (Pharmacy)
  purple: '#8b5cf6',
  purpleDark: '#7c3aed',
  purpleLight: '#a78bfa',
  
  // Slate/Gray scale
  slate900: '#0f172a',
  slate800: '#1e293b',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate300: '#cbd5e1',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
  slate50: '#f8fafc',
  
  // Status colors
  success: '#22c55e',
  successBg: '#dcfce7',
  successText: '#166534',
  
  warning: '#f59e0b',
  warningBg: '#fef3c7',
  warningText: '#92400e',
  
  error: '#ef4444',
  errorBg: '#fee2e2',
  errorText: '#991b1b',
  
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  dangerText: '#7f1d1d',
  
  info: '#0ea5e9',
  infoBg: '#e0f2fe',
  infoText: '#075985',
  
  // Neutral
  white: '#ffffff',
  black: '#000000',
  
  // Specific UI colors matching web
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  
  bgPrimary: '#ffffff',
  bgSecondary: '#f8fafc',
  bgTertiary: '#f1f5f9',
  
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  
  // Stat card backgrounds (from web)
  statBlue: '#eff6ff',
  statBlueIcon: '#3b82f6',
  
  statGreen: '#f0fdf4',
  statGreenIcon: '#22c55e',
  
  statEmerald: '#d1fae5',
  statEmeraldIcon: '#10b981',
  
  statPurple: '#fdf4ff',
  statPurpleIcon: '#a855f7',
  
  statViolet: '#ede9fe',
  statVioletIcon: '#8b5cf6',
  
  statOrange: '#fff7ed',
  statOrangeIcon: '#f97316',
  
  statYellow: '#fef9c3',
  statYellowIcon: '#eab308',
  
  statRed: '#fef2f2',
  statRedIcon: '#ef4444',
  
  statCyan: '#ecfeff',
  statCyanIcon: '#06b6d4',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
  '6xl': 48,
  '7xl': 56,
  '8xl': 64,
};

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 10,
  '2xl': 12,
  '3xl': 14,
  '4xl': 16,
  full: 9999,
};

export const fontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 15,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
  '6xl': 36,
  '7xl': 40,
};

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

export const shadows = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 10,
  },
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
};

export default theme;
