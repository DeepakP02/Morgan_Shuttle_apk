import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useGlobal } from '../../store/GlobalContext';

const bookingStatusMeta = (status, t) => {
  const s = String(status || '').toLowerCase();
  if (s === 'pending' || s === 'pending_approval')
    return { label: t('tenant.status_pending_approval') || 'Pending approval', color: COLORS.warning };
  if (s === 'approved' || s === 'confirmed')
    return { label: t('tenant.status_approved') || 'Approved', color: COLORS.success };
  if (s === 'rejected')
    return { label: t('tenant.rejected') || 'Rejected', color: COLORS.danger };
  if (s === 'completed')
    return { label: t('tenant.status_completed') || 'Completed', color: COLORS.gray[300] };
  if (s === 'cancelled')
    return { label: t('tenant.cancelled') || 'Cancelled', color: COLORS.gray[300] };
  return { label: (status || '').toString().toUpperCase(), color: COLORS.gray[300] };
};

export const BookingCard = ({ trip, booking, onCancel }) => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { trips, bookings, refreshShuttleLive } = useGlobal();
  const data = trip || booking;
  const isBooking = !!booking;
  
  // Check if current user already has a booking for this trip
  const isAlreadyBooked = !isBooking && bookings.some(b => b.trip_id === trip?.id);
  
  const seatsRemaining = data?.seats_remaining || 0;
  const isAvailable = seatsRemaining > 0 || isBooking;

  const liveTrip = isBooking ? trips.find(t => t.id === booking.trip_id) : (trip || null);
  const normalizedStatus = String(liveTrip?.status || trip?.status || '').toLowerCase();
  const isDone = normalizedStatus === 'completed' || normalizedStatus === 'cancelled';
  const tripInProgress = liveTrip?.status === 'in_progress';
  // Booking-level Track Live must depend on this specific trip only.
  const isLive = !isDone && tripInProgress;

  // Time Expired Logic
  const isExpired = React.useMemo(() => {
    if (!data?.date || !data?.time) return false;
    try {
      const now = new Date();
      // Parse date parts to create a local Date object instead of UTC
      const dateParts = data.date.split('-').map(Number); // [2026, 04, 02]
      const [hours, minutes] = data.time.split(':').map(Number);
      
      const tripDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], hours, minutes, 0, 0);

      return tripDate < now;
    } catch (e) {
      return false;
    }
  }, [data?.date, data?.time]);

  const isDeparted = isExpired && normalizedStatus !== 'scheduled';
  const canBook = isAvailable && !isExpired && !isDone && !isAlreadyBooked && normalizedStatus !== 'in_progress';

  const bMeta = isBooking ? bookingStatusMeta(booking.status, t) : null;

  return (
    <View style={[styles.card, SHADOWS.soft]}>
      {/* Top section: Time and Seats Badge */}
      <View style={styles.topRow}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text style={styles.timeText}>{data?.time}</Text>
          <Text style={styles.dateLabel}>{data?.date ? new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase() : ''}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 8 }}>
          {bMeta && (
            <View style={[styles.statusPill, { borderColor: bMeta.color + '55', backgroundColor: bMeta.color + '12' }]}>
              <Text style={[styles.statusPillTxt, { color: bMeta.color }]}>{bMeta.label}</Text>
            </View>
          )}
          <View style={styles.seatsBadge}>
            <Text style={styles.seatsText}>{isBooking ? `${data.seats} ${t('tenant.seats')}` : `${seatsRemaining} ${t('admin.available')}`}</Text>
          </View>
        </View>
      </View>

      {/* Middle section: Route */}
      <View style={styles.routeContainer}>
        <View style={styles.routeItem}>
          <View style={[styles.dot, { backgroundColor: COLORS.secondary }]} />
          <Text style={styles.routeText}>{data?.origin}</Text>
        </View>
        <View style={styles.routeItem}>
          <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.routeText}>{data?.destination}</Text>
        </View>
      </View>

      {/* Separator line */}
      <View style={styles.separator} />

      {/* Bottom section: Footer Actions */}
      <View style={styles.footer}>
        {isBooking ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'space-between', width: '100%' }}>
            {/* Track Live Button (only when in_progress) */}
            {isLive && (
              <TouchableOpacity
                style={styles.trackBtn}
                onPress={() => {
                  refreshShuttleLive?.();
                  navigation.navigate('LiveTracking', { tripId: booking.trip_id, showCompletedModal: true });
                }}
              >
                <View style={styles.livePulse} />
                <Text style={styles.trackBtnText}>{t('tenant.track_live') || 'TRACK LIVE'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.cancelBtn, isLive && { marginLeft: 'auto' }]} 
              onPress={() => onCancel && onCancel(booking.id)}
            >
              <Text style={styles.cancelBtnText}>{t('tenant.cancel_confirm').toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.reserveBtn, !canBook && styles.btnDisabled]} 
            onPress={() => canBook && navigation.navigate('BookingModal', { trip })}
            activeOpacity={0.8}
          >
            <Text style={styles.reserveText}>
              {isDone
                ? 'COMPLETED'
                : isDeparted
                  ? 'DEPARTED'
                  : isAlreadyBooked
                    ? 'YOU BOOKED'
                    : isAvailable
                      ? t('tenant.book_now').toUpperCase() + ' >'
                      : 'FULL'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { 
    backgroundColor: COLORS.white, 
    borderRadius: 36, 
    padding: 25, 
    marginBottom: 20, 
    width: '100%',
    // Extra guard against square shadows
    overflow: 'hidden', 
  },
  topRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 15
  },
  timeText: { 
    fontSize: 26, 
    fontWeight: '800', 
    color: '#2D2D2D' 
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.gray[300],
    letterSpacing: 1,
    marginBottom: 4
  },
  seatsBadge: { 
    backgroundColor: '#D1DDB3', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12 
  },
  seatsText: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: '#6E7A4A' 
  },
  routeContainer: { 
    marginBottom: 20,
    gap: 12
  },
  routeItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  dot: { 
    width: 14, 
    height: 14, 
    borderRadius: 7 
  },
  routeText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#4A4A4A' 
  },
  separator: { 
    height: 2, 
    backgroundColor: '#000', 
    marginBottom: 15,
    opacity: 0.9 // Bold dark line as in image
  },
  footer: { 
    alignItems: 'flex-end' 
  },
  reserveBtn: { 
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 22, 
    paddingVertical: 10, 
    borderRadius: 14 
  },
  reserveText: { 
    color: COLORS.white, 
    fontWeight: '800', 
    fontSize: 12,
    letterSpacing: 0.5
  },
  btnDisabled: { 
    backgroundColor: '#CCC' 
  },
  trackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#22c55e' + '15', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, borderColor: '#22c55e' + '40',
  },
  livePulse: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22c55e' },
  trackBtnText: { fontSize: 10, fontWeight: '900', color: '#22c55e', letterSpacing: 1.5 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusPillTxt: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  cancelBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EF4444'
  },
  cancelBtnText: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: 12
  }
});
