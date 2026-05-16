import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Alert, Modal, TextInput, Platform, Image, KeyboardAvoidingView, ScrollView, Switch, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobal }  from '../../store/GlobalContext';
import { Badge }      from '../../components/shared/Badge';
import { Button }     from '../../components/shared/Button';
import { COLORS, SHADOWS } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import { deriveShuttleStatus, SHUTTLE_STATUS } from '../../services/shuttleService';
import { fetchDistanceMatrix } from '../../services/etaService';
import { LOCATION_TASK_NAME } from '../../services/backgroundLocation';

export const DriverHomeScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const {
    trips,
    logTripCompletion,
    startTrip,
    fetchTrips,
    driverSession,
    startDriverShift,
    endDriverShift,
    setDriverTrackingEnabled,
    setDriverTrackingPaused,
    postShuttleDriverLocation,
    shuttleLive,
  } = useGlobal();
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [passengerCount, setPassengerCount] = useState('');
  const [notes, setNotes] = useState('');
  const [shiftBusy, setShiftBusy] = useState(false);
  const [tripEtaById, setTripEtaById] = useState({});

  const pingRef = useRef(null);
  const etaTsRef = useRef(0);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayTrips = (trips || [])
    .filter(t => t && t.date === todayStr)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const assignedBookingsCount = todayTrips.reduce((acc, tr) => acc + (tr.bookings?.length || 0), 0);
  const seatsBookedToday = todayTrips.reduce(
    (acc, tr) => acc + ((tr.seats_total ?? 7) - (tr.seats_remaining ?? 7)),
    0
  );

  const trackingStatus = deriveShuttleStatus({
    shiftActive: driverSession.shiftActive,
    trackingEnabled: driverSession.trackingEnabled,
    paused: driverSession.paused,
  });
  const shuttleCoord =
    shuttleLive?.lat != null && shuttleLive?.lng != null
      ? { latitude: Number(shuttleLive.lat), longitude: Number(shuttleLive.lng) }
      : null;

  useEffect(() => {
    const estimateTripEta = async () => {
      if (!shuttleCoord) return;
      if (Date.now() - etaTsRef.current < 30000) return;

      const targets = todayTrips.filter((x) => x && x.status !== 'completed').slice(0, 3);
      if (!targets.length) return;

      const nextMap = {};
      for (const trip of targets) {
        let distanceText = null;
        let etaText = null;
        const matrix = await fetchDistanceMatrix({ origin: shuttleCoord, destination: trip.origin });
        if (matrix?.distanceText && matrix?.durationText) {
          distanceText = matrix.distanceText;
          etaText = matrix.durationText;
        } else {
          // Fallback using straight-line estimate from current shuttle to pickup text unavailable.
          // Keep this as "route estimate unavailable" to avoid fake precision.
          distanceText = null;
          etaText = null;
        }
        nextMap[trip.id] = {
          distanceText,
          etaText,
          pickup: trip.origin,
        };
      }

      etaTsRef.current = Date.now();
      setTripEtaById((prev) => ({ ...prev, ...nextMap }));
    };
    estimateTripEta();
  }, [shuttleCoord?.latitude, shuttleCoord?.longitude, todayTrips]);

  // Shift-based live GPS (Foreground + Background)
  const watcherRef = useRef(null);

  useEffect(() => {
    const shouldPing =
      driverSession.shiftActive && driverSession.trackingEnabled && !driverSession.paused;

    const stopTracking = async () => {
      try {
        // Stop background task
        const hasTask = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (hasTask) {
          await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
          console.log('Background location tracking stopped.');
        }
        // Stop foreground watcher
        if (watcherRef.current) {
          watcherRef.current.remove();
          watcherRef.current = null;
        }
      } catch (err) {
        console.warn('Failed to stop tracking:', err?.message);
      }
    };

    const startTracking = async () => {
      try {
        // 1. Foreground Permission Check
        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
        if (fgStatus !== 'granted') {
          console.warn('Foreground location permission denied');
          return;
        }

        // 2. Start Foreground Watcher (Reliable while app is open)
        if (!watcherRef.current) {
          watcherRef.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 5000,
              distanceInterval: 5,
            },
            (loc) => {
              const { latitude, longitude } = loc.coords;
              postShuttleDriverLocation(latitude, longitude);
            }
          );
          console.log('Foreground watcher started.');
        }

        // 3. Optional Background Permission Check
        const { status: bgStatus } = await Location.getBackgroundPermissionsAsync();
        if (bgStatus === 'granted') {
          const isTaskDefined = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
          if (!isTaskDefined) {
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
              accuracy: Location.Accuracy.High,
              timeInterval: 5000,
              distanceInterval: 5,
              showsBackgroundLocationIndicator: true,
              foregroundService: {
                notificationTitle: "Morgan Shuttle Tracking",
                notificationBody: "Your location is being shared with passengers.",
                notificationColor: "#1e3a8a",
              },
              pausesLocationUpdatesAutomatically: false,
            });
            console.log('Background task started.');
          }
        }
      } catch (err) {
        console.warn('Shuttle GPS start error:', err?.message);
      }
    };

    if (shouldPing) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      // Don't stop tracking on unmount to allow background persistence
    };
  }, [
    driverSession.shiftActive,
    driverSession.trackingEnabled,
    driverSession.paused,
  ]);

  const ensureLocationPermission = async () => {
    // 1. Request Foreground First
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') {
      Alert.alert(
        t('common.error'), 
        t('driver.location_required') || 'Location permission is required for shuttle tracking.'
      );
      return false;
    }

    // 2. Request Background AFTER Foreground (Important for Android 11+)
    if (Platform.OS === 'android') {
      const { status: bgStatus } = await Location.getBackgroundPermissionsAsync();
      if (bgStatus !== 'granted') {
        // Show a helpful message before taking them to the system permission page
        Alert.alert(
          'Enable Background Tracking',
          'To keep tracking active even when the app is closed, please select "Allow all the time" in the next screen.',
          [
            { text: 'Later', style: 'cancel' },
            { 
              text: 'OK', 
              onPress: async () => {
                await Location.requestBackgroundPermissionsAsync();
              }
            }
          ]
        );
      }
    }
    return true;
  };

  const handleToggleShift = async () => {
    if (driverSession.shiftActive) {
      Alert.alert(
        t('driver.end_shift_title') || 'End shift?',
        t('driver.end_shift_msg') || 'Shuttle tracking will stop for residents.',
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('driver.end_shift') || 'End shift',
            style: 'destructive',
            onPress: async () => {
              setShiftBusy(true);
              try {
                await endDriverShift();
              } finally {
                setShiftBusy(false);
              }
            },
          },
        ]
      );
      return;
    }
    const ok = await ensureLocationPermission();
    if (!ok) return;
    setShiftBusy(true);
    try {
      await startDriverShift();
    } finally {
      setShiftBusy(false);
    }
  };

  const handleStartTrip = async (trip) => {
    const ok = await ensureLocationPermission();
    if (!ok) return;
    const confirmedResidents = (trip?.bookings || []).filter((b) => b?.status === 'confirmed').length;
    if (confirmedResidents <= 0) {
      Alert.alert(
        t('common.error'),
        t('driver.no_resident_booking') || 'No resident booking found for this ride yet.'
      );
      return;
    }
    try {
      await startTrip(trip.id);
      Alert.alert(
        t('common.success'),
        t('driver.trip_started_manifest') || 'Trip marked as in progress. Live location follows your shift & tracking settings.'
      );
    } catch (error) {
      Alert.alert(t('common.error'), error?.message || t('driver.start_trip_failed') || 'Unable to start trip.');
    }
  };

  const handleLog = async () => {
    if (!selectedTrip?.id) return;
    const count = parseInt(passengerCount) || 0;
    if (count < 0 || count > 7) return Alert.alert(t('common.error'), t('driver.invalid_pax'));
    const confirmedResidents = (selectedTrip?.bookings || []).filter((b) => b?.status === 'confirmed').length;
    if (confirmedResidents <= 0) {
      Alert.alert(
        t('common.error'),
        t('driver.no_resident_booking') || 'No resident booking found for this ride yet.'
      );
      return;
    }
    try {
      await logTripCompletion(selectedTrip.id, count, notes);
      setSelectedTrip(null);
      setPassengerCount('');
      setNotes('');
      Alert.alert(t('common.success'), t('driver.trip_logged'));
    } catch (error) {
      Alert.alert(t('common.error'), error?.message || t('driver.complete_log_failed') || 'Unable to submit complete log.');
    }
  };

  const completedCount = todayTrips.filter(t => t.status === 'completed').length;
  const totalPax = todayTrips.reduce((acc, t) => acc + (t.actual_passengers || 0), 0);

  const statusLabel = () => {
    if (!driverSession.shiftActive) return t('driver.status_offline') || 'Offline';
    if (driverSession.paused) return t('driver.status_paused') || 'Paused';
    if (!driverSession.trackingEnabled) return t('driver.tracking_off') || 'Tracking off';
    return t('driver.status_active') || 'Active';
  };

  const renderTrip = ({ item }) => {
    const isDone = item.status === 'completed';
    const isRunning = item.status === 'in_progress';
    const isSpecial = item.is_special;

    return (
      <View style={[
        styles.tripCard,
        isDone && styles.tripCardDone,
        isRunning && styles.tripCardRunning
      ]}>
        <View style={styles.cardTop}>
          <View style={[styles.timeTag, isRunning && { backgroundColor: COLORS.secondary }]}>
            <MaterialCommunityIcons 
              name={isRunning ? "map-marker-path" : "clock-outline"} 
              size={14} 
              color={isRunning ? COLORS.white : COLORS.primary} 
            />
            <Text style={[styles.timeTagText, isRunning && { color: COLORS.white }]}>{item.time}</Text>
          </View>
          
          <View style={styles.typeTag}>
             {isSpecial && <MaterialCommunityIcons name="star" size={12} color={COLORS.gold} style={{marginRight: 4}} />}
             <Text style={[styles.typeTagText, isSpecial && { color: COLORS.gold }]}>
               {isDone ? 'COMPLETED' : (isSpecial ? 'PRIORITY' : 'REGULAR')}
             </Text>
          </View>
        </View>

        <View style={styles.routeMain}>
          <View style={styles.routeIcons}>
            <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
            <View style={styles.line} />
            <View style={[styles.dot, { backgroundColor: COLORS.secondary }]} />
          </View>
          
          <View style={styles.routeInfo}>
            <Text style={[styles.routePlace, isDone && { color: COLORS.gray[300] }]} numberOfLines={1}>{item.origin}</Text>
            <Text style={[styles.routePlace, isDone && { color: COLORS.gray[300] }]} numberOfLines={1}>{item.destination}</Text>
          </View>

          {!isDone && (
            <TouchableOpacity 
              style={[styles.quickAction, isRunning ? { backgroundColor: COLORS.secondary } : { backgroundColor: COLORS.primary }]} 
              onPress={() => isRunning ? setSelectedTrip(item) : handleStartTrip(item)}
            >
              <MaterialCommunityIcons 
                name={isRunning ? "check-circle" : "arrow-right"} 
                size={22} 
                color={COLORS.white} 
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.paxInfo}>
            <MaterialCommunityIcons name="account-group" size={14} color={COLORS.gray[300]} />
            <Text style={styles.paxText}>
              {isDone ? `${item.actual_passengers} Carried` : `${item.seats_total - item.seats_remaining} Expected`}
            </Text>
          </View>

          {isSpecial && (
             <View style={styles.customerName}>
               <Text style={styles.customerText}>{item.tenant_name}</Text>
             </View>
          )}

          {!isSpecial && item.bookings?.length > 0 && (
            <Text style={styles.ridersSummary} numberOfLines={1}>
              {item.bookings.length} Bookings
            </Text>
          )}

          {!isDone && tripEtaById[item.id]?.distanceText && tripEtaById[item.id]?.etaText && (
            <View style={styles.etaChip}>
              <MaterialCommunityIcons name="map-marker-distance" size={13} color={COLORS.primary} />
              <Text style={styles.etaChipText}>
                To pickup: {tripEtaById[item.id].distanceText} · ETA {tripEtaById[item.id].etaText}
              </Text>
            </View>
          )}
        </View>

        {!isDone && isRunning && (
           <TouchableOpacity 
             style={styles.floatingCompleteBtn}
             onPress={() => setSelectedTrip(item)}
           >
             <MaterialCommunityIcons name="flag-checkered" size={16} color={COLORS.white} />
             <Text style={styles.floatingCompleteText}>COMPLETE RIDE</Text>
           </TouchableOpacity>
        )}
      </View>
    );
  };



  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <FlatList
        data={todayTrips}
        renderItem={renderTrip}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <View style={styles.topBanner}>
              <SafeAreaView edges={['top']}>
                <View style={styles.headerRow}>
                  <Image
                    source={require('../../../assets/image.png')}
                    style={[styles.headerLogo, { tintColor: COLORS.white }]}
                    resizeMode="contain"
                  />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity style={styles.notificationBtn} onPress={() => fetchTrips()}>
                      <MaterialCommunityIcons name="refresh" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.notificationBtn} onPress={() => navigation.navigate('Notifications')}>
                      <MaterialCommunityIcons name="bell-badge-outline" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.greetingBox}>
                  <Text style={styles.greetText}>{t('driver.daily_manifest')}</Text>
                  <Text style={styles.tagline}>{format(new Date(), 'EEEE, MMMM dd')}</Text>
                </View>
              </SafeAreaView>
            </View>

            <View style={styles.statsRow}>
               <View style={styles.statItem}>
                 <Text style={styles.statTitle}>{todayTrips.length}</Text>
                 <Text style={styles.statSub}>Total</Text>
               </View>
               <View style={styles.statDivider} />
               <View style={styles.statItem}>
                 <Text style={styles.statTitle}>{completedCount}</Text>
                 <Text style={styles.statSub}>Done</Text>
               </View>
               <View style={styles.statDivider} />
               <View style={styles.statItem}>
                 <Text style={styles.statTitle}>{totalPax}</Text>
                 <Text style={styles.statSub}>Pax</Text>
               </View>
            </View>

            <View style={styles.masterControl}>
               <View style={styles.controlTop}>
                 <View style={styles.statusChip}>
                    <View style={[styles.statusDot, { backgroundColor: driverSession.shiftActive ? '#22c55e' : '#ef4444' }]} />
                    <Text style={styles.statusLabel}>{statusLabel().toUpperCase()}</Text>
                 </View>
                 <TouchableOpacity 
                   style={[styles.shiftBtn, driverSession.shiftActive ? styles.shiftBtnOff : styles.shiftBtnOn]}
                   onPress={handleToggleShift}
                   disabled={shiftBusy}
                 >
                   <Text style={styles.shiftBtnText}>
                     {driverSession.shiftActive ? 'OFF-DUTY' : 'ON-DUTY'}
                   </Text>
                 </TouchableOpacity>
               </View>

               <View style={styles.togglesRow}>
                 <View style={styles.toggleCell}>
                   <MaterialCommunityIcons name="crosshairs-gps" size={16} color={driverSession.trackingEnabled ? COLORS.primary : COLORS.gray[300]} />
                   <Text style={styles.toggleText}>TRACKING</Text>
                   <Switch
                      value={driverSession.trackingEnabled}
                      onValueChange={async (v) => {
                        if (v && !driverSession.shiftActive) {
                          Alert.alert(t('common.error'), t('driver.start_shift_first'));
                          return;
                        }
                        await setDriverTrackingEnabled(v);
                      }}
                      scaleX={0.8} scaleY={0.8}
                      thumbColor={COLORS.white}
                      trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
                    />
                 </View>
                 <View style={styles.toggleDivider} />
                 <View style={styles.toggleCell}>
                   <MaterialCommunityIcons name="pause-circle-outline" size={16} color={driverSession.paused ? COLORS.gold : COLORS.gray[300]} />
                   <Text style={styles.toggleText}>PAUSED</Text>
                   <Switch
                      value={driverSession.paused}
                      onValueChange={async (v) => {
                        if (v && !driverSession.shiftActive) return;
                        await setDriverTrackingPaused(v);
                      }}
                      scaleX={0.8} scaleY={0.8}
                      thumbColor={COLORS.white}
                      trackColor={{ false: '#D1D5DB', true: COLORS.gold }}
                    />
                 </View>
               </View>
            </View>

            <Text style={styles.sectionTitle}>{t('driver.your_manifest')}</Text>
          </>
        }
        ListEmptyComponent={<Text style={styles.empty}>{t('driver.no_trips_today')}</Text>}
      />



      <Modal visible={!!selectedTrip} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.overlay}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setSelectedTrip(null)} />
            <View style={styles.modalWrap}>
              <View style={styles.modal}>
                <ScrollView
                  contentContainerStyle={{ paddingBottom: 18 }}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.modalTitle}>{t('driver.complete_ride')}</Text>
                  <Text style={styles.modalSub}>{selectedTrip?.time}: {selectedTrip?.origin} → {selectedTrip?.destination}</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('driver.actual_passengers')}</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={passengerCount}
                      onChangeText={setPassengerCount}
                      placeholder="..."
                      returnKeyType="done"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('driver.notes_issues')}</Text>
                    <TextInput
                      style={[styles.input, { height: 100 }]}
                      multiline
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="..."
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={styles.actions}>
                    <Button title={t('common.back')} type="secondary" onPress={() => setSelectedTrip(null)} style={{ flex: 1 }} />
                    <Button title={t('driver.complete_log')} onPress={handleLog} style={{ flex: 2, marginLeft: 15 }} />
                  </View>
                </ScrollView>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBanner: { 
    backgroundColor: COLORS.primary, 
    paddingBottom: 60, 
    borderBottomLeftRadius: 35, 
    borderBottomRightRadius: 35,
    zIndex: 1
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginTop: 10 },
  headerLogo: { width: 100, height: 32 },
  notificationBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  greetingBox: { paddingHorizontal: 25, marginTop: 20, marginBottom: 10 },
  greetText: { fontSize: 24, fontWeight: '900', color: COLORS.white, letterSpacing: -0.5 },
  tagline: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  
  // Minimalist Stats
  statsRow: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.white, 
    marginHorizontal: 25, 
    marginTop: -35, 
    borderRadius: 20, 
    padding: 20, 
    alignItems: 'center',
    zIndex: 10,
    ...SHADOWS.soft 
  },
  statItem: { flex: 1, alignItems: 'center' },
  statTitle: { fontSize: 18, fontWeight: '900', color: COLORS.black },
  statSub: { fontSize: 9, color: COLORS.gray[300], fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  statDivider: { width: 1, height: 25, backgroundColor: COLORS.gray[100] },

  // Master Control Card (Shift/Tracking)
  masterControl: {
    marginHorizontal: 25,
    marginTop: 20,
    marginBottom: 25,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 18,
    ...SHADOWS.soft,
  },
  controlTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  statusChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 30 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  statusLabel: { fontSize: 9, fontWeight: '800', color: COLORS.black },
  shiftBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  shiftBtnOn: { backgroundColor: COLORS.secondary },
  shiftBtnOff: { backgroundColor: '#ef4444' },
  shiftBtnText: { color: COLORS.white, fontSize: 10, fontWeight: '900' },
  
  togglesRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.gray[100], paddingTop: 15 },
  toggleCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleText: { fontSize: 9, fontWeight: '800', color: COLORS.gray[300] },
  toggleDivider: { width: 1, height: 20, backgroundColor: COLORS.gray[100], marginHorizontal: 15 },

  // Trip Cards - Sleek Detail
  list: { paddingBottom: 60 },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: COLORS.black, marginBottom: 15, marginHorizontal: 25 },
  tripCard: { 
    backgroundColor: COLORS.white, 
    borderRadius: 24, 
    padding: 18, 
    marginBottom: 16, 
    marginHorizontal: 25,
    ...SHADOWS.soft 
  },
  tripCardDone: { opacity: 0.5 },
  tripCardRunning: { borderColor: COLORS.secondary, borderWidth: 1.5 },
  
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  timeTag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.background, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  timeTagText: { fontSize: 13, fontWeight: '900', color: COLORS.primary },
  typeTag: { flexDirection: 'row', alignItems: 'center' },
  typeTagText: { fontSize: 9, fontWeight: '900', color: COLORS.gray[300] },

  routeMain: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 15 },
  routeIcons: { alignItems: 'center', gap: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  line: { width: 2, height: 20, backgroundColor: COLORS.gray[100] },
  routeInfo: { flex: 1, gap: 10 },
  routePlace: { fontSize: 15, fontWeight: '900', color: COLORS.black },
  quickAction: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center', ...SHADOWS.soft },

  cardBottom: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingTop: 12, 
    borderTopWidth: 1, 
    borderTopColor: COLORS.gray[100] 
  },
  paxInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  paxText: { fontSize: 10, fontWeight: '700', color: COLORS.gray[300] },
  customerName: { backgroundColor: COLORS.gold + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  customerText: { fontSize: 10, fontWeight: '800', color: COLORS.gold },
  ridersSummary: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  etaChip: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '12',
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  etaChipText: { fontSize: 10, fontWeight: '800', color: COLORS.black },

  floatingCompleteBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    backgroundColor: COLORS.secondary, 
    paddingVertical: 12, 
    borderRadius: 15, 
    marginTop: 15 
  },
  floatingCompleteText: { color: COLORS.white, fontSize: 10, fontWeight: '900' },

  empty: { textAlign: 'center', marginTop: 40, color: COLORS.gray[300], fontSize: 14, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalWrap: { width: '100%', maxHeight: '80%' },
  modal: { backgroundColor: COLORS.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 25 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.black, marginBottom: 5 },
  modalSub: { fontSize: 11, color: COLORS.gray[300], marginBottom: 20, fontWeight: '700' },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 10, fontWeight: '900', color: COLORS.gray[300], marginBottom: 8 },
  input: { backgroundColor: COLORS.background, borderRadius: 14, padding: 15, fontSize: 14, color: COLORS.black, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
});
