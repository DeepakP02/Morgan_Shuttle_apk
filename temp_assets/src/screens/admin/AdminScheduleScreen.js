import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Platform, Modal, TextInput, Alert, ScrollView, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobal }  from '../../store/GlobalContext';
import { Badge }      from '../../components/shared/Badge';
import { Button }     from '../../components/shared/Button';
import { COLORS, SHADOWS } from '../../constants/theme';
import { Image } from 'react-native';
import { MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { isSameDay, addDays, format, parse } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';

export const AdminScheduleScreen = () => {
  const { t } = useTranslation();
  const { trips, addTrip, deleteTrip, destinations } = useGlobal();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [viewTrip, setViewTrip] = useState(null);
  
  // Trip creation states: Resetting date to current and time to a rounded hour for better UX
  const [newTripDate, setNewTripDate] = useState(new Date());
  const [newTripTime, setNewTripTime] = useState(() => {
     const d = new Date();
     d.setMinutes(0, 0, 0); // Start at a round hour
     return d;
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [newTripOrigin, setNewTripOrigin] = useState('');
  const [newTripDest, setNewTripDest] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const dates = Array.from({ length: 8 }, (_, i) => addDays(new Date(), i));
  const filteredTrips = trips.filter(t => {
     if (!t || !t.date) return false;
     const [y, m, d] = t.date.split('-').map(Number);
     const tripDate = new Date(y, m - 1, d);
     return isSameDay(tripDate, selectedDate);
  });

  const handleAddTrip = async () => {
    if (!newTripOrigin || !newTripDest) {
      Alert.alert(t('common.error'), 'Please fill all fields.');
      return;
    }
    
    setIsAdding(true);
    try {
      await addTrip({
        date: format(newTripDate, 'yyyy-MM-dd'),
        time: format(newTripTime, 'HH:mm'),
        origin: newTripOrigin,
        destination: newTripDest
      });
      
      // Auto-switch to the date of the trip we just added
      setSelectedDate(newTripDate);
      
      Alert.alert(t('common.success'), t('common.success'));
      setModalVisible(false);
      setNewTripOrigin('');
      setNewTripDest('');
    } catch (error) {
      Alert.alert(t('common.error'), t('common.error'));
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Control', t('admin.remove_trip'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteTrip(id) },
    ]);
  };

  const renderDate = ({ item }) => {
    const isSelected = isSameDay(item, selectedDate);
    return (
      <TouchableOpacity
        style={[styles.dateCard, isSelected && styles.dateCardActive]}
        onPress={() => setSelectedDate(item)}
      >
        <Text style={[styles.dayName, isSelected && styles.dayNameActive]}>{format(item, 'EEE')}</Text>
        <Text style={[styles.dayNum, isSelected && styles.dayNumActive]}>{format(item, 'd')}</Text>
      </TouchableOpacity>
    );
  };

  const renderTrip = ({ item }) => {
    const totalSeats = Math.max(item.seats_total || 0, 1);
    const bookedSeats = Math.max(totalSeats - (item.seats_remaining || 0), 0);
    const pct = Math.min((bookedSeats / totalSeats) * 100, 100);
    const isFull = item.seats_remaining === 0;
    const isLow  = item.seats_remaining > 0 && item.seats_remaining <= 2;
    return (
      <View style={[styles.card, SHADOWS.soft]}>
        <View style={styles.cardHeader}>
          <View style={{ gap: 5 }}>
            <View style={styles.timeBadge}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.primary} />
              <Text style={styles.timeText}>{format(parse(item.time, 'HH:mm', new Date()), 'hh:mm a')}</Text>
            </View>
            <View style={styles.dateSmallBadge}>
              <Text style={styles.dateSmallText}>
                {item && item.date ? format(new Date(item.date.split('-')[0], item.date.split('-')[1]-1, item.date.split('-')[2]), 'MMM d, EEE') : ''}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Badge
              label={item.status === 'completed' ? t('admin.done') : isFull ? t('admin.full') : isLow ? `${item.seats_remaining} ${t('admin.left')}` : t('admin.available')}
              type={item.status === 'completed' ? 'gray' : isFull ? 'danger' : isLow ? 'warning' : 'success'}
            />
            <TouchableOpacity onPress={() => setViewTrip(item)} style={styles.iconBtn}>
              <MaterialCommunityIcons name="eye-outline" size={18} color={COLORS.gray[300]} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
              <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.routeRow}>
          <View style={[styles.dot, { backgroundColor: COLORS.secondary }]} />
          <Text style={styles.routeText}>{item.origin} → {item.destination}</Text>
        </View>
        
        {item.is_special && (
          <View style={styles.specialInfoRow}>
            <View style={styles.specialBadge}>
              <Text style={styles.specialBadgeText}>{t('home.special_run').toUpperCase()}</Text>
            </View>
            <Text style={styles.reqByText} numberOfLines={2}>
              {t('admin.special_request_by')}: {item.tenant_name || 'Resident'}
            </Text>
          </View>
        )}

        <View style={styles.capacityRow}>
          <Text style={styles.capacityText}>{bookedSeats}/{totalSeats} {t('admin.booked')}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: isFull ? '#ef4444' : isLow ? '#f59e0b' : COLORS.secondary }]} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topBanner}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
             <Image 
               source={require('../../../assets/image.png')} 
               style={[styles.headerLogo, { tintColor: COLORS.white }]}
               resizeMode="contain" 
             />
             <Text style={styles.headerTitle}>{t('admin.trip_planner')}</Text>
             <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.calendarStrip}>
        <FlatList
          data={dates}
          renderItem={renderDate}
          keyExtractor={d => d.toISOString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateList}
        />
      </View>

      <FlatList
        data={filteredTrips}
        renderItem={renderTrip}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.listHeader}>{t('admin.scheduled_runs', { count: filteredTrips.length })} ({format(selectedDate, 'MMM d')})</Text>}
        ListEmptyComponent={<Text style={styles.emptyText}>{t('admin.no_trips')}</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <AntDesign name="plus" size={24} color="#ffffff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
          >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('admin.add_new_trip')}</Text>
            
            <View style={styles.inputGroup}>
               <Text style={styles.label}>{t('dashboard.schedule').toUpperCase()}</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                 {dates.map(d => {
                   const dStr = format(d, 'yyyy-MM-dd');
                    return (
                      <TouchableOpacity 
                       key={dStr} 
                       style={[styles.pill, format(newTripDate, 'yyyy-MM-dd') === dStr && styles.pillActive]}
                       onPress={() => setNewTripDate(d)}
                      >
                        <Text style={[styles.pillText, format(newTripDate, 'yyyy-MM-dd') === dStr && styles.pillTextActive]}>{format(d, 'MMM d')}</Text>
                      </TouchableOpacity>
                    );
                 })}
               </ScrollView>
            </View>

            <View style={styles.inputGroup}>
               <Text style={styles.label}>{t('common.time').toUpperCase()} (AM/PM)</Text>
               <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}>
                  <Text style={{ fontSize: 16, color: COLORS.black, fontWeight: '700' }}>
                    {format(newTripTime, 'hh:mm a')}
                  </Text>
               </TouchableOpacity>
               {showTimePicker && (
                 <DateTimePicker
                   value={newTripTime}
                   mode="time"
                   is24Hour={false}
                   onChange={(event, date) => {
                     setShowTimePicker(false);
                     if (date) setNewTripTime(date);
                   }}
                 />
               )}
            </View>

            <View style={styles.inputGroup}>
               <Text style={styles.label}>{t('home.hero_title').toUpperCase()}</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                 {destinations.map(d => (
                   <TouchableOpacity 
                    key={d} 
                    style={[styles.pill, newTripOrigin === d && styles.pillActive]}
                    onPress={() => setNewTripOrigin(d)}
                   >
                     <Text style={[styles.pillText, newTripOrigin === d && styles.pillTextActive]}>{d}</Text>
                   </TouchableOpacity>
                 ))}
               </ScrollView>
            </View>

            <View style={styles.inputGroup}>
               <Text style={styles.label}>{t('dashboard.places').toUpperCase()}</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                 {destinations.map(d => (
                   <TouchableOpacity 
                    key={d} 
                    style={[styles.pill, newTripDest === d && styles.pillActive]}
                    onPress={() => setNewTripDest(d)}
                   >
                     <Text style={[styles.pillText, newTripDest === d && styles.pillTextActive]}>{d}</Text>
                   </TouchableOpacity>
                 ))}
               </ScrollView>
            </View>

            <View style={styles.modalActions}>
              <Button title={t('common.cancel')} type="secondary" onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
              <Button 
                title={t('admin.create_trip')} 
                onPress={handleAddTrip} 
                loading={isAdding}
                style={{ flex: 1.5, marginLeft: 10 }} 
              />
            </View>
          </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={!!viewTrip} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={[styles.modalTitle, { marginBottom: 0 }]}>{t('admin.trip_details')}</Text>
              <TouchableOpacity onPress={() => setViewTrip(null)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>{t('admin.route')}</Text>
              <Text style={styles.detailValue}>{viewTrip?.origin} → {viewTrip?.destination}</Text>
            </View>
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>{t('admin.time_date')}</Text>
              <Text style={styles.detailValue}>{viewTrip?.time} • {viewTrip && format(new Date(viewTrip.date), 'MMMM d, yyyy')}</Text>
            </View>
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>{t('admin.seats_booked')}</Text>
              <Text style={styles.detailValue}>{viewTrip ? (viewTrip.seats_total - viewTrip.seats_remaining) : 0} {t('admin.left')} {viewTrip?.seats_total}</Text>
            </View>
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>{t('admin.status')}</Text>
              <Text style={[styles.detailValue, { textTransform: 'capitalize' }]}>{viewTrip?.status}</Text>
            </View>
            {viewTrip?.is_special && (
              <View style={[styles.detailBox, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>{t('admin.special_request_by')}</Text>
                <Text style={[styles.detailValue, { color: COLORS.primary }]}>{viewTrip.tenant_name || 'Resident'}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBanner: { backgroundColor: COLORS.primary, paddingBottom: 25, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  headerLogo: { width: 110, height: 35 },
  headerTitle: { fontSize: 13, fontWeight: '900', color: COLORS.white, letterSpacing: 2, textTransform: 'uppercase' },
  calendarStrip: { paddingVertical: 15, backgroundColor: COLORS.background },
  dateList: { paddingHorizontal: 20, gap: 10 },
  dateCard: { width: 54, height: 74, backgroundColor: COLORS.white, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  dateCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayName: { fontSize: 9, fontWeight: '900', color: COLORS.gray[300], textTransform: 'uppercase' },
  dayNameActive: { color: 'rgba(255,255,255,0.6)' },
  dayNum: { fontSize: 18, fontWeight: '900', color: COLORS.black, marginTop: 2 },
  dayNumActive: { color: COLORS.white },
  list: { padding: 20, paddingBottom: 100 },
  listHeader: { fontSize: 11, fontWeight: '900', color: COLORS.gray[300], marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1.5 },
  card: { backgroundColor: COLORS.white, borderRadius: 28, padding: 16, marginBottom: 15, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  timeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, gap: 8 },
  timeText: { fontSize: 13, fontWeight: '900', color: COLORS.primary, letterSpacing: 0.5 },
  dateSmallBadge: { paddingLeft: 5 },
  dateSmallText: { fontSize: 9, fontWeight: '800', color: COLORS.gray[300], textTransform: 'uppercase', letterSpacing: 1 },
  iconBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  routeText: { flex: 1, fontSize: 16, fontWeight: '900', color: COLORS.black, letterSpacing: -0.3 },
  specialInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
    backgroundColor: COLORS.primary + '08',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12
  },
  specialBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  specialBadgeText: { fontSize: 9, fontWeight: '900', color: COLORS.white, letterSpacing: 1 },
  reqByText: { flex: 1, fontSize: 12, fontWeight: '800', color: COLORS.primary, lineHeight: 17 },
  capacityRow: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingTop: 18, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  capacityText: { fontSize: 11, color: COLORS.gray[300], fontWeight: '900', textTransform: 'uppercase' },
  progressBar: { flex: 1, height: 4, backgroundColor: COLORS.background, borderRadius: 2 },
  progressFill: { height: '100%', borderRadius: 2 },
  emptyText: { textAlign: 'center', color: COLORS.gray[300], marginTop: 80, fontSize: 15, fontWeight: '800' },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 64, height: 64, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', ...SHADOWS.medium },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(40,40,41,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 30, paddingBottom: 50 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: COLORS.black, marginBottom: 25, letterSpacing: -0.5 },
  inputGroup: { marginBottom: 25 },
  label: { fontSize: 11, fontWeight: '900', color: COLORS.gray[300], marginBottom: 12, letterSpacing: 1.5, textTransform: 'uppercase' },
  input: { backgroundColor: COLORS.background, borderRadius: 16, padding: 18, fontSize: 16, color: COLORS.black, fontWeight: '700' },
  pillScroll: { flexDirection: 'row' },
  pill: { paddingHorizontal: 18, paddingVertical: 12, backgroundColor: COLORS.background, borderRadius: 14, marginRight: 12 },
  pillActive: { backgroundColor: COLORS.primary },
  pillText: { fontSize: 13, fontWeight: '800', color: COLORS.gray[300] },
  pillTextActive: { color: COLORS.white },
  modalActions: { flexDirection: 'row', marginTop: 15, gap: 12 },
  detailBox: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', paddingVertical: 18 },
  detailLabel: { fontSize: 9, fontWeight: '900', color: COLORS.gray[300], letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' },
  detailValue: { fontSize: 16, fontWeight: '800', color: COLORS.black },
});
