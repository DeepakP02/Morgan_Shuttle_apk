import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Constants from 'expo-constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/shared/Button';
import { useGlobal } from '../../store/GlobalContext';
import { COLORS } from '../../constants/theme';
import axios from 'axios';
import { SHUTTLE_STATUS } from '../../services/shuttleService';
import * as Location from 'expo-location';
import { fetchDistanceMatrix, formatDistance, formatDuration, haversineKm } from '../../services/etaService';

export const LiveTrackingScreen = ({ route, navigation }) => {
  const isExpoGo = Constants.appOwnership === 'expo';
  const tripId = route?.params?.tripId;
  const shuttleOnly = route?.params?.shuttleOnly;
  const shouldShowCompletionPopup = route?.params?.showCompletedModal === true;

  const { trips, refreshShuttleLive, shuttleLive } = useGlobal();
  const { t } = useTranslation();
  const mapRef = useRef(null);
  const pollRef = useRef(null);

  const trip = tripId ? trips.find((x) => x.id === tripId) : null;

  const [driverLocation, setDriverLocation] = useState(
    () =>
      shuttleLive?.lat != null && shuttleLive?.lng != null
        ? { latitude: shuttleLive.lat, longitude: shuttleLive.lng }
        : trip?.lat
          ? { latitude: trip.lat, longitude: trip.lng }
          : null
  );
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [residentLocation, setResidentLocation] = useState(null);
  const [residentEta, setResidentEta] = useState(null);
  const [etaLabel, setEtaLabel] = useState('YOU');
  const [etaHint, setEtaHint] = useState('');
  const etaTsRef = useRef(0);

  const liveStatus = useMemo(() => {
    if (shuttleLive?.paused || shuttleLive?.status === SHUTTLE_STATUS.PAUSED) return 'paused';
    if (shuttleLive?.status === SHUTTLE_STATUS.ACTIVE) return 'active';
    if (shuttleLive?.shiftActive && shuttleLive?.trackingOn && !shuttleLive?.paused) return 'active';
    if (trip?.status === 'in_progress') return 'active';
    return 'offline';
  }, [shuttleLive, trip?.status]);

  const fetchLocation = async (isManual = false) => {
    if (isManual) setIsLoading(true);
    try {
      const live = await refreshShuttleLive();
      let lat;
      let lng;
      if (trip?.date && tripId) {
        const res = await axios.get('/trips', { params: { date: trip.date } });
        if (res.data.success) {
          const freshTrip = res.data.trips.find((x) => x.id === tripId);
          lat = freshTrip?.lat;
          lng = freshTrip?.lng;
        }
      }
      const fromShuttle =
        live?.lat != null && live?.lng != null
          ? { latitude: live.lat, longitude: live.lng }
          : null;
      const fromTrip = lat != null && lng != null ? { latitude: lat, longitude: lng } : null;
      const next = fromShuttle || fromTrip;
      if (next) {
        setDriverLocation(next);
        setLastUpdated(new Date());
        mapRef.current?.animateToRegion(
          {
            ...next,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          },
          1000
        );
      }
      if (next) {
        // Recover resident location when app resumes/backgrounds.
        if (!residentLocation) {
          try {
            const lastKnown = await Location.getLastKnownPositionAsync();
            if (lastKnown?.coords) {
              setResidentLocation({
                latitude: lastKnown.coords.latitude,
                longitude: lastKnown.coords.longitude,
              });
            }
          } catch (_) {}
        }

        const shouldRefreshEta = Date.now() - etaTsRef.current > 30000 || isManual;

        // Preferred: resident's real-time location.
        if (residentLocation) {
          const km = haversineKm(next, residentLocation);
          let eta = residentEta?.etaText || '--';
          if (shouldRefreshEta) {
            const matrix = await fetchDistanceMatrix({
              origin: next,
              destination: residentLocation,
            });
            if (matrix?.durationText) {
              eta = matrix.durationText;
              etaTsRef.current = Date.now();
            } else if (Number.isFinite(km)) {
              // Fallback estimate ~22km/h urban shuttle average.
              eta = formatDuration((km / 22) * 3600);
            }
          }
          setResidentEta({
            distanceText: formatDistance(km),
            etaText: eta,
          });
          setEtaHint('');
          setEtaLabel('YOU');
          return;
        }

        // Fallback: if resident location permission denied, show ETA to pickup point text.
        if (trip?.origin) {
          let distanceText = residentEta?.distanceText || '--';
          let etaText = residentEta?.etaText || '--';
          if (shouldRefreshEta) {
            const matrix = await fetchDistanceMatrix({
              origin: next,
              destination: trip.origin,
            });
            if (matrix?.distanceText) distanceText = matrix.distanceText;
            if (matrix?.durationText) etaText = matrix.durationText;
            etaTsRef.current = Date.now();
          }
          setResidentEta({ distanceText, etaText });
          setEtaLabel('PICKUP');
          setEtaHint(
            distanceText === '--' || etaText === '--'
              ? 'Enable location permission for exact distance to YOU.'
              : ''
          );
        }
      }
    } catch (err) {
      console.warn('Polling error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const registerPolling = () => {
    pollRef.current = setTimeout(async () => {
      await fetchLocation();
      if (pollRef.current) registerPolling();
    }, 4000);
  };

  useEffect(() => {
    const getResidentLocation = async () => {
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (perm.status !== 'granted') {
          const asked = await Location.requestForegroundPermissionsAsync();
          if (asked.status !== 'granted') return;
        }
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setResidentLocation({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });
      } catch (_) {}
    };
    getResidentLocation();
  }, []);

  useEffect(() => {
    fetchLocation();
    registerPolling();
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
      pollRef.current = null;
    };
  }, [tripId, trip?.date]);

  useEffect(() => {
    if (shuttleLive?.lat != null && shuttleLive?.lng != null) {
      const next = { latitude: shuttleLive.lat, longitude: shuttleLive.lng };
      setDriverLocation(next);
      setLastUpdated(new Date());
    }
  }, [shuttleLive?.lat, shuttleLive?.lng]);

  const statusLabel = () => {
    if (liveStatus === 'paused') return t('tenant.tracking_paused') || 'Shuttle paused';
    if (liveStatus === 'active') return t('tenant.driver_on_route') || 'Shuttle live';
    return t('tenant.tracking_offline') || 'Shuttle offline';
  };

  // Avoid false "Trip Completed" popup when user only opens Track Live.
  const showCompletedModal =
    shouldShowCompletionPopup && trip?.status === 'completed' && tripId && !shuttleOnly;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={styles.header} edges={['top']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('TenantMain')}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.black} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('tenant.live_map') || 'Live shuttle'}</Text>
          <View style={styles.statusRow}>
            {liveStatus === 'active' ? (
              <>
                <View style={styles.liveIndicator} />
                <Text style={styles.statusText}>{statusLabel()}</Text>
              </>
            ) : liveStatus === 'paused' ? (
              <Text style={[styles.statusText, { color: COLORS.warning }]}>{statusLabel()}</Text>
            ) : (
              <Text style={[styles.statusText, { color: COLORS.gray[300] }]}>{statusLabel()}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchLocation(true)}>
          <MaterialCommunityIcons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </SafeAreaView>

      <MapView
        ref={mapRef}
        style={styles.map}
        mapType="standard"
        initialRegion={
          driverLocation
            ? { ...driverLocation, latitudeDelta: 0.015, longitudeDelta: 0.015 }
            : { latitude: 20.5937, longitude: 78.9629, latitudeDelta: 5.0, longitudeDelta: 5.0 }
        }
        showsUserLocation
        showsTraffic
      >
        {driverLocation && driverLocation.latitude && driverLocation.longitude && (
          <Marker coordinate={driverLocation} title="Shuttle" description={statusLabel()}>
            <View style={styles.busMarker}>
              <MaterialCommunityIcons name="bus-side" size={26} color={COLORS.white} />
            </View>
          </Marker>
        )}
      </MapView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('tenant.waiting_location') || 'Waiting for shuttle location...'}</Text>
        </View>
      )}

      <View style={styles.bottomCard}>
        {trip ? (
          <>
            <View style={styles.routeRow}>
              <View style={styles.routeNode}>
                <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
                <View style={styles.line} />
                <View style={[styles.dot, { backgroundColor: COLORS.accent }]} />
              </View>
              <View style={styles.routeLabels}>
                <Text style={styles.routePlace}>{trip.origin}</Text>
                <Text style={styles.routePlace}>{trip.destination}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.primary} />
                <View>
                  <Text style={styles.infoLabel}>DEPARTURE</Text>
                  <Text style={styles.infoValue}>{trip.time}</Text>
                </View>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="account-group-outline" size={16} color={COLORS.primary} />
                <View>
                  <Text style={styles.infoLabel}>SEATS</Text>
                  <Text style={styles.infoValue}>{trip.seats_remaining} left</Text>
                </View>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="update" size={16} color={COLORS.primary} />
                <View>
                  <Text style={styles.infoLabel}>UPDATED</Text>
                  <Text style={styles.infoValue}>
                    {lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                  </Text>
                </View>
              </View>
            </View>
            {!!residentEta && (
              <View style={styles.youCard}>
                <MaterialCommunityIcons name="map-marker-distance" size={16} color={COLORS.primary} />
                <Text style={styles.youText}>
                  {etaLabel}: {residentEta.distanceText} away · ETA {residentEta.etaText}
                </Text>
              </View>
            )}
            {!!etaHint && <Text style={styles.etaHintText}>{etaHint}</Text>}
          </>
        ) : (
          <View style={{ gap: 12 }}>
            <Text style={styles.genericTitle}>{t('tenant.campus_shuttle') || 'Campus shuttle'}</Text>
            <Text style={styles.genericSub}>
              {t('tenant.live_map_blurb') ||
                'Live position is shared whenever a driver is on shift with tracking enabled. You do not need an active booking to view the map.'}
            </Text>
            <View style={styles.pillRow}>
              <View style={styles.pill}>
                <Text style={styles.pillTxt}>{statusLabel()}</Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillTxt}>
                  {lastUpdated
                    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '--'}
                </Text>
              </View>
            </View>
            {!!residentEta && (
              <View style={styles.youCard}>
                <MaterialCommunityIcons name="map-marker-distance" size={16} color={COLORS.primary} />
                <Text style={styles.youText}>
                  {etaLabel}: {residentEta.distanceText} away · ETA {residentEta.etaText}
                </Text>
              </View>
            )}
            {!!etaHint && <Text style={styles.etaHintText}>{etaHint}</Text>}
          </View>
        )}
      </View>

      <Modal visible={showCompletedModal && !isDismissed} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.completionCard}>
             <View style={styles.checkInner}>
                <MaterialCommunityIcons name="check-bold" size={40} color={COLORS.white} />
             </View>
             <Text style={styles.completionTitle}>{t('tenant.trip_finished') || 'Trip Completed!'}</Text>
             <Text style={styles.completionSub}>{t('tenant.hope_enjoyed') || 'We hope you had a pleasant ride with Morgan Shuttle.'}</Text>
             <Button
               title={t('common.done') || 'Dismiss'}
               onPress={() => {
                 setIsDismissed(true);
                 if (pollRef.current) clearTimeout(pollRef.current);
                 if (navigation.canGoBack()) {
                   navigation.goBack();
                 } else {
                   navigation.navigate('TenantMain');
                 }
               }}
               style={{ width: '100%', marginTop: 10 }}
             />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12,
    backgroundColor: COLORS.white, zIndex: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
    elevation: 4,
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '900', color: COLORS.black, letterSpacing: -0.3 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  liveIndicator: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22c55e' },
  statusText: { fontSize: 11, fontWeight: '700', color: '#22c55e', letterSpacing: 0.5 },
  refreshBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' },
  map: { flex: 1 },
  busMarker: {
    backgroundColor: COLORS.primary, borderRadius: 20, width: 40, height: 40,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: COLORS.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
    elevation: 6,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center', alignItems: 'center', gap: 15,
  },
  loadingText: { fontSize: 14, fontWeight: '700', color: COLORS.gray[300] },
  bottomCard: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 25, paddingBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.08, shadowRadius: 12,
    elevation: 10,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 25 },
  routeNode: { alignItems: 'center', gap: 3 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  line: { width: 2, height: 22, backgroundColor: COLORS.gray[100] },
  routeLabels: { gap: 14 },
  routePlace: { fontSize: 16, fontWeight: '900', color: COLORS.black, letterSpacing: -0.3 },
  infoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 20, padding: 18 },
  infoItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoDivider: { width: 1, height: 30, backgroundColor: COLORS.gray[100] },
  infoLabel: { fontSize: 8, fontWeight: '900', color: COLORS.gray[300], letterSpacing: 1.5, textTransform: 'uppercase' },
  infoValue: { fontSize: 13, fontWeight: '900', color: COLORS.black, marginTop: 2 },
  youCard: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: COLORS.primary + '12',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  youText: { fontSize: 12, fontWeight: '800', color: COLORS.black },
  etaHintText: { marginTop: 8, fontSize: 11, fontWeight: '700', color: COLORS.gray[300] },
  genericTitle: { fontSize: 18, fontWeight: '900', color: COLORS.black },
  genericSub: { fontSize: 13, color: COLORS.gray[300], lineHeight: 20, fontWeight: '600' },
  pillRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: COLORS.background },
  pillTxt: { fontSize: 12, fontWeight: '800', color: COLORS.black },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  completionCard: { backgroundColor: COLORS.white, borderRadius: 32, padding: 30, alignItems: 'center', width: '100%', gap: 15 },
  checkInner: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  completionTitle: { fontSize: 24, fontWeight: '900', color: COLORS.black, letterSpacing: -0.5 },
  completionSub: { fontSize: 14, color: COLORS.gray[300], textAlign: 'center', lineHeight: 22, marginBottom: 10, fontWeight: '600' },
});
