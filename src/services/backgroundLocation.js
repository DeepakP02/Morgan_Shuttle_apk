import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../constants/config';
import { patchShuttleLocation } from './shuttleService';

export const LOCATION_TASK_NAME = 'BACKGROUND_LOCATION_TASK';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[Background Location] Task error:', error.message);
    return;
  }
  if (data) {
    const { locations } = data;
    if (locations && locations.length > 0) {
      const loc = locations[locations.length - 1];
      const { latitude, longitude } = loc.coords;

      try {
        const savedToken = await AsyncStorage.getItem('user-token');
        if (!savedToken) return;

        const driverSessionRaw = await AsyncStorage.getItem('driver-shuttle-session-v1');
        if (!driverSessionRaw) {
          console.log('[Background Location] No driver session found. Skipping ping.');
          return;
        }

        const parsed = JSON.parse(driverSessionRaw);
        const session = parsed.session || {};
        
        if (!session.shiftActive || !session.trackingEnabled || session.paused) {
           console.log('[Background Location] Tracking disabled or paused. Skipping ping.');
           return;
        }

        const backgroundAxios = axios.create({
          baseURL: API_URL,
          timeout: 10000,
          headers: {
            'Authorization': `Bearer ${savedToken}`,
            'Content-Type': 'application/json'
          }
        });

        await patchShuttleLocation(backgroundAxios, latitude, longitude);
        console.log(`[Background Location] Success: ${latitude}, ${longitude}`);
      } catch (err) {
        console.warn('[Background Location] Error:', err.message);
      }
    }
  }
});
