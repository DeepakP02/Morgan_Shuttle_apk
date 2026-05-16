import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, TextInput, StatusBar, Platform, KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobal } from '../../store/GlobalContext';
import { Badge }     from '../../components/shared/Badge';
import { Button }    from '../../components/shared/Button';
import { COLORS, SHADOWS } from '../../constants/theme';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

export const RequestsScreen = ({ navigation }) => {
  const { requests, submitRequest, user, destinations } = useGlobal();
  const { t } = useTranslation();

  const [form, setForm] = useState({
    tenant_name: user?.name || 'Guest',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '12:00',
    origin: '',
    destination: '',
    passengers: 1,
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());

  const getRequestStatusLabel = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'approved' || s === 'approve' || s === 'confirmed') {
      return t('tenant.status_approved') || 'Approved';
    }
    if (s === 'rejected' || s === 'reject') {
      return t('tenant.rejected') || 'Rejected';
    }
    if (s === 'completed' || s === 'done') {
      return t('tenant.status_completed') || 'Completed';
    }
    return t('tenant.status_pending_approval') || 'Pending approval';
  };

  const getRequestStatusType = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'rejected' || s === 'reject') return 'danger';
    if (s === 'approved' || s === 'approve' || s === 'confirmed' || s === 'completed' || s === 'done') {
      return 'success';
    }
    return 'warning';
  };

  const timeToDate = (timeString) => {
    const [hours, minutes] = (timeString || '12:00').split(':').map(Number);
    const date = new Date();
    date.setHours(Number.isNaN(hours) ? 12 : hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0);
    return date;
  };

  const formatTime12h = (timeString) => {
    try {
      const [hours, minutes] = (timeString || '12:00').split(':').map(Number);
      const dt = new Date();
      dt.setHours(Number.isNaN(hours) ? 12 : hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0);
      return format(dt, 'hh:mm a');
    } catch (e) {
      return timeString || '';
    }
  };

  const openCustomTimePicker = () => {
    setTempTime(timeToDate(form.time));
    setShowTimePicker(true);
  };

  const handleTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'ios') {
      if (!selectedTime) return;
      // iOS spinner emits continuous changes; apply only on Done.
      setTempTime(selectedTime);
      return;
    }

    // Android picker: apply only when user confirms with OK.
    if (event?.type === 'dismissed') {
      setShowTimePicker(false);
      return;
    }
    if (event?.type !== 'set') {
      return;
    }

    const pickedTime =
      selectedTime ||
      (event?.nativeEvent?.timestamp ? new Date(event.nativeEvent.timestamp) : null);

    if (!pickedTime) {
      setShowTimePicker(false);
      return;
    }

    setShowTimePicker(false);
    setForm(prev => ({ ...prev, time: format(pickedTime, 'HH:mm') }));
  };

  const applyIosCustomTime = () => {
    setForm(prev => ({ ...prev, time: format(tempTime, 'HH:mm') }));
    setShowTimePicker(false);
  };

  const handleSubmit = async () => {
    if (!form.origin || !form.destination) {
      Alert.alert(t('common.error'), t('tenant.specify_needs'));
      return;
    }
    setLoading(true);
    try {
      await submitRequest(form);
      Alert.alert(t('tenant.request_sent'), t('tenant.request_success'));
      setForm({ ...form, origin: '', destination: '', notes: '', passengers: 1 });
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setLoading(false);
    }
  };

  const myRequests = (requests || []).filter(r => r.tenant_name === user?.name || r.source === 'tenant');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topBanner}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <View style={{ width: 28 }} />
            <Text style={styles.headerTitle}>{t('tenant.request_shuttle')}</Text>
            <View style={{ width: 28 }} />
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{t('tenant.custom_trip')}</Text>
            <Text style={styles.subtitle}>{t('tenant.specify_needs')}</Text>
          </View>

        <View style={styles.formCard}>
           <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('tenant.origin')}</Text>
            <View style={styles.destinationGrid}>
              {destinations.map(d => (
                <TouchableOpacity 
                   key={d} 
                   style={[styles.destBtn, form.origin === d && styles.destBtnActive]} 
                   onPress={() => setForm({ ...form, origin: d })}
                >
                  <Text style={[styles.destText, form.origin === d && styles.destTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('common.time')}</Text>
            <View style={styles.destinationGrid}>
              {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'].map(tm => (
                <TouchableOpacity 
                   key={tm} 
                   style={[styles.destBtn, form.time === tm && styles.destBtnActive]} 
                   onPress={() => setForm({ ...form, time: tm })}
                >
                  <Text style={[styles.destText, form.time === tm && styles.destTextActive]}>{formatTime12h(tm)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.customTimeBtn}
              onPress={openCustomTimePicker}
            >
              <MaterialCommunityIcons name="clock-edit-outline" size={16} color={COLORS.primary} />
              <Text style={styles.customTimeText}>Select custom time: {formatTime12h(form.time)}</Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={Platform.OS === 'ios' ? tempTime : timeToDate(form.time)}
                mode="time"
                is24Hour={false}
                minuteInterval={5}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
              />
            )}
            {showTimePicker && Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.timeDoneBtn}
                onPress={applyIosCustomTime}
              >
                <Text style={styles.timeDoneText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('tenant.destination')}</Text>
            <View style={styles.destinationGrid}>
              {destinations.map(d => (
                <TouchableOpacity 
                   key={d} 
                   style={[styles.destBtn, form.destination === d && styles.destBtnActive]} 
                   onPress={() => setForm({ ...form, destination: d })}
                >
                  <Text style={[styles.destText, form.destination === d && styles.destTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('tenant.passengers')}</Text>
            <View style={styles.passengerRow}>
               <TouchableOpacity 
                  style={styles.countBtn} 
                  onPress={() => setForm({...form, passengers: Math.max(1, form.passengers - 1)})}
               >
                 <AntDesign name="minus" size={18} color={COLORS.primary} />
               </TouchableOpacity>
               <Text style={styles.passengerCount}>{form.passengers}</Text>
               <TouchableOpacity 
                  style={styles.countBtn} 
                  onPress={() => setForm({...form, passengers: Math.min(10, form.passengers + 1)})}
               >
                 <AntDesign name="plus" size={18} color={COLORS.primary} />
               </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('tenant.notes')}</Text>
            <TextInput 
              style={styles.textArea}
              placeholder="..."
              multiline
              numberOfLines={3}
              value={form.notes}
              onChangeText={(txt) => setForm({...form, notes: txt})}
            />
          </View>

          <Button 
            title={t('tenant.submit')} 
            onPress={handleSubmit} 
            loading={loading}
            style={{ height: 56, marginTop: 10 }} 
            icon={<AntDesign name="rocket" size={20} color="#ffffff" />} 
          />
        </View>

          {(myRequests.length > 0) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('tenant.your_requests')}</Text>
              {myRequests.map(r => (
                <View key={r.id} style={styles.reqCard}>
                  <View style={styles.reqHeader}>
                    <Text style={styles.reqDate}>{r.date} · {formatTime12h(r.time)}</Text>
                    <Badge label={getRequestStatusLabel(r.status)} type={getRequestStatusType(r.status)} />
                  </View>
                  <Text style={styles.reqRoute}>{r.origin} → {r.destination}</Text>
                  {r.passengers > 0 && <Text style={styles.reqDetail}>👥 {r.passengers} pax</Text>}
                  {r.notes ? <Text style={styles.reqDetail} numberOfLines={1}>📝 {r.notes}</Text> : null}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBanner: { backgroundColor: COLORS.primary, paddingBottom: 25, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  headerTitle: { fontSize: 13, fontWeight: '900', color: COLORS.white, letterSpacing: 2 },
  scroll: { padding: 30, paddingBottom: 100 },
  headerInfo: { marginBottom: 35, marginTop: 10 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.black, letterSpacing: -0.5 },
  subtitle: { fontSize: 10, color: COLORS.gray[300], marginTop: 4, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  formCard: { 
    backgroundColor: COLORS.white, 
    borderRadius: 28, 
    padding: 25, 
    borderWidth: 1, 
    borderColor: COLORS.gray[50],
    ...SHADOWS.soft 
  },
  inputGroup: { marginBottom: 30 },
  label: { 
    fontSize: 10, 
    fontWeight: '900', 
    color: COLORS.gray[300], 
    marginBottom: 15, 
    textTransform: 'uppercase', 
    letterSpacing: 2 
  },
  destinationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  destBtn: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: COLORS.gray[50],
    backgroundColor: COLORS.background
  },
  destBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  destText: { fontSize: 12, fontWeight: '800', color: COLORS.gray[400] },
  destTextActive: { color: COLORS.white },
  customTimeBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  customTimeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary
  },
  timeDoneBtn: {
    marginTop: 10,
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  timeDoneText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  section: { marginTop: 40 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: COLORS.gray[300], marginBottom: 20, textTransform: 'uppercase', letterSpacing: 2 },
  reqCard: { 
    backgroundColor: COLORS.white, 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: COLORS.gray[50] 
  },
  reqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reqDate: { fontSize: 12, fontWeight: '900', color: COLORS.gray[400] },
  reqRoute: { fontSize: 15, fontWeight: '900', color: COLORS.black, letterSpacing: -0.3 },
  passengerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 20, 
    backgroundColor: COLORS.background, 
    alignSelf: 'flex-start', 
    padding: 8, 
    borderRadius: 14 
  },
  countBtn: { width: 36, height: 36, backgroundColor: COLORS.white, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  passengerCount: { fontSize: 18, fontWeight: '900', color: COLORS.black },
  textArea: { 
    backgroundColor: COLORS.background + '50', 
    borderRadius: 16, 
    padding: 15, 
    borderWidth: 1, 
    borderColor: COLORS.gray[50], 
    minHeight: 120, 
    textAlignVertical: 'top', 
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '700'
  },
  reqDetail: { fontSize: 12, color: COLORS.gray[400], marginTop: 8, fontWeight: '700' },
});
