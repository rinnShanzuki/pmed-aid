import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import theme from '../styles/theme';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export default function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        styles[`size_${size}`],
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? theme.colors.slate600 : theme.colors.white}
        />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, styles[`${variant}Text`], styles[`size_${size}Text`], textStyle]}>
            {children}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  text: {
    fontWeight: theme.fontWeight.medium,
  },
  
  // Variants
  primary: {
    backgroundColor: theme.colors.primary,
  },
  primaryText: {
    color: theme.colors.white,
  },
  
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  outlineText: {
    color: theme.colors.slate600,
  },
  
  danger: {
    backgroundColor: theme.colors.error,
  },
  dangerText: {
    color: theme.colors.white,
  },
  
  success: {
    backgroundColor: theme.colors.emerald,
  },
  successText: {
    color: theme.colors.white,
  },
  
  // Sizes
  size_sm: {
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  size_smText: {
    fontSize: theme.fontSize.sm,
  },
  
  size_md: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  size_mdText: {
    fontSize: theme.fontSize.base,
  },
  
  size_lg: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  size_lgText: {
    fontSize: theme.fontSize.md,
  },
  
  disabled: {
    opacity: 0.5,
  },
});
