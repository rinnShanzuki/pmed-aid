import { Dimensions, useWindowDimensions as RNUseWindowDimensions } from 'react-native';
import { useMemo } from 'react';

export interface ResponsiveLayout {
  width: number;
  height: number;
  isLandscape: boolean;
  isPortrait: boolean;
  isPhone: boolean;
  isTablet: boolean;
  screenSize: 'small' | 'medium' | 'large' | 'xlarge';
  horizontalPadding: number;
  verticalPadding: number;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
}

/**
 * Custom hook for responsive layout calculations
 * Provides breakpoints, spacing, and font sizes based on screen dimensions
 * Uses Dimensions API as fallback if useWindowDimensions is not available
 */
export const useResponsive = (): ResponsiveLayout => {
  // Use try-catch to handle cases where hook might not be available during initialization
  let width = 375;
  let height = 812;
  
  try {
    const dims = RNUseWindowDimensions();
    width = dims.width || width;
    height = dims.height || height;
  } catch (e) {
    // Fallback to Dimensions API if hook fails
    const dims = Dimensions.get('window');
    width = dims.width || width;
    height = dims.height || height;
  }

  const isLandscape = width > height;
  const isPortrait = height >= width;

  // Screen size classification
  const isPhone = width < 600;
  const isTablet = width >= 600 && width < 1024;
  const isLargeTablet = width >= 1024;

  // Detailed screen size
  const screenSize: 'small' | 'medium' | 'large' | 'xlarge' = useMemo(() => {
    if (width < 480) return 'small';
    if (width < 600) return 'medium';
    if (width < 900) return 'large';
    return 'xlarge';
  }, [width]);

  // Responsive spacing based on screen width
  const spacing = useMemo(
    () => ({
      xs: width * 0.02, // 2% of width
      sm: width * 0.03, // 3% of width
      md: width * 0.05, // 5% of width
      lg: width * 0.07, // 7% of width
      xl: width * 0.1, // 10% of width
    }),
    [width]
  );

  // Responsive font sizes
  const fontSize = useMemo(
    () => ({
      xs: Math.max(10, width * 0.03),
      sm: Math.max(12, width * 0.035),
      md: Math.max(14, width * 0.04),
      lg: Math.max(16, width * 0.05),
      xl: Math.max(20, width * 0.06),
      xxl: Math.max(24, width * 0.08),
    }),
    [width]
  );

  // Responsive padding
  const horizontalPadding = useMemo(
    () => (isPhone ? width * 0.05 : width * 0.08),
    [width, isPhone]
  );

  const verticalPadding = useMemo(
    () => (isLandscape ? height * 0.03 : height * 0.05),
    [height, isLandscape]
  );

  return {
    width,
    height,
    isLandscape,
    isPortrait,
    isPhone,
    isTablet: isTablet || isLargeTablet,
    screenSize,
    horizontalPadding,
    verticalPadding,
    spacing,
    fontSize,
  };
};

/**
 * Utility function to get responsive value based on screen type
 */
export const getResponsiveValue = <T,>(
  phoneValue: T,
  tabletValue: T,
  isTablet: boolean
): T => {
  return isTablet ? tabletValue : phoneValue;
};

/**
 * Calculate responsive column count for grid layouts
 */
export const getGridColumns = (
  width: number,
  minColumnWidth: number = 150
): number => {
  return Math.max(1, Math.floor(width / minColumnWidth));
};

/**
 * Calculate responsive item size for grid
 */
export const getGridItemSize = (
  width: number,
  columns: number,
  gapSize: number = 10
): number => {
  return (width - (columns - 1) * gapSize) / columns;
};
