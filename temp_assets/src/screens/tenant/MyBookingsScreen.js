import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobal }     from '../../store/GlobalContext';
import { BookingCard }   from '../../components/tenant/BookingCard';
import { COLORS, SPACING, SIZES } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export const MyBookingsScreen = () => {
  const context = useGlobal();
  const { t } = useTranslation();
  const bookings = context?.bookings || []; // Safety Guard
  const trips = context?.trips || [];
  const cancelBooking = context?.cancelBooking;
  const fetchBookings = context?.fetchBookings;
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (fetchBookings) await fetchBookings();
    setRefreshing(false);
  };

  const handleCancel = (id) => {
    Alert.alert(
      t('tenant.cancel_booking_title'),
      t('tenant.cancel_booking_msg'),
      [
        { text: t('tenant.keep_it'), style: 'cancel' },
        {
          text: t('tenant.cancel_confirm'), style: 'destructive',
          onPress: async () => {
            const result = cancelBooking && await cancelBooking(id);
            if (result?.success) {
               Alert.alert(t('tenant.done'), t('tenant.cancelled_success'));
            }
          },
        },
      ]
    );
  };

  const getTripStatus = (b) => {
    const trip = trips.find((t) => t.id === b?.trip_id);
    return String(trip?.status || '').toLowerCase();
  };

  const upcoming = bookings.filter((b) => {
    if (!b) return false;
    const s = String(b.status || 'confirmed').toLowerCase();
    const tripStatus = getTripStatus(b);
    return !['cancelled', 'rejected', 'completed'].includes(s) && !['completed', 'cancelled'].includes(tripStatus);
  });
  const history = bookings.filter((b) => {
    if (!b) return false;
    const s = String(b.status || '').toLowerCase();
    const tripStatus = getTripStatus(b);
    return ['cancelled', 'rejected', 'completed'].includes(s) || ['completed', 'cancelled'].includes(tripStatus);
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topBanner}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>{t('tenant.my_bookings')}</Text>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.headerInfo}>
        <Text style={styles.title}>{t('tenant.your_journeys')}</Text>
        <Text style={styles.subtitle}>{t('tenant.track_rides')}</Text>
      </View>

      <FlatList
        data={upcoming}
        renderItem={({ item }) => <BookingCard booking={item} onCancel={handleCancel} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={upcoming.length > 0 ? <Text style={styles.sectionHeader}>{t('tenant.active_bookings')}</Text> : null}
        ListFooterComponent={
          history.length > 0 ? (
            <View style={{ marginTop: 25, opacity: 0.8 }}>
              <Text style={styles.sectionHeader}>{t('tenant.past_history')}</Text>
              {history.map(b => <BookingCard key={b.id} booking={b} onCancel={() => {}} />)}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={45} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>{t('tenant.nothing_scheduled')}</Text>
            <Text style={styles.emptySubtitle}>{t('tenant.no_rides_yet')}</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBanner: { backgroundColor: COLORS.primary, paddingBottom: 25, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 10
  },
  headerTitle: { fontSize: 13, fontWeight: '900', color: COLORS.white, letterSpacing: 2 },
  headerInfo: { padding: 30, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.black, letterSpacing: -0.5 },
  subtitle: { fontSize: 10, color: COLORS.gray[300], marginTop: 4, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  listContent: { padding: 25, paddingBottom: 100 },
  sectionHeader: { fontSize: 12, fontWeight: '900', color: COLORS.gray[300], marginBottom: 15, marginTop: 10, textTransform: 'uppercase', letterSpacing: 2 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 120, paddingHorizontal: 40 },
  emptyIconCircle: { width: 90, height: 90, borderRadius: 32, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', marginBottom: 25, borderWidth: 1, borderColor: COLORS.gray[100] },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: COLORS.black, marginBottom: 8, letterSpacing: -0.5 },
  emptySubtitle: { fontSize: 14, color: COLORS.gray[300], textAlign: 'center', lineHeight: 22, fontWeight: '700' },
});
