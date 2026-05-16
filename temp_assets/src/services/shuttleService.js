import { format } from 'date-fns';

/** Unified live payload for maps (resident / admin / driver). */
export const SHUTTLE_STATUS = {
  OFFLINE: 'offline',
  ACTIVE: 'active',
  PAUSED: 'paused',
};

/**
 * Derive display status from flags.
 */
export function deriveShuttleStatus({ shiftActive, trackingEnabled, paused }) {
  if (!shiftActive) return SHUTTLE_STATUS.OFFLINE;
  if (paused) return SHUTTLE_STATUS.PAUSED;
  if (!trackingEnabled) return SHUTTLE_STATUS.OFFLINE;
  return SHUTTLE_STATUS.ACTIVE;
}

function normalizeLivePayload(raw = {}) {
  const lat = raw.lat != null ? Number(raw.lat) : raw.latitude != null ? Number(raw.latitude) : null;
  const lng = raw.lng != null ? Number(raw.lng) : raw.longitude != null ? Number(raw.longitude) : null;
  const shiftActive =
    raw.shift_active != null ? !!raw.shift_active : raw.shiftActive != null ? !!raw.shiftActive : false;
  const trackingOn =
    raw.tracking_on != null
      ? !!raw.tracking_on
      : raw.trackingEnabled != null
        ? !!raw.trackingEnabled
        : raw.tracking != null
          ? !!raw.tracking
          : false;
  return {
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    status: raw.status || SHUTTLE_STATUS.OFFLINE,
    shiftActive,
    trackingOn,
    paused: !!raw.paused,
    updatedAt: raw.updated_at || raw.updatedAt || null,
    driverId: raw.driver_id || raw.driverId || null,
    driverName: raw.driver_name || raw.driverName || null,
    tripId: raw.trip_id || raw.tripId || null,
  };
}

/**
 * GET /shuttle/live — preferred. Falls back to today's in-progress trip with coordinates.
 */
export async function fetchShuttleLive(axios, trips, opts = {}) {
  const todayStr = opts.todayStr || format(new Date(), 'yyyy-MM-dd');
  try {
    const res = await axios.get('/shuttle/live');
    if (res.data?.success && res.data.live) {
      const n = normalizeLivePayload(res.data.live);
      if (n.lat != null && n.lng != null) return n;
      if (res.data.live.status) return n;
    }
  } catch (_) {
    /* backend may not expose route yet */
  }

  const list = Array.isArray(trips) ? trips : [];
  const running = list.find(
    (t) =>
      t &&
      t.date === todayStr &&
      t.status === 'in_progress' &&
      t.lat != null &&
      t.lng != null
  );
  if (running) {
    return normalizeLivePayload({
      lat: running.lat,
      lng: running.lng,
      status: SHUTTLE_STATUS.ACTIVE,
      shift_active: true,
      tracking_on: true,
      paused: false,
      trip_id: running.id,
      updated_at: new Date().toISOString(),
    });
  }

  return normalizeLivePayload({
    status: SHUTTLE_STATUS.OFFLINE,
    shift_active: false,
    tracking_on: false,
    paused: false,
  });
}

export async function postShuttleShift(axios, action) {
  const res = await axios.post('/shuttle/shift', { action });
  return res.data;
}

export async function patchShuttleTracking(axios, payload) {
  const res = await axios.patch('/shuttle/tracking', payload);
  return res.data;
}

export async function patchShuttleLocation(axios, lat, lng) {
  const res = await axios.patch('/shuttle/location', { lat, lng });
  return res.data;
}

/** Optional admin aggregate — returns null if unavailable */
export async function fetchAdminShuttleDrivers(axios) {
  try {
    const res = await axios.get('/admin/shuttle/drivers');
    if (res.data?.success && Array.isArray(res.data.drivers)) return res.data.drivers;
  } catch (_) {}
  return null;
}
