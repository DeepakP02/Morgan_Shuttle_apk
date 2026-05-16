import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';
import { isBefore, addHours, parseISO } from 'date-fns';

import { API_URL } from '../constants/config';
import {
  fetchShuttleLive as fetchShuttleLiveSvc,
  postShuttleShift,
  patchShuttleTracking,
  patchShuttleLocation,
} from '../services/shuttleService';
import { can as permissionCan, RESOURCES, normalizeRoleKey, isAdminNavigatorRole } from '../constants/permissions';

axios.defaults.baseURL = API_URL;
console.log('🔗 Morgan Shuttle Connected to:', API_URL);

const GlobalContext = createContext();
const USER_TOKEN_STORAGE_KEY = 'user-token';
const USER_DATA_STORAGE_KEY = 'user-data';
const USER_PROFILE_CACHE_PREFIX = 'user-profile-cache:';
const DRIVER_SESSION_KEY = 'driver-shuttle-session-v1';

const getProfileCacheKey = (userObj = {}) => {
  const identity = userObj.id || userObj.email || userObj.user_id || userObj.userId;
  return identity ? `${USER_PROFILE_CACHE_PREFIX}${String(identity).toLowerCase()}` : null;
};

const normalizeUserData = (rawUser = {}, fallback = {}) => {
  const merged = { ...fallback, ...rawUser };
  return {
    ...merged,
    phone: merged.phone || merged.mobile || merged.mobile_number || merged.phone_number || fallback.phone || '',
    extra:
      merged.extra ||
      merged.license ||
      merged.driving_license ||
      merged.drivingLicence ||
      merged.licenseNumber ||
      merged.license_number ||
      merged.license_no ||
      merged.license_id ||
      merged.room ||
      merged.room_number ||
      merged.room_no ||
      fallback.extra ||
      '',
    special:
      merged.special ||
      merged.shuttle ||
      merged.shuttle_id ||
      merged.shuttle_no ||
      merged.shuttle_number ||
      merged.vehicle ||
      merged.vehicle_id ||
      merged.vehicleId ||
      merged.vehicle_no ||
      merged.vehicle_number ||
      fallback.special ||
      '',
    permissions: merged.permissions || fallback.permissions || null,
  };
};

