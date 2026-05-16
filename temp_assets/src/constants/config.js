import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Automatically switch based on environment
export const IS_PRODUCTION = true; // Set to true for production backend
const LIVE_URL = 'https://morgan-backend-production-a281.up.railway.app/api';
const expoHost = Constants.expoConfig?.hostUri?.split(':')?.[0];
const LAN_URL = expoHost ? `http://${expoHost}:5000/api` : null;
const EMULATOR_OR_LOCALHOST_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://127.0.0.1:5000/api';
const LOCAL_URL = process.env.EXPO_PUBLIC_API_URL || LAN_URL || EMULATOR_OR_LOCALHOST_URL;

export const API_URL = IS_PRODUCTION ? LIVE_URL : LOCAL_URL;

// Google Maps Configuration
export const GOOGLE_MAPS_API_KEY = "AIzaSyCuTsTx_q3YnJoB5kxsyw3bvYtLEWWCGVE";
export const GOOGLE_MAP_ID_ANDROID = "8595d29381da95bb639919b3";
export const GOOGLE_MAP_ID_IOS = "8595d29381da95bba3acba71";

console.log(`🚀 APP STATUS: ${IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`🔗 API CONNECTED TO: ${API_URL}`);
