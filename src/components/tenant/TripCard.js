import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Badge }  from '../shared/Badge';
import { COLORS, SPACING, SIZES } from '../../constants/theme';
import { MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { isAfter, subHours, parseISO } from 'date-fns';

export const TripCard = ({ trip, onPress }) => {
  const isFull   = trip.seats_remaining === 0;
  const isLow    = trip.seats_remaining > 0 && trip.seats_remaining <= 2;
  const tripDateTime = parseISO(`${trip.date}T${trip.time}:00`);
  const isClosed = !isAfter(tripDateTime, subHours(new Date(), 2));

  const getStatus = () => {
    if (isClosed) return { label: 'CLOSED',                             type: 'gray' };
    if (isFull)   return { label: 'FULL',                               type: 'danger' };
    if (isLow)    return { label: `${trip.seats_remaining} SEATS LEFT`, type: 'warning' };
    return              { label: 'AVAILABLE',                           type: 'success' };
  };

  const status = getStatus();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => onPress(trip)}
      disabled={isClosed || isFull}
    >
      <View style={styles.header}>
        <View style={styles.timeBadge}>
          <MaterialCommunityIcons name="clock-outline" size={15} color={COLORS.primary} />
          <Text style={styles.timeText}>{trip.time}</Text>
        </View>
        <Badge label={status.label} type={status.type} />
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeRow}>
          <View style={[styles.dot, { backgroundColor: COLORS.gray[300] }]} />
          <Text style={styles.locationText} numberOfLines={1}>{trip.origin}</Text>
        </View>
        <View style={styles.line} />
        <View style={styles.routeRow}>
          <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.locationText} numberOfLines={1}>{trip.destination}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.capacityRow}>
          <MaterialCommunityIcons name="account-group" size={14} color={COLORS.primary} />
          <Text style={styles.paxText}>{trip.seats_remaining} / {trip.seats_total} Left</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.white, borderRadius: 24, padding: SPACING.md, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  timeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary + '08', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 6 },
  timeText: { fontSize: 17, fontWeight: '900', color: COLORS.primary },
  routeContainer: { paddingLeft: 4, marginBottom: 15 },
  routeRow: { flexDirection: 'row', alignItems: 'center', height: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  locationText: { fontSize: 16, fontWeight: '700', color: COLORS.black, flex: 1 },
  line: { width: 2, height: 10, backgroundColor: '#f1f5f9', marginLeft: 3, marginVertical: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f8fafc', paddingTop: 12 },
  capacityRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  paxText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
});
