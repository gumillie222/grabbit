// config.js - Shared configuration for server URLs
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Your computer's local IP address on the network
// Update this to match your computer's IP (find it with: ifconfig on Mac/Linux or ipconfig on Windows)
// Make sure your phone and computer are on the same WiFi network
const LOCAL_IP = '10.103.106.2';

// Determine the correct server URL based on platform
const getServerUrl = () => {
  // For iOS
  if (Platform.OS === 'ios') {
    // Check if running on simulator
    // Constants.isDevice is true for physical device, false/undefined for simulator
    // Only check device name if isDevice is false or undefined (not true)
    const isSimulator = Constants.isDevice === false || 
                        (Constants.isDevice !== true && Constants.deviceName?.includes('Simulator'));
    
    if (isSimulator) {
      // iOS Simulator can use localhost
      return 'http://localhost:4000';
    } else {
      // Physical iOS device needs the computer's local IP
      return `http://${LOCAL_IP}:4000`;
    }
  }
  
  // For Android
  if (Platform.OS === 'android') {
    // Check if running on emulator
    // Constants.isDevice is true for physical device, false/undefined for emulator
    // Only check device name if isDevice is false or undefined (not true)
    const isEmulator = Constants.isDevice === false || 
                       (Constants.isDevice !== true && (
                         Constants.deviceName?.includes('emulator') ||
                         Constants.deviceName?.includes('Emulator') ||
                         Constants.deviceName?.includes('sdk')
                       ));
    
    if (isEmulator) {
      // Android Emulator uses 10.0.2.2 (special IP that maps to host's localhost)
      return 'http://10.0.2.2:4000';
    } else {
      // Physical Android device needs the computer's local IP
      return `http://${LOCAL_IP}:4000`;
    }
  }
  
  // For web or other platforms, use localhost
  return 'http://localhost:4000';
};

export const SERVER_URL = getServerUrl();

