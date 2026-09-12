import { Platform } from 'react-native';

/**
 * API Configuration
 * 
 * For Development:
 * - Android Emulator: Use 10.0.2.2 (maps to host machine's localhost)
 * - iOS Simulator: Use localhost or 127.0.0.1
 * - Real Device: Use your computer's local IP address (e.g., 192.168.1.x)
 * 
 * To find your local IP:
 * - Windows: ipconfig (look for IPv4)
 * - Mac/Linux: ifconfig or ip addr
 * 
 * Make sure:
 * 1. Backend is running on port 5000
 * 2. Device/emulator is on the same network as your computer
 * 3. Firewall allows connection to port 5000
 */

export const API_CONFIG = {
  // Change this to your computer's local IP if testing on real device
  LOCAL_IP: '192.168.1.100', // <-- UPDATE THIS WITH YOUR IP
  PORT: '5000',
};

export const getBaseURL = (): string => {
  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'android') {
      // For Android Emulator
      return 'http://10.0.2.2:5000/api';
      
      // Uncomment below for real Android device
      // return `http://${API_CONFIG.LOCAL_IP}:${API_CONFIG.PORT}/api`;
    } else if (Platform.OS === 'ios') {
      // For iOS Simulator
      return 'http://localhost:5000/api';
      
      // Uncomment below for real iOS device
      // return `http://${API_CONFIG.LOCAL_IP}:${API_CONFIG.PORT}/api`;
    }
    // Fallback for web or other platforms
    return 'http://localhost:5000/api';
  }
  
  // Production - replace with your actual API URL
  return 'https://your-production-api.com/api';
};
