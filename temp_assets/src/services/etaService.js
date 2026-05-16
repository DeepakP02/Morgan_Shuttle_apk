import { GOOGLE_MAPS_API_KEY } from '../constants/config';
import { API_URL } from '../constants/config';

const EARTH_RADIUS_KM = 6371;

const toRadians = (deg) => (deg * Math.PI) / 180;

export function haversineKm(from, to) {
  if (!from || !to) return null;
  const lat1 = Number(from.latitude);
  const lon1 = Number(from.longitude);
  const lat2 = Number(to.latitude);
  const lon2 = Number(to.longitude);
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function formatDistance(km) {
  if (!Number.isFinite(km)) return '--';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return '--';
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `${hrs}h ${rem}m` : `${hrs}h`;
}

export async function fetchDistanceMatrix({ origin, destination, apiKey = GOOGLE_MAPS_API_KEY }) {
  if (!origin || !destination || !apiKey) return null;
  try {
    const destinationQuery =
      typeof destination === 'string'
        ? `destination=${encodeURIComponent(destination)}`
        : `dest_lat=${encodeURIComponent(destination.latitude)}&dest_lng=${encodeURIComponent(destination.longitude)}`;
    const backendUrl =
      `${API_URL}/shuttle/eta?origin_lat=${encodeURIComponent(origin.latitude)}` +
      `&origin_lng=${encodeURIComponent(origin.longitude)}` +
      `&${destinationQuery}`;
    const proxyRes = await fetch(backendUrl);
    const proxyData = await proxyRes.json();
    if (proxyData?.success && proxyData?.eta) {
      return {
        distanceText: proxyData.eta.distance_text || null,
        distanceMeters: Number(proxyData.eta.distance_meters),
        durationText: proxyData.eta.duration_text || null,
        durationSeconds: Number(proxyData.eta.duration_seconds),
      };
    }
  } catch (_) {
    // fallback below
  }

  const originStr = `${origin.latitude},${origin.longitude}`;
  const destinationStr =
    typeof destination === 'string'
      ? destination
      : `${destination.latitude},${destination.longitude}`;
  const url =
    `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric` +
    `&origins=${encodeURIComponent(originStr)}` +
    `&destinations=${encodeURIComponent(destinationStr)}` +
    `&key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const row = data?.rows?.[0];
    const element = row?.elements?.[0];
    if (element?.status !== 'OK') return null;
    return {
      distanceText: element.distance?.text || null,
      distanceMeters: Number(element.distance?.value),
      durationText: element.duration?.text || null,
      durationSeconds: Number(element.duration?.value),
    };
  } catch (_) {
    return null;
  }
}
