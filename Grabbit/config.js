// config.js - Shared configuration for server URLs
import { Platform } from 'react-native';

// Determine the correct server URL based on platform
const getServerUrl = () => {
  // For iOS Simulator, use localhost
  if (Platform.OS === 'ios') {
    return 'http://localhost:4000';
  }
  
  // For Android Emulator, use 10.0.2.2 (special IP that maps to host's localhost)
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000';
  }
  
  // For web or other platforms, use localhost
  return 'http://localhost:4000';
  
  // For physical devices on the same network, you can use your computer's local IP:
  // return 'http://10.0.0.162:4000';
};

export const SERVER_URL = getServerUrl();

console.log(`[Config] Using server URL: ${SERVER_URL} (Platform: ${Platform.OS})`);

