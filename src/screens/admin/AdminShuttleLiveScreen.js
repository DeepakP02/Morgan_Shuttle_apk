import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Constants from 'expo-constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useGlobal } from '../../store/GlobalContext';
import { fetchAdminShuttleDrivers, SHUTTLE_STATUS } from '../../services/shuttleService';
import axios from 'axios';

export const AdminShuttleLiveScreen = ({ navigation }) => {
  const isExpoGo = Constants.appOwnership === 'expo';
  const { shuttleLive, refreshShuttleLive, mockUsers, hasPermission, RESOURCES } = useGlobal();
  const [drivers, setDrivers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const mapRef = useRef(null);

  const canSee = hasPermission(RESOURCES.ADMIN_LIVE, 'view');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await refreshShuttleLive();
      const remote = await fetchAdminShuttleDrivers(axios);
      if (remote) {
        setDrivers(remote);
        if (selectedDriver?.id) {
          const freshSelected = remote.find((d) => d.id === selectedDriver.id) || null;
          setSelectedDriver(freshSelected);
        }
      } else {
        const local = (mockUsers || [])
          .filter((u) => u && (u.role === 'driver' || u.role === 'staff'))
          .map((u) => ({
            id: u.id,
            name: u.name,
            shift_active: false,
            tracking: false,
            paused: false,
          }));
        setDrivers(local);
      }
      setLoading(false);
    };
    load();
    const id = setInterval(async () => {
      await refreshShuttleLive();
      const remote = await fetchAdminShuttleDrivers(axios);
      if (remote) setDrivers(remote);
    }, 5000);
    return () => clearInterval(id);
  }, [refreshShuttleLive, mockUsers]);

  const coord = useMemo(() => {
    if (shuttleLive?.lat != null && shuttleLive?.lng != null) {
      return { latitude: shuttleLive.lat, longitude: shuttleLive.lng };
    }
    return null;
  }, [shuttleLive?.lat, shuttleLive?.lng]);
  const liveDriverMarkers = useMemo(
    () =>
      (drivers || []).filter(
        (d) => d?.lat != null && d?.lng != null && d?.shift_active && d?.tracking && !d?.paused
      ),
    [drivers]
  );

  useEffect(() => {
    if (coord && mapRef.current) {
      mapRef.current.animateToRegion(
        { ...coord, latitudeDelta: 0.04, longitudeDelta: 0.04 },
        700
      );
    }
  }, [coord?.latitude, coord?.longitude]);

  const statusText = () => {
    if (!shuttleLive) return 'Loading…';
    if (shuttleLive.status === SHUTTLE_STATUS.PAUSED) return 'Paused';
    if (shuttleLive.status === SHUTTLE_STATUS.ACTIVE || (shuttleLive.shiftActive && shuttleLive.trackingOn)) return 'Active';
    return 'Offline';
  };
  const getShortId = (id) => {
    const text = String(id || '').trim();
    if (!text) return 'NA';
    return text.length > 6 ? text.slice(-6).toUpperCase() : text.toUpperCase();
  };

  const renderDriver = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.driverCard, SHADOWS.soft, selectedDriver?.id === item.id && styles.driverCardActive]}
      onPress={() => setSelectedDriver(item)}
    >
      <View style={styles.driverIcon}>
        <MaterialCommunityIcons name="account-tie" size={22} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.driverName}>{item.name || 'Driver'}</Text>
          <View style={styles.idChip}>
            <Text style={styles.idChipText}>#{getShortId(item.id)}</Text>
          </View>
        </View>
        <Text style={styles.driverMeta}>
          {(item.role || 'driver').toUpperCase()} ·
          Shift: {item.shift_active ? 'Active' : 'Inactive'} · Tracking: {item.tracking ? 'On' : 'Off'}
          {item.paused ? ' · Paused' : ''}
        </Text>
        <Text style={styles.driverMeta}>
          Shuttle: {item.shuttle_id || 'Not assigned'}
        </Text>
      </View>
      <View
        style={[
          styles.dot,
          { backgroundColor: item.tracking && item.shift_active && !item.paused ? '#22c55e' : COLORS.gray[200] },
        ]}
      />
    </TouchableOpacity>
  );

  if (!canSee) {
    return (
      <View style={styles.centered}>
        <Text style={styles.denied}>You do not have access to live monitoring.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topBanner}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('AdminMain'))}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>LIVE SHUTTLE</Text>
            <TouchableOpacity onPress={() => refreshShuttleLive()}>
              <MaterialCommunityIcons name="refresh" size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.mapWrap}>
        {loading ? (
          <View style={styles.mapLoading}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            mapType="standard"
            initialRegion={
              coord
                ? { ...coord, latitudeDelta: 0.04, longitudeDelta: 0.04 }
                : { latitude: 20.5937, longitude: 78.9629, latitudeDelta: 5.0, longitudeDelta: 5.0 }
            }
            showsUserLocation
            showsTraffic
          >
            {liveDriverMarkers.map((d) => (
              d.lat && d.lng && (
                <Marker
                  key={`driver-${d.id}`}
                  coordinate={{ latitude: Number(d.lat), longitude: Number(d.lng) }}
                  title={d.name || 'Driver'}
                  description={`Shuttle: ${d.shuttle_id || 'N/A'} · #${getShortId(d.id)}`}
                  onPress={() => setSelectedDriver(d)}
                >
                  <View style={styles.bus}>
                    <MaterialCommunityIcons name="bus-side" size={20} color={COLORS.white} />
                  </View>
                </Marker>
              )
            ))}
            {coord && coord.latitude && coord.longitude && liveDriverMarkers.length === 0 && (
              <Marker coordinate={coord} title="Shuttle">
                <View style={styles.bus}>
                  <MaterialCommunityIcons name="bus-side" size={22} color={COLORS.white} />
                </View>
              </Marker>
            )}
          </MapView>
        )}
        <View style={styles.floating}>
          {selectedDriver ? (
            <>
              <Text style={styles.floatingTitle}>
                {selectedDriver.name || 'Driver'} · #{getShortId(selectedDriver.id)}
              </Text>
              <Text style={styles.floatingSub}>
                Shuttle: {selectedDriver.shuttle_id || 'Not assigned'} · {(selectedDriver.role || 'driver').toUpperCase()}
              </Text>
              <Text style={styles.floatingSub}>
                Status: {selectedDriver.shift_active ? 'Active' : 'Inactive'} / {selectedDriver.tracking ? 'Tracking On' : 'Tracking Off'}
                {selectedDriver.paused ? ' / Paused' : ''}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.floatingTitle}>Fleet status</Text>
              <Text style={styles.floatingSub}>{statusText()} · {liveDriverMarkers.length} active live</Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.listHead}>
        <Text style={styles.section}>Drivers</Text>
      </View>
      <FlatList
        data={drivers || []}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderDriver}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        ListEmptyComponent={<Text style={styles.empty}>No drivers found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  denied: { fontSize: 15, fontWeight: '700', color: COLORS.gray[300], textAlign: 'center' },
  topBanner: { backgroundColor: COLORS.primary, paddingBottom: 16, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 8 },
  headerTitle: { fontSize: 13, fontWeight: '900', color: COLORS.white, letterSpacing: 2 },
  mapWrap: { height: 280, backgroundColor: COLORS.gray[100] },
  map: { flex: 1 },
  mapLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bus: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  floating: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  floatingTitle: { fontSize: 12, fontWeight: '900', color: COLORS.black },
  floatingSub: { fontSize: 11, color: COLORS.gray[300], marginTop: 4, fontWeight: '600' },
  listHead: { paddingHorizontal: 24, paddingTop: 16 },
  section: { fontSize: 11, fontWeight: '900', color: COLORS.gray[300], letterSpacing: 2 },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  driverCardActive: { borderWidth: 1.5, borderColor: COLORS.primary + '88' },
  driverIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverName: { fontSize: 15, fontWeight: '900', color: COLORS.black },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  idChip: { backgroundColor: COLORS.primary + '15', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  idChipText: { fontSize: 9, fontWeight: '900', color: COLORS.primary, letterSpacing: 0.6 },
  driverMeta: { fontSize: 11, color: COLORS.gray[300], marginTop: 4, fontWeight: '600' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  empty: { textAlign: 'center', color: COLORS.gray[200], marginTop: 20, fontWeight: '700' },
});
