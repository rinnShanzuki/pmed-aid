import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { ResponsiveLayout } from '../hooks/useResponsive';

/**
 * Dynamic stylesheet creator that adapts to screen dimensions
 */
export const createResponsiveStyles = (responsive: ResponsiveLayout) => {
  const {
    width,
    height,
    isLandscape,
    isPortrait,
    isPhone,
    isTablet,
    horizontalPadding,
    verticalPadding,
    spacing,
    fontSize,
  } = responsive;

  return StyleSheet.create({
    // === Layout Containers ===
    container: {
      flex: 1,
      backgroundColor: '#f8fafc',
    } as ViewStyle,

    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: horizontalPadding,
      paddingVertical: verticalPadding,
    } as ViewStyle,

    content: {
      flex: 1,
      paddingHorizontal: horizontalPadding,
      paddingVertical: verticalPadding,
    } as ViewStyle,

    centerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: horizontalPadding,
    } as ViewStyle,

    // === Two-Column Layout (Landscape/Tablet) ===
    twoColumnContainer: {
      flexDirection: 'column',
      gap: spacing.md,
    } as ViewStyle,

    twoColumnRow: {
      flexDirection: isLandscape ? 'row' : 'column',
      gap: spacing.md,
      justifyContent: 'space-between',
    } as ViewStyle,

    columnHalf: {
      flex: 1,
      minWidth: isTablet ? '45%' : '100%',
    } as ViewStyle,

    columnThird: {
      flex: 1,
      minWidth: isTablet ? '30%' : '100%',
    } as ViewStyle,

    // === Cards ===
    card: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    } as ViewStyle,

    cardSmall: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    } as ViewStyle,

    // === Typography ===
    heading1: {
      fontSize: fontSize.xxl,
      fontWeight: '700',
      color: '#0f172a',
      marginBottom: spacing.md,
    } as TextStyle,

    heading2: {
      fontSize: fontSize.xl,
      fontWeight: '600',
      color: '#0f172a',
      marginBottom: spacing.sm,
    } as TextStyle,

    heading3: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: spacing.sm,
    } as TextStyle,

    bodyLarge: {
      fontSize: fontSize.md,
      color: '#475569',
      lineHeight: fontSize.md * 1.5,
    } as TextStyle,

    bodyRegular: {
      fontSize: fontSize.sm,
      color: '#64748b',
      lineHeight: fontSize.sm * 1.5,
    } as TextStyle,

    bodySmall: {
      fontSize: fontSize.xs,
      color: '#94a3b8',
    } as TextStyle,

    // === Forms ===
    formGroup: {
      marginBottom: spacing.md,
    } as ViewStyle,

    label: {
      fontSize: fontSize.sm,
      fontWeight: '500',
      color: '#64748b',
      marginBottom: spacing.sm,
    } as TextStyle,

    input: {
      backgroundColor: '#f1f5f9',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      fontSize: fontSize.md,
      color: '#0f172a',
      minHeight: 48,
    } as ViewStyle,

    inputLarge: {
      backgroundColor: '#f1f5f9',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: 8,
      fontSize: fontSize.md,
      color: '#0f172a',
      minHeight: 56,
    } as ViewStyle,

    // === Buttons ===
    button: {
      backgroundColor: '#1d64c1',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    } as ViewStyle,

    buttonLarge: {
      backgroundColor: '#1d64c1',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 56,
    } as ViewStyle,

    buttonText: {
      color: '#fff',
      fontSize: fontSize.md,
      fontWeight: '600',
    } as TextStyle,

    // === Grids ===
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginBottom: spacing.lg,
    } as ViewStyle,

    gridItem: {
      flex: 1,
      minWidth: isPhone ? '100%' : isLandscape ? '48%' : '100%',
    } as ViewStyle,

    gridItemThreeCol: {
      flex: 1,
      minWidth: isPhone ? '100%' : isTablet ? '48%' : '32%',
    } as ViewStyle,

    // === Spacing ===
    spacingXs: {
      marginVertical: spacing.xs,
    } as ViewStyle,

    spacingSm: {
      marginVertical: spacing.sm,
    } as ViewStyle,

    spacingMd: {
      marginVertical: spacing.md,
    } as ViewStyle,

    spacingLg: {
      marginVertical: spacing.lg,
    } as ViewStyle,

    spacingXl: {
      marginVertical: spacing.xl,
    } as ViewStyle,

    gapSmall: {
      gap: spacing.sm,
    } as ViewStyle,

    gapMedium: {
      gap: spacing.md,
    } as ViewStyle,

    gapLarge: {
      gap: spacing.lg,
    } as ViewStyle,

    // === Landscape-specific adjustments ===
    landscapeCompactContainer: isLandscape
      ? ({
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.md,
        } as ViewStyle)
      : {},

    // === Status/State Styles ===
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff',
    } as ViewStyle,

    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: horizontalPadding,
    } as ViewStyle,

    errorContainer: {
      backgroundColor: '#fee2e2',
      borderRadius: 8,
      padding: spacing.md,
      marginBottom: spacing.md,
    } as ViewStyle,

    successContainer: {
      backgroundColor: '#dcfce7',
      borderRadius: 8,
      padding: spacing.md,
      marginBottom: spacing.md,
    } as ViewStyle,
  });
};

