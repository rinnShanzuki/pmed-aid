import * as ScreenOrientation from 'expo-screen-orientation';

/**
 * Screen orientation configuration
 * Controls which orientations are allowed for different parts of the app
 */

export type OrientationLock =
  | 'PORTRAIT'
  | 'PORTRAIT_UP'
  | 'PORTRAIT_DOWN'
  | 'LANDSCAPE'
  | 'LANDSCAPE_LEFT'
  | 'LANDSCAPE_RIGHT'
  | 'ALL'
  | 'ALL_BUT_UPSIDE_DOWN';

export interface OrientationConfig {
  name: string;
  lock: OrientationLock;
  description: string;
}

/**
 * Predefined orientation configurations for different screens
 */
export const ORIENTATION_CONFIGS: Record<string, OrientationConfig> = {
  // Auth screens - portrait only for better UX
  AUTH: {
    name: 'Auth Screens',
    lock: 'PORTRAIT_UP',
    description: 'Auth screens are locked to portrait mode',
  },

  // Main dashboards - allow both orientations
  DASHBOARD: {
    name: 'Dashboard',
    lock: 'ALL_BUT_UPSIDE_DOWN',
    description: 'Dashboards adapt to portrait and landscape',
  },

  // Detail screens - allow both orientations
  DETAIL: {
    name: 'Detail Screen',
    lock: 'ALL_BUT_UPSIDE_DOWN',
    description: 'Detail screens adapt to device orientation',
  },

  // Full app - allow all orientations
  APP: {
    name: 'Full App',
    lock: 'ALL_BUT_UPSIDE_DOWN',
    description: 'App allows all orientations except upside down',
  },

  // Video/media screens - prefer landscape
  MEDIA: {
    name: 'Media Screen',
    lock: 'LANDSCAPE',
    description: 'Media screens prefer landscape orientation',
  },

  // Forms - portrait only
  FORM: {
    name: 'Form Screen',
    lock: 'PORTRAIT_UP',
    description: 'Form screens are locked to portrait for better UX',
  },
};

/**
 * Convert orientation config to expo screen orientation
 */
export const getExpoOrientation = (
  lock: OrientationLock
): ScreenOrientation.Orientation => {
  const orientationMap: Record<OrientationLock, ScreenOrientation.Orientation> =
    {
      PORTRAIT: ScreenOrientation.Orientation.PORTRAIT,
      PORTRAIT_UP: ScreenOrientation.Orientation.PORTRAIT_UP,
      PORTRAIT_DOWN: ScreenOrientation.Orientation.PORTRAIT_DOWN,
      LANDSCAPE: ScreenOrientation.Orientation.LANDSCAPE,
      LANDSCAPE_LEFT: ScreenOrientation.Orientation.LANDSCAPE_LEFT,
      LANDSCAPE_RIGHT: ScreenOrientation.Orientation.LANDSCAPE_RIGHT,
      ALL: ScreenOrientation.Orientation.ALL,
      ALL_BUT_UPSIDE_DOWN: ScreenOrientation.Orientation.ALL_BUT_UPSIDE_DOWN,
    };

  return orientationMap[lock];
};

/**
 * Hook to manage screen orientation
 * Call this in a useEffect in your screen component
 */
export const useScreenOrientation = (config: OrientationConfig) => {
  const setOrientation = async () => {
    try {
      await ScreenOrientation.lockAsync(getExpoOrientation(config.lock));
    } catch (error) {
      console.error(`Failed to lock orientation to ${config.lock}:`, error);
    }
  };

  const resetOrientation = async () => {
    try {
      await ScreenOrientation.unlockAsync();
    } catch (error) {
      console.error('Failed to unlock orientation:', error);
    }
  };

  return { setOrientation, resetOrientation };
};
