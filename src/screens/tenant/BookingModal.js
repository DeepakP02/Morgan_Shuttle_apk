import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, StatusBar } from 'react-native';
import { useGlobal } from '../../store/GlobalContext';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import { MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { Button } from '../../components/shared/Button';
import { useTranslation } from 'react-i18next';

export const BookingModal = ({ route, navigation }) => {
  const trip = route?.params?.trip;
  
  if (!trip) {
    React.useEffect(() => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    }, []);
    return null;
  }

  const { bookTrip, trips, fetchTrips } = useGlobal();
  const { t } = useTranslation();
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(false);

  const liveTrip = trips?.find((x) => x.id === trip.id) || trip;
  const seatsRemaining = liveTrip?.seats_remaining ?? trip.seats_remaining;

  React.useEffect(() => {
    fetchTrips?.();
  }, []);

  const handleBooking = async () => {
    setLoading(true);
    try {
      await bookTrip(liveTrip.id, seats);
      Alert.alert(t('tenant.booking_confirmed'), t('tenant.booking_success'));
      navigation.goBack();
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setLoading(false);
    }
  };

  const isFull = seatsRemaining === 0;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.dismiss} onPress={() => navigation.canGoBack() && navigation.goBack()} />
      <View style={styles.content}>
        <View style={styles.dragBar} />
        
        <View style={styles.header}>
          <Text style={styles.title}>{t('tenant.booking_details')}</Text>
          <Text style={styles.subtitle}>{trip.origin} → {trip.destination}</Text>
        </View>

        <View style={styles.detailsBox}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.primary} />
            <Text style={styles.detailText}>{trip.time}</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="account-group-outline" size={20} color={COLORS.primary} />
            <Text style={styles.detailText}>{seatsRemaining} {t('tenant.seats').toLowerCase()}</Text>
          </View>
        </View>

        <View style={styles.seatSection}>
          <Text style={styles.label}>{t('tenant.seats_to_reserve')}</Text>
          <View style={styles.seatPicker}>
            <TouchableOpacity 
              style={styles.pickerBtn} 
              onPress={() => setSeats(Math.max(1, seats - 1))}
            >
              <AntDesign name="minus" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.seatNum}>{seats}</Text>
            <TouchableOpacity 
              style={styles.pickerBtn} 
              onPress={() => setSeats(Math.min(seatsRemaining, Math.min(7, seats + 1)))}
            >
              <AntDesign name="plus" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.ruleText}>*Max 7 {t('tenant.seats').toLowerCase()}</Text>
        </View>

        <Button 
          title={isFull ? 'TRIP FULL' : `${t('tenant.book_now')} (${seats})`}
          onPress={handleBooking}
          disabled={isFull}
          loading={loading}
          style={isFull ? styles.fullBtn : styles.bookBtn}
        />
        
        <TouchableOpacity style={styles.cancelLink} onPress={() => navigation.canGoBack() && navigation.goBack()}>
          <Text style={styles.cancelText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(40,40,41,0.6)', justifyContent: 'flex-end' },
  dismiss: { flex: 1 },
  content: { 
    backgroundColor: COLORS.white, 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    padding: 30, 
    paddingBottom: Platform.OS === 'ios' ? 45 : 30 
  },
  dragBar: { width: 36, height: 4, backgroundColor: COLORS.gray[100], borderRadius: 2, alignSelf: 'center', marginBottom: 25 },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.black, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: COLORS.gray[400], marginTop: 5, fontWeight: '700', textTransform: 'uppercase' },
  detailsBox: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.background, 
    borderRadius: 24, 
    padding: 22, 
    justifyContent: 'space-around', 
    marginBottom: 35,
    borderWidth: 1,
    borderColor: COLORS.gray[50]
  },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailText: { fontSize: 15, fontWeight: '800', color: COLORS.black },
  seatSection: { alignItems: 'center', marginBottom: 35 },
  label: { fontSize: 10, fontWeight: '900', color: COLORS.gray[300], marginBottom: 15, letterSpacing: 2 },
  seatPicker: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 35, 
    backgroundColor: COLORS.background, 
    borderRadius: 20, 
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.gray[50]
  },
  pickerBtn: { 
    width: 48, 
    height: 48, 
    borderRadius: 16, 
    backgroundColor: COLORS.white, 
    justifyContent: 'center', 
    alignItems: 'center',
    ...SHADOWS.soft
  },
  seatNum: { fontSize: 28, fontWeight: '900', color: COLORS.black },
  ruleText: { fontSize: 11, color: COLORS.gray[300], marginTop: 12, fontWeight: '700', fontStyle: 'italic' },
  bookBtn: { height: 60, borderRadius: 18, backgroundColor: COLORS.primary },
  fullBtn: { height: 60, borderRadius: 18, backgroundColor: COLORS.gray[200] },
  cancelLink: { alignItems: 'center', marginTop: 22 },
  cancelText: { color: COLORS.gray[300], fontWeight: '800', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
});