/**
 * Get responsive dimension value
 */
export const getResponsiveDimension = (
  width: number,
  baseValue: number,
  maxValue?: number
): number => {
  const calculated = (width / 375) * baseValue; // 375 is standard phone width
  return maxValue ? Math.min(calculated, maxValue) : calculated;
};


/**
 * Calculate responsive table column widths
 * 
 * @param screenWidth - The screen width
 * @param numberOfColumns - Number of columns in the table
 * @param minColWidth - Minimum column width (default 90)
 * @param horizontalPadding - Horizontal padding to account for (default 40)
 * @returns Object with colWidth, totalTableWidth, and needsHorizontalScroll
 */
export const calculateResponsiveTableLayout = (
  screenWidth: number,
  numberOfColumns: number,
  minColWidth: number = 90,
  horizontalPadding: number = 40
) => {
  const availableWidth = screenWidth - horizontalPadding;
  const maxTotalWidth = availableWidth;
  
  // Calculate column width: either divide equally or use min width if that's larger
  const equalWidth = maxTotalWidth / numberOfColumns;
  const colWidth = Math.max(minColWidth, Math.floor(equalWidth));
  const totalTableWidth = colWidth * numberOfColumns;
  
  // Allow horizontal scroll only if necessary (content doesn't fit)
  const needsHorizontalScroll = totalTableWidth > maxTotalWidth;
  
  return {
    colWidth,
    totalTableWidth,
    needsHorizontalScroll,
    availableWidth,
  };
};

/**
 * Calculate responsive column width for adaptive tables with different column counts
 * 
 * @param screenWidth - The screen width
 * @param columns - Array of column definitions with their proportional widths
 * @param minColWidth - Minimum column width (default 80)
 * @param horizontalPadding - Horizontal padding to account for (default 40)
 * @returns Array of calculated widths for each column
 */
export const calculateAdaptiveColumnWidths = (
  screenWidth: number,
  columns: Array<{ id: string; weight: number }>,
  minColWidth: number = 80,
  horizontalPadding: number = 40
): Record<string, number> => {
  const availableWidth = screenWidth - horizontalPadding;
  const totalWeight = columns.reduce((sum, col) => sum + col.weight, 0);
  
  const columnWidths: Record<string, number> = {};
  columns.forEach(col => {
    const proportionalWidth = (col.weight / totalWeight) * availableWidth;
    columnWidths[col.id] = Math.max(minColWidth, Math.floor(proportionalWidth));
  });
  
  return columnWidths;
};
