// config.js - Shared configuration for server URLs
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Optional fallback if Expo host detection fails
// Update this only if your network IP is static and detection below cannot infer it.
const FALLBACK_LOCAL_IP = '10.0.0.162';

const PORT = 4000;

const isValidIp = (value) => {
  if (!value) return false;
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(value);
};

const extractIpFromUri = (uri) => {
  if (!uri || typeof uri !== 'string') return null;
  const match = uri.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
  return match ? match[1] : null;
};

// When developing with Expo Go/dev client, Expo exposes the Metro host in several manifest fields.
// We try each one to automatically discover the machine running `expo start`.
const detectExpoHostIp = () => {
  const possibleHosts = [
    Constants.expoConfig?.hostUri,
    Constants.expoConfig?.extra?.expoGo?.debuggerHost,
    Constants.expoConfig?.extra?.expoGo?.developer?.host,
    Constants.manifest2?.extra?.expoGo?.developer?.host,
    Constants.manifest2?.extra?.expoGo?.debuggerHost,
    Constants.manifest?.hostUri,
    Constants.manifest?.debuggerHost,
  ];

  for (const host of possibleHosts) {
    const ip = extractIpFromUri(host);
    if (isValidIp(ip)) {
      return ip;
    }
  }

  return null;
};

const getLocalNetworkUrl = () => {
  const autoDetectedIp = detectExpoHostIp();
  const ipToUse = autoDetectedIp || FALLBACK_LOCAL_IP;
  return `http://${ipToUse}:${PORT}`;
};

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
      return `http://localhost:${PORT}`;
    } else {
      // Physical iOS device needs the computer's local IP
      return getLocalNetworkUrl();
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
      return `http://10.0.2.2:${PORT}`;
    } else {
      // Physical Android device needs the computer's local IP
      return getLocalNetworkUrl();
    }
  }
  
  // For web or other platforms, use localhost
  return `http://localhost:${PORT}`;
};

export const SERVER_URL = getServerUrl();
