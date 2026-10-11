import React, { ReactNode } from 'react';
import {
  View,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsive } from '../hooks/useResponsive';
import { createResponsiveStyles } from '../utils/responsiveStyles';

interface ResponsiveContainerProps {
  children: ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
  avoidKeyboard?: boolean;
  backgroundColor?: string;
  horizontalPadding?: boolean;
  verticalPadding?: boolean;
  scrollViewProps?: ScrollViewProps;
  centerContent?: boolean;
}

/**
 * Responsive container component that adapts to screen size and orientation
 * Handles SafeArea, keyboard avoidance, and responsive spacing automatically
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  style,
  scrollable = false,
  avoidKeyboard = false,
  backgroundColor = '#f8fafc',
  horizontalPadding = true,
  verticalPadding = true,
  scrollViewProps,
  centerContent = false,
}) => {
  const responsive = useResponsive();
  const styles = createResponsiveStyles(responsive);

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor,
    paddingHorizontal: horizontalPadding
      ? responsive.horizontalPadding
      : undefined,
    paddingVertical: verticalPadding ? responsive.verticalPadding : undefined,
    ...style,
  };

  if (centerContent) {
    Object.assign(containerStyle, {
      justifyContent: 'center',
      alignItems: 'center',
    });
  }

  const content = <View style={containerStyle}>{children}</View>;

  if (scrollable) {
    const scrollContent = (
      <ScrollView
        {...scrollViewProps}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: horizontalPadding
            ? responsive.horizontalPadding
            : undefined,
          paddingVertical: verticalPadding
            ? responsive.verticalPadding
            : undefined,
        }}
        style={{ backgroundColor }}
      >
        {children}
      </ScrollView>
    );

    const withKeyboard = avoidKeyboard ? (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scrollContent}
      </KeyboardAvoidingView>
    ) : (
      scrollContent
    );

    return <SafeAreaView style={styles.container}>{withKeyboard}</SafeAreaView>;
  }

  if (avoidKeyboard) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {content}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return <SafeAreaView style={styles.container}>{content}</SafeAreaView>;
};

/**
 * Layout component for two-column layouts (portrait/landscape aware)
 */
interface ResponsiveGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  gap?: number;
  style?: ViewStyle;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = 2,
  gap,
  style,
}) => {
  const responsive = useResponsive();
  const styles = createResponsiveStyles(responsive);

  const gapValue =
    gap !== undefined ? gap : responsive.spacing.md;

  // For landscape, try to show more columns
  const effectiveColumns = responsive.isLandscape
    ? Math.min(columns + 1, 3)
    : columns;

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: gapValue,
    marginBottom: gapValue,
  };

  // Calculate item flex basis for responsive wrapping
  const itemPercentage = 100 / effectiveColumns;
  const itemWidth = `${itemPercentage}%`;

  return (
    <View style={[containerStyle, style]}>
      {React.Children.map(children, (child) => (
        <View
          style={{
            width: itemWidth,
            paddingRight: gapValue / 2,
            paddingBottom: gapValue / 2,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
};

/**
 * Component for layouts that should stack on phone but side-by-side on tablet/landscape
 */
interface ResponsiveTwoColumnProps {
  left: ReactNode;
  right: ReactNode;
  gap?: number;
  style?: ViewStyle;
}

export const ResponsiveTwoColumn: React.FC<ResponsiveTwoColumnProps> = ({
  left,
  right,
  gap,
  style,
}) => {
  const responsive = useResponsive();
  const gapValue =
    gap !== undefined ? gap : responsive.spacing.md;

  const containerStyle: ViewStyle = {
    flexDirection: responsive.isLandscape || responsive.isTablet ? 'row' : 'column',
    gap: gapValue,
  };

  return (
    <View style={[containerStyle, style]}>
      <View style={{ flex: 1 }}>{left}</View>
      <View style={{ flex: 1 }}>{right}</View>
    </View>
  );
};

/**
 * Component for handling spacing and layout in forms
 */
interface FormSectionProps {
  children: ReactNode;
  title?: string;
  gap?: number;
}

export const FormSection: React.FC<FormSectionProps> = ({
  children,
  title,
  gap,
}) => {
  const responsive = useResponsive();
  const styles = createResponsiveStyles(responsive);
  const gapValue = gap !== undefined ? gap : responsive.spacing.md;

  return (
    <View style={{ gap: gapValue, marginBottom: gapValue }}>
      {title && <View style={styles.heading3}>{title}</View>}
      {children}
    </View>
  );
};
