import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_CUSTOM_SERVER = 'custom_api_server_url';
let runtimeCustomServer: string | null = null;

// Initialize custom server override from storage asynchronously
export const initCustomServerURL = async (): Promise<string | null> => {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY_CUSTOM_SERVER);
    if (saved) {
      runtimeCustomServer = saved.trim().replace(/\/+$/, '');
      return runtimeCustomServer;
    }
  } catch {
    // Ignore storage read errors
  }
  return null;
};

// Set or clear custom server URL at runtime
export const setCustomServerURL = async (url: string | null): Promise<void> => {
  runtimeCustomServer = url ? url.trim().replace(/\/+$/, '') : null;
  if (runtimeCustomServer) {
    await AsyncStorage.setItem(STORAGE_KEY_CUSTOM_SERVER, runtimeCustomServer);
  } else {
    await AsyncStorage.removeItem(STORAGE_KEY_CUSTOM_SERVER);
  }
};

export const getCustomServerURL = (): string | null => {
  return runtimeCustomServer;
};

// Immediately kick off loading custom server from storage
initCustomServerURL();

/**
 * Clean & validate host string (removes port, protocols, whitespace)
 */
const sanitizeHost = (raw: string | undefined | null): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Extract hostname from URLs or host:port strings
  const match = trimmed.match(/^(?:https?|exp):\/\/([^/:]+)/) || trimmed.match(/^([^/:]+)/);
  if (match && match[1]) {
    const host = match[1].trim();
    if (host === 'localhost' || host === '127.0.0.1') {
      return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    }
    return host;
  }
  return null;
};

/**
 * Dynamically extract the host computer's IP address.
 * Because your mobile device downloads the Expo bundle from Metro over Wi-Fi,
 * Expo's runtime constants (hostUri, linkingUri, experienceUrl) already contain
 * the host's current Wi-Fi IP. This allows seamless operation across Wi-Fi network switches.
 */
export const getHostIP = (): string => {
  // 1. Expo Constants hostUri (populated by Expo CLI / Metro)
  // Format is typically "192.168.1.26:8081"
  const hostUri = Constants.expoConfig?.hostUri;
  const fromHostUri = sanitizeHost(hostUri);
  if (fromHostUri) return fromHostUri;

  // 2. Expo Constants linkingUri (e.g. "exp://192.168.1.26:8081/--/")
  const linkingUri = Constants.linkingUri;
  const fromLinkingUri = sanitizeHost(linkingUri);
  if (fromLinkingUri) return fromLinkingUri;

  // 3. Expo Constants experienceUrl
  const experienceUrl = (Constants as any)?.experienceUrl;
  const fromExperienceUrl = sanitizeHost(experienceUrl);
  if (fromExperienceUrl) return fromExperienceUrl;

  // 4. Manifest extra hostUri (EAS / Modern updates)
  const manifest2Host = (Constants as any)?.manifest2?.extra?.expoClient?.hostUri;
  const fromManifest2 = sanitizeHost(manifest2Host);
  if (fromManifest2) return fromManifest2;

  // 5. Legacy debuggerHost / hostUri
  const legacyHost = (Constants as any)?.manifest?.debuggerHost || (Constants as any)?.manifest?.hostUri;
  const fromLegacy = sanitizeHost(legacyHost);
  if (fromLegacy) return fromLegacy;

  // 6. NativeModules.SourceCode (React Native bridge)
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  const fromScript = sanitizeHost(scriptURL);
  if (fromScript) return fromScript;

  // 7. Web browser hostname
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname;
  }

  // 8. Auto-synced environment variable from mobile/.env (EXPO_PUBLIC_LOCAL_IP)
  const envIP = process.env.EXPO_PUBLIC_LOCAL_IP;
  const fromEnv = sanitizeHost(envIP);
  if (fromEnv) return fromEnv;

  // 9. Standard emulator vs simulator fallback
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
};

export const API_CONFIG = {
  get LOCAL_IP(): string {
    return getHostIP();
  },
  PORT: '5000',
};

/**
 * Returns the full base URL for REST API calls (ending with /api)
 */
export const getBaseURL = (): string => {
  if (runtimeCustomServer) {
    return runtimeCustomServer.endsWith('/api')
      ? runtimeCustomServer
      : `${runtimeCustomServer}/api`;
  }

  if (__DEV__) {
    return `http://${API_CONFIG.LOCAL_IP}:${API_CONFIG.PORT}/api`;
  }

  return 'https://your-production-api.com/api';
};

/**
 * Returns the base server URL for Socket.io connections (without /api)
 */
export const getSocketURL = (): string => {
  if (runtimeCustomServer) {
    return runtimeCustomServer.replace(/\/api\/?$/, '');
  }

  if (__DEV__) {
    return `http://${API_CONFIG.LOCAL_IP}:${API_CONFIG.PORT}`;
  }

  return 'https://your-production-api.com';
};

/**
 * Helper to test connectivity to the backend health check
 */
export const testServerConnection = async (
  targetBaseURL?: string
): Promise<{ success: boolean; url: string; error?: string; latency?: number }> => {
  const base = targetBaseURL ? targetBaseURL.trim().replace(/\/api\/?$/, '') : getSocketURL();
  const testUrl = `${base}/health`;
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(testUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const latency = Date.now() - startTime;
    if (res.ok) {
      return { success: true, url: testUrl, latency };
    }
    return { success: false, url: testUrl, error: `HTTP ${res.status}: ${res.statusText}`, latency };
  } catch (err: any) {
    const latency = Date.now() - startTime;
    const isTimeout = err.name === 'AbortError' || err.message?.includes('aborted');
    return {
      success: false,
      url: testUrl,
      error: isTimeout ? 'Connection timed out (4s)' : (err.message || 'Network request failed'),
      latency,
    };
  }
};