export const GlobalProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  // updateUser → calls backend API + updates local state
  const updateUser = async (data) => {
    try {
      const trimmedData = {
        name: String(data?.name || '').trim(),
        email: String(data?.email || '').trim(),
        phone: String(data?.phone || '').trim(),
        extra: String(data?.extra || '').trim(),
        special: String(data?.special || '').trim(),
      };

      // Extensive "carpet bomb" of aliases to ensure backend compatibility
      const enhancedData = { 
        ...trimmedData,
        license: trimmedData.extra,
        driving_license: trimmedData.extra,
        license_number: trimmedData.extra,
        license_no: trimmedData.extra,
        license_id: trimmedData.extra,
        licenseNumber: trimmedData.extra,
        shuttle: trimmedData.special,
        shuttle_id: trimmedData.special,
        shuttle_no: trimmedData.special,
        shuttle_number: trimmedData.special,
        vehicle: trimmedData.special,
        vehicle_id: trimmedData.special,
        vehicleId: trimmedData.special,
        vehicle_no: trimmedData.special,
        vehicle_number: trimmedData.special,
        room: trimmedData.extra,
        room_number: trimmedData.extra,
        room_no: trimmedData.extra,
        mobile: trimmedData.phone,
        mobile_number: trimmedData.phone,
        phone_number: trimmedData.phone,
      };

      const response = await axios.patch(`/users/${user.id}`, enhancedData, { timeout: 15000 });
      
      if (response.data.success) {
        let freshServerUser = null;
        try {
          const fresh = await axios.get(`/users/${user.id}`, { timeout: 15000 });
          if (fresh.data?.success && fresh.data?.user) freshServerUser = fresh.data.user;
        } catch (_) {
          // Keep graceful fallback to PATCH response/local values.
        }

        // PERMANENT FIX FOR N/A: We MUST trust the data the user just saved locally.
        // We merge: Old State + Backend Data + New Submitted Data.
        // This ensures if the backend didn't save/return a field, we still keep it in UI.
        const fromBackend = freshServerUser || response.data.user || {};
        const nextUser = normalizeUserData(
          {
            ...user,
            ...fromBackend,
            ...trimmedData, // Keep local latest form values if backend omits aliases
          },
          user || {}
        );
        setUser(nextUser);
        await AsyncStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify(nextUser));
        const profileCacheKey = getProfileCacheKey(nextUser);
        if (profileCacheKey) {
          await AsyncStorage.setItem(profileCacheKey, JSON.stringify(nextUser));
        }
        return { success: true };
      }
      throw new Error('Profile update failed.');
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error(error.response?.data?.message || 'Profile update failed.');
    }
  };
  const [language, setLanguage] = useState(i18n.language || 'en');

  const changeLanguage = async (lng) => {
    console.log('🌐 Changing Language to:', lng);
    try {
      await i18n.changeLanguage(lng);
      setLanguage(lng); 
      await AsyncStorage.setItem('user-language', lng);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const [trips, setTrips] = useState([]);
  const [requests, setRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [users, setUsers] = useState([]); // Real users from MySQL

  const [fuelLogs, setFuelLogs] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);

  // Data Fetching Logic
  const fetchTrips = async (date) => {
    try {
      const response = await axios.get('/trips', { params: { date } });
      if (response.data.success) {
        setTrips(response.data.trips);
      }
    } catch (error) {
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.error('Error fetching trips:', error);
      }
    }
  };

  const fetchBookings = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`/bookings/${user.id}`);
      if (response.data.success) {
        setBookings(response.data.bookings);
      }
    } catch (error) {
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.error('Error fetching bookings:', error);
      }
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await axios.get('/trips/requests');
      if (response.data.success) {
        setRequests(response.data.requests);
      }
    } catch (error) {
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.error('Error fetching requests:', error);
      }
    }
  };

  const fetchDestinations = async () => {
    try {
      const response = await axios.get('/users/places');
      if (response.data.success) {
        setDestinations(response.data.destinations);
      }
    } catch (error) {
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.error('Error fetching destinations:', error);
      }
    }
  };

  const fetchUsers = async () => {
    if (!isAdminNavigatorRole(currentRole)) return;
    try {
      const response = await axios.get('/users');
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.error('Error fetching users:', error);
      }
    }
  };

  const fetchLogs = async () => {
    if (!isAdminNavigatorRole(currentRole)) return;
    try {
      const response = await axios.get('/logs');
      if (response.data.success) {
        setFuelLogs(response.data.fuelLogs);
        setMaintenanceLogs(response.data.maintLogs);
      }
    } catch (error) {
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.error('Error fetching logs:', error);
      }
    }
  };

  const [notifications, setNotifications] = useState([]);

  const [shuttleLive, setShuttleLive] = useState(null);
  const [driverSession, setDriverSession] = useState({
    shiftActive: false,
    trackingEnabled: true,
    paused: false,
  });
  const tripsRef = useRef([]);
  useEffect(() => {
    tripsRef.current = trips;
  }, [trips]);

  const refreshShuttleLive = useCallback(async () => {
    try {
      const live = await fetchShuttleLiveSvc(axios, tripsRef.current);
      setShuttleLive(live);
      return live;
    } catch (error) {
      console.warn('refreshShuttleLive:', error?.message);
      return null;
    }
  }, []);

  const mergeDriverSession = useCallback((partial) => {
    setDriverSession((prev) => {
      const next = { ...prev, ...partial };
      if (user?.id) {
        AsyncStorage.setItem(
          DRIVER_SESSION_KEY,
          JSON.stringify({ userId: user.id, session: next })
        ).catch(() => {});
      }
      return next;
    });
  }, [user?.id]);

  const startDriverShift = async () => {
    try {
      await postShuttleShift(axios, 'start');
    } catch (_) {
      /* optional route */
    }
    mergeDriverSession({ shiftActive: true, paused: false });
  };

  const endDriverShift = async () => {
    try {
      await postShuttleShift(axios, 'end');
    } catch (_) {}
    mergeDriverSession({ shiftActive: false, paused: false, trackingEnabled: true });
  };

  const setDriverTrackingEnabled = async (enabled) => {
    try {
      await patchShuttleTracking(axios, { tracking_enabled: !!enabled });
    } catch (_) {}
    mergeDriverSession({ trackingEnabled: !!enabled });
  };

  const setDriverTrackingPaused = async (paused) => {
    try {
      await patchShuttleTracking(axios, { paused: !!paused });
    } catch (_) {}
    mergeDriverSession({ paused: !!paused });
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`/users/${user.id}/notifications`);
      if (response.data.success) {
        const safeNotifications = Array.isArray(response.data.notifications)
          ? response.data.notifications
          : [];
        setNotifications(safeNotifications);
      }
    } catch (error) {
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.error('Error fetching notifications:', error);
      }
    }
  };

  const markNotificationRead = async (id) => {
    try {
      const response = await axios.patch(`/users/notifications/${id}`);
      if (response.data.success) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  };

  const deleteUser = async (id) => {
    try {
      const response = await axios.delete(`/users/${id}`);
      if (response.data.success) {
        fetchUsers();
        return { success: true };
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  useEffect(() => {
    const hydrateSession = async () => {
      try {
        const savedToken = await AsyncStorage.getItem(USER_TOKEN_STORAGE_KEY);
        const savedUserRaw = await AsyncStorage.getItem(USER_DATA_STORAGE_KEY);
        const savedUser = savedUserRaw ? JSON.parse(savedUserRaw) : null;

        if (savedToken && savedUser) {
          const normalizedUser = normalizeUserData(savedUser);
          axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
          
          // SET EVERYTHING AT ONCE
          setAuthToken(savedToken);
          setUser(normalizedUser);
          setCurrentRole(normalizedUser.role || null);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }

        // Hydrate language preference
        const savedLanguage = await AsyncStorage.getItem('user-language');
        if (savedLanguage) {
          setLanguage(savedLanguage);
          i18n.changeLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Session restore failed:', error);
        setIsLoggedIn(false);
      }
    };

    hydrateSession();
  }, []);

  const isAlerting401 = useRef(false);

  // GLOBAL ERROR INTERCEPTOR: Handle 401 (Unauthorized/Account Disabled)
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // If server returns 401 or 403, it means token expired or account is disabled
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          console.log(`🚨 Morgan Auth: ${error.response.status} received, forcing logout.`);
          
          if (!isAlerting401.current) {
            isAlerting401.current = true;
            const message = error.response.data?.message || 'Access Denied: Your account has been disabled or your session has expired.';
            
            Alert.alert(
              'Access Denied',
              message,
              [{ text: 'OK', onPress: () => { isAlerting401.current = false; } }]
            );
          }

          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [logout]);

  useEffect(() => {
    const hydrateDriver = async () => {
      if (normalizeRoleKey(currentRole) !== 'driver' || !user?.id) return;
      try {
        const raw = await AsyncStorage.getItem(DRIVER_SESSION_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed.userId === user.id && parsed.session) {
          setDriverSession((s) => ({ ...s, ...parsed.session }));
        }
      } catch (_) {}
    };
    hydrateDriver();
  }, [currentRole, user?.id]);

  useEffect(() => {
    let tripInterval;
    if (isLoggedIn) {
      fetchTrips();
      fetchBookings();
      fetchRequests();
      fetchDestinations();
      fetchNotifications();
      refreshShuttleLive();
      if (isAdminNavigatorRole(currentRole)) {
        fetchUsers();
        fetchLogs();
      }

      tripInterval = setInterval(() => {
        fetchTrips();
        refreshShuttleLive();
        fetchNotifications();
        if (currentRole === 'tenant') fetchBookings();
        if (isAdminNavigatorRole(currentRole)) fetchRequests();
      }, 3000);
    }
    return () => tripInterval && clearInterval(tripInterval);
  }, [isLoggedIn, user, currentRole, refreshShuttleLive]);


  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { user: userData, token, success } = response.data;

      if (success) {
        const profileCacheKey = getProfileCacheKey(userData);
        const cachedUserRaw = profileCacheKey ? await AsyncStorage.getItem(profileCacheKey) : null;
        const cachedUser = cachedUserRaw ? JSON.parse(cachedUserRaw) : {};
        const normalizedUser = normalizeUserData(userData, cachedUser);
        setIsLoggedIn(true);
        setCurrentRole(normalizedUser.role);
        setUser(normalizedUser);
        setAuthToken(token);

        // Set Auth Header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        await AsyncStorage.setItem(USER_TOKEN_STORAGE_KEY, token);
        await AsyncStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify(normalizedUser));
        if (profileCacheKey) {
          await AsyncStorage.setItem(profileCacheKey, JSON.stringify(normalizedUser));
        }

        return { success: true, role: normalizedUser.role };
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('📡 Login attempt rejected:', error.response.status, error.response.data?.message);
      } else {
        console.error('Login Error:', error);
      }

      let message = 'Login failed. Please check credentials.';
      if (!error.response) {
        message = 'Network error. Please check your internet/WiFi connection.';
      } else if (error.response.status === 401 || error.response.status === 403) {
        message = error.response.data?.message || 'Invalid email or password.';
      } else if (error.response.data?.message) {
        message = error.response.data.message;
      }
      throw new Error(message);
    }
  };

  const sendInvitation = async (userId) => {
    try {
      const response = await axios.post('/auth/send-invitation', { userId });
      if (response.data.success) {
        fetchUsers(); // Refresh list to show invitation status
        return { success: true, token: response.data.token };
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      throw error;
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await axios.post('/auth/forgot-password', { email });
      if (response.data.success) {
        return { success: true, token: response.data.token };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to initiate password reset.';
      throw new Error(message);
    }
  };

  const setPasswordViaToken = async (token, newPassword) => {
    try {
      const response = await axios.post('/auth/setup-password', { token, password: newPassword });
      if (response.data.success) {
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Password setup failed.';
      throw new Error(message);
    }
  };

  const internalCreateUser = async (name, email, role) => {
    try {
      const response = await axios.post('/auth/internal-create', { name, email, role });
      if (response.data.success) {
        fetchUsers(); // Refresh the list
        return { success: true };
      }
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setCurrentRole(null);
    setUser(null);
    setAuthToken(null);
    setTrips([]);
    setBookings([]);
    setRequests([]);
    setShuttleLive(null);
    setDriverSession({ shiftActive: false, trackingEnabled: true, paused: false });
    delete axios.defaults.headers.common['Authorization'];
    AsyncStorage.multiRemove([USER_TOKEN_STORAGE_KEY, USER_DATA_STORAGE_KEY, DRIVER_SESSION_KEY]);
  }, []);

  const bookTrip = async (tripId, seats) => {
    let previousRemaining = null;
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== tripId) return t;
        previousRemaining = t.seats_remaining;
        const nextRem = Math.max(0, (t.seats_remaining ?? 0) - seats);
        return { ...t, seats_remaining: nextRem };
      })
    );
    try {
      const response = await axios.post('/bookings', { trip_id: tripId, user_id: user.id, seats });
      if (response.data.success) {
        fetchTrips();
        fetchBookings();
        return { success: true };
      }
    } catch (error) {
      if (previousRemaining != null) {
        setTrips((prev) =>
          prev.map((t) => (t.id === tripId ? { ...t, seats_remaining: previousRemaining } : t))
        );
      }
      const message = error.response?.data?.message || 'Booking failed.';
      throw new Error(message);
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      const response = await axios.delete(`/bookings/${bookingId}`);
      if (response.data.success) {
        // Refresh local data to match DB
        fetchTrips();
        fetchBookings();
        return { success: true };
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  };

  const submitRequest = async (data) => {
    try {
      const response = await axios.post('/trips/request', { ...data, source: currentRole || 'tenant' });
      if (response.data.success) {
        setRequests(prev => [response.data.request, ...prev]);
        return { success: true };
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      throw error;
    }
  };

  const approveRequest = async (id) => {
    try {
      const response = await axios.post(`/trips/requests/${id}/approve`);
      if (response.data.success) {
        fetchTrips();
        fetchRequests();
        fetchNotifications();
        return { success: true };
      }
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const deleteRequest = async (id) => {
    try {
      const response = await axios.delete(`/trips/requests/${id}`);
      if (response.data.success) {
        fetchRequests();
      }
    } catch (error) {
      console.error('Error deleting request:', error);
    }
  };

  const rejectRequest = async (id) => {
    try {
      const response = await axios.post(`/trips/requests/${id}/reject`);
      if (response.data.success) {
        fetchRequests();
        fetchNotifications();
        return { success: true };
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const addDestination = async (name) => {
    try {
      const response = await axios.post('/users/places', { name });
      if (response.data.success) {
        fetchDestinations();
      }
    } catch (error) {
      console.error('Error adding destination:', error);
    }
  };

  const removeDestination = async (name) => {
    try {
      const fullUrl = axios.defaults.baseURL + `/users/places?name=${encodeURIComponent(name)}`;
      console.log('📡 UI: ATTEMPTING NETWORK DELETE ON:', fullUrl);

      // Optimistic Update: Immediately remove from local list for speed
      setDestinations(prev => prev.filter(d => d !== name));
      
      const response = await axios.delete(`/users/places?name=${encodeURIComponent(name)}`);
      console.log('📡 UI: NETWORK RESPONSE STATUS:', response.status);

      if (response.data.success) {
        fetchDestinations(); // Final sync with DB
      }
    } catch (error) {
      console.error('❌ UI: DELETE FAILED:', error.message);
      if (error.response) console.log('❌ UI: SERVER SAID:', error.response.data);
      fetchDestinations(); // Rollback on error
    }
  };

  const addFuelLog = async (log) => {
    try {
      const response = await axios.post('/logs/fuel', log);
      if (response.data.success) {
        // Re-fetch all logs to ensure we get the mapped versions (with currency symbols, etc.)
        await fetchLogs();
        return { success: true };
      }
    } catch (error) {
      console.error('Error adding fuel log:', error);
      throw error;
    }
  };

  const addMaintenanceLog = async (log) => {
    try {
      const response = await axios.post('/logs/maintenance', log);
      if (response.data.success) {
        await fetchLogs();
        return { success: true };
      }
    } catch (error) {
      console.error('Error adding maintenance log:', error);
      throw error;
    }
  };

  const addTrip = async (trip) => {
    try {
      const response = await axios.post('/trips', { ...trip, seats_total: 7 });
      if (response.data.success) {
        fetchTrips(); // Refresh the list
      }
    } catch (error) {
      console.error('Error adding trip:', error);
    }
  };

  const deleteTrip = async (id) => {
    try {
      const response = await axios.delete(`/trips/${id}`);
      if (response.data.success) {
        fetchTrips();
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
    }
  };

  const logTripCompletion = async (id, count, notes) => {
    try {
      const response = await axios.patch(`/trips/${id}`, { status: 'completed', actual_passengers: count, notes });
      if (response.data.success) {
        fetchTrips();
        return { success: true };
      }
      throw new Error('Trip completion failed.');
    } catch (error) {
      console.error('Error logging completion:', error);
      throw new Error(error.response?.data?.message || 'Unable to complete trip log.');
    }
  };

  // ─── LIVE TRACKING ────────────────────────────────────────────────────────────
  const startTrip = async (id) => {
    try {
      const response = await axios.patch(`/trips/${id}/start`);
      if (response.data.success) {
        fetchTrips(); // Refresh so status → in_progress
        return { success: true };
      }
      throw new Error('Unable to start trip.');
    } catch (error) {
      console.error('Error starting trip:', error);
      throw new Error(error.response?.data?.message || 'Unable to start trip.');
    }
  };

  const updateTripLocation = async (id, lat, lng) => {
    try {
      await axios.patch(`/trips/${id}/location`, { lat, lng });
      // Silently update local trips state for instant tenant UI refresh
      setTrips(prev =>
        prev.map(t => (t.id === id ? { ...t, lat, lng } : t))
      );
    } catch (error) {
      // Non-critical: don't alert user, just log
      console.warn('Location ping failed:', error.message);
    }
  };

  /** Shift-based GPS: primary endpoint + legacy trip ping for older APIs */
  const postShuttleDriverLocation = async (lat, lng) => {
    let liveFromServer = null;
    try {
      const response = await patchShuttleLocation(axios, lat, lng);
      liveFromServer = response?.live || null;
    } catch (error) {
      console.warn('Shuttle location ping failed:', error?.message);
    }

    // Always trust backend live flags so app does not stay "fake active" after backend restarts.
    if (liveFromServer) {
      mergeDriverSession({
        shiftActive: !!liveFromServer.shift_active,
        trackingEnabled: !!liveFromServer.tracking_on,
        paused: !!liveFromServer.paused,
      });
    }

    const nextLat = liveFromServer?.lat != null ? liveFromServer.lat : lat;
    const nextLng = liveFromServer?.lng != null ? liveFromServer.lng : lng;
    setShuttleLive((prev) => ({
      ...(prev || {}),
      ...(liveFromServer || {}),
      lat: nextLat,
      lng: nextLng,
      shiftActive:
        liveFromServer?.shift_active != null
          ? !!liveFromServer.shift_active
          : prev?.shiftActive ?? false,
      trackingOn:
        liveFromServer?.tracking_on != null
          ? !!liveFromServer.tracking_on
          : prev?.trackingOn ?? false,
      paused:
        liveFromServer?.paused != null
          ? !!liveFromServer.paused
          : prev?.paused ?? false,
      status: liveFromServer?.status || prev?.status || 'offline',
      updatedAt: liveFromServer?.updated_at || new Date().toISOString(),
    }));

    const list = tripsRef.current || [];
    const running = list.find((t) => t && t.status === 'in_progress');
    if (running) {
      await updateTripLocation(running.id, nextLat, nextLng);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────────


  const addRequest = async (req) => {
    try {
      const response = await axios.post('/trips/request', { ...req, status: 'approved', source: 'admin' });
      if (response.data.success) {
        fetchTrips();
        fetchRequests(); // Also refresh requests!
      }
    } catch (error) {
      console.error('Error adding request:', error);
    }
  };

  const removeFuelLog = async (id) => {
    try {
      const response = await axios.delete(`/logs/fuel/${id}`);
      if (response.data.success) {
        setFuelLogs(prev => prev.filter(l => l.id !== id));
      }
    } catch (error) {
      console.error('Error removing fuel log:', error);
    }
  };

  const removeMaintenanceLog = async (id) => {
    try {
      const response = await axios.delete(`/logs/maintenance/${id}`);
      if (response.data.success) {
        setMaintenanceLogs(prev => prev.filter(l => l.id !== id));
      }
    } catch (error) {
      console.error('Error removing maintenance log:', error);
    }
  };
  const syncPMS = async (creds) => {
    try {
      const response = await axios.post('/sync/pms', creds);
      if (response.data.success) {
        await fetchUsers(); // Refresh list to show new synced users
        return { success: true, message: response.data.message };
      }
    } catch (error) {
      console.error('PMS Sync failed:', error);
      throw error;
    }
  };

  const hasPermission = (resource, action) => permissionCan(user, resource, action);

  return (
    <GlobalContext.Provider value={{
      isLoggedIn, currentRole, login, logout, user, setUser, updateUser, trips, addTrip, deleteTrip, logTripCompletion,
      startTrip, updateTripLocation, postShuttleDriverLocation, fetchTrips, fetchRequests, fetchBookings,
      notifications, fetchNotifications, markNotificationRead,
      requests, addRequest, deleteRequest, bookings,
      bookTrip, cancelBooking, submitRequest, approveRequest, rejectRequest,
      destinations, addDestination, removeDestination,
      fuelLogs, maintenanceLogs, addFuelLog, removeFuelLog, addMaintenanceLog, removeMaintenanceLog,
      sendInvitation, forgotPassword, setPasswordViaToken, mockUsers: users, syncPMS, internalCreateUser,
      deleteUser,
      language, changeLanguage,
      shuttleLive, refreshShuttleLive,
      driverSession, startDriverShift, endDriverShift, setDriverTrackingEnabled, setDriverTrackingPaused, mergeDriverSession,
      hasPermission, RESOURCES,
    }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => useContext(GlobalContext);
