import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

export interface OrientationInfo {
  width: number;
  height: number;
  isLandscape: boolean;
  isPortrait: boolean;
}

/**
 * Hook for immediate orientation detection
 * Uses Dimensions API and listens for dimension changes
 * Provides faster updates than useWindowDimensions on some devices
 */
export const useOrientation = (): OrientationInfo => {
  const [orientation, setOrientation] = useState<OrientationInfo>(() => {
    const screen = Dimensions.get('screen');
    return {
      width: screen.width,
      height: screen.height,
      isLandscape: screen.width > screen.height,
      isPortrait: screen.height >= screen.width,
    };
  });

  useEffect(() => {
    // Handle dimension changes
    const handleDimensionChange = ({ screen }: { screen: ScaledSize }) => {
      setOrientation({
        width: screen.width,
        height: screen.height,
        isLandscape: screen.width > screen.height,
        isPortrait: screen.height >= screen.width,
      });
    };

    // Subscribe to dimension changes
    const subscription = Dimensions.addEventListener('change', handleDimensionChange);

    // Cleanup
    return () => {
      subscription?.remove();
    };
  }, []);

  return orientation;
};

/**
 * Alternative approach: Returns responsive state for immediate updates
 */
export const useDeviceOrientation = () => {
  const [orientation, setOrientation] = useState({
    isLandscape: Dimensions.get('screen').width > Dimensions.get('screen').height,
    isPortrait: Dimensions.get('screen').height >= Dimensions.get('screen').width,
  });

  useEffect(() => {
    const handleDimensionChange = () => {
      const screen = Dimensions.get('screen');
      setOrientation({
        isLandscape: screen.width > screen.height,
        isPortrait: screen.height >= screen.width,
      });
    };

    const subscription = Dimensions.addEventListener('change', handleDimensionChange);
    return () => subscription?.remove();
  }, []);

  return orientation;
};
