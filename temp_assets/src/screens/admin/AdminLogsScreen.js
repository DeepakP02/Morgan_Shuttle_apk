import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, StatusBar, Alert, Platform, Modal, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobal }  from '../../store/GlobalContext';
import { Button }     from '../../components/shared/Button';
import { COLORS, SHADOWS } from '../../constants/theme';
import { Image } from 'react-native';
import { MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

export const AdminLogsScreen = () => {
  const { t } = useTranslation();
  const { fuelLogs, maintenanceLogs, addFuelLog, removeFuelLog, addMaintenanceLog, removeMaintenanceLog } = useGlobal();
  const [tab, setTab] = useState('fuel');
  const [fuelModal, setFuelModal] = useState(false);
  const [maintModal, setMaintModal] = useState(false);

  const [fuelForm, setFuelForm] = useState({ 
    date: format(new Date(), 'yyyy-MM-dd'), 
    driver: '', 
    vehicle: 'Shuttle #01', 
    amount: '', 
    cost: '$',
    odometer: '' 
  });
  
  const [maintForm, setMaintForm] = useState({ 
    date: format(new Date(), 'yyyy-MM-dd'), 
    type: 'Oil Change', 
    notes: '', 
    cost: '$' 
  });

  const handleAddFuel = async () => {
    if (!fuelForm.driver || !fuelForm.amount) return Alert.alert('Error', 'Incomplete details.');
    try {
      await addFuelLog(fuelForm);
      setFuelModal(false);
      setFuelForm({ ...fuelForm, amount: '', cost: '$', odometer: '' }); // Reset
    } catch (e) {
      Alert.alert('Error', 'Failed to save fuel log.');
    }
  };

  const handleAddMaint = async () => {
    if (!maintForm.type || !maintForm.cost) return Alert.alert('Error', 'Incomplete details.');
    try {
      await addMaintenanceLog(maintForm);
      setMaintModal(false);
      setMaintForm({ ...maintForm, notes: '', cost: '$' }); // Reset
    } catch (e) {
      Alert.alert('Error', 'Failed to save maintenance record.');
    }
  };

  const TabItem = ({ id, label, icon }) => (
    <TouchableOpacity 
      style={[styles.tab, tab === id && styles.tabActive]} 
      onPress={() => setTab(id)}
    >
      <MaterialCommunityIcons name={icon} size={20} color={tab === id ? '#ffffff' : COLORS.gray[300]} />
      <Text style={[styles.tabText, tab === id && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

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
             <Text style={styles.headerTitle}>{t('admin.operations_log')}</Text>
             <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.tabBarStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarRow}>
          <TabItem id="fuel" label={t('admin.fueling')} icon="gas-station" />
          <TabItem id="maintenance" label={t('admin.repairs')} icon="wrench-outline" />
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {tab === 'fuel' ? (
          fuelLogs.length > 0 ? fuelLogs.map(log => (
            <View key={log.id} style={[styles.card, SHADOWS.soft]}>
               <View style={styles.cardHeader}>
                  <View style={styles.cardIconBox}><MaterialCommunityIcons name="gas-station" size={24} color={COLORS.primary} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{log.driver}</Text>
                    <Text style={styles.cardSub}>{log.date} • {log.vehicle}</Text>
                  </View>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => removeFuelLog(log.id)}>
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
               </View>
               <View style={styles.metricsRow}>
                  <View style={styles.metricItem}><Text style={styles.mValue}>{log.amount}</Text><Text style={styles.mLabel}>Volume</Text></View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}><Text style={[styles.mValue, { color: COLORS.secondary }]}>{log.cost}</Text><Text style={styles.mLabel}>Cost</Text></View>
               </View>
            </View>
          )) : <Text style={styles.empty}>{t('home.no_tours')}</Text>
        ) : (
          maintenanceLogs.length > 0 ? maintenanceLogs.map(log => (
            <View key={log.id} style={[styles.card, SHADOWS.soft]}>
               <View style={styles.cardHeader}>
                  <View style={[styles.cardIconBox, { backgroundColor: COLORS.secondary + '10' }]}><MaterialCommunityIcons name="wrench-outline" size={24} color={COLORS.secondary} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{log.type}</Text>
                    <Text style={styles.cardSub}>{log.date}</Text>
                  </View>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => removeMaintenanceLog(log.id)}>
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
               </View>
               <View style={styles.maintContent}>
                 <Text style={styles.maintNotes}>{log.notes || 'Routine checkup and maintenance.'}</Text>
                 <Text style={styles.maintCost}>{log.cost}</Text>
               </View>
            </View>
          )) : <Text style={styles.empty}>{t('home.no_tours')}</Text>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => tab === 'fuel' ? setFuelModal(true) : setMaintModal(true)}>
        <AntDesign name="plus" size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Modals updated to match brand */}
      <Modal visible={fuelModal} animationType="fade" transparent>
         <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
            >
            <View style={styles.modalContent}>
               <Text style={styles.modalTitle}>New Fueling Entry</Text>
               <TextInput style={styles.input} placeholder="Driver Name" placeholderTextColor={COLORS.gray[300]} onChangeText={t => setFuelForm({...fuelForm, driver: t})} />
               <TextInput style={styles.input} placeholder="Odometer Reading (KM)" placeholderTextColor={COLORS.gray[300]} keyboardType="numeric" onChangeText={t => setFuelForm({...fuelForm, odometer: t})} />
               <View style={styles.inputRow}>
                 <TextInput style={[styles.input, { flex: 1 }]} placeholder="Liters" placeholderTextColor={COLORS.gray[300]} keyboardType="numeric" onChangeText={t => setFuelForm({...fuelForm, amount: t})} />
                 <TextInput style={[styles.input, { flex: 1, marginLeft: 15 }]} placeholder="Cost ($)" placeholderTextColor={COLORS.gray[300]} keyboardType="numeric" onChangeText={t => setFuelForm({...fuelForm, cost: '$' + t})} />
               </View>
               <View style={styles.modalActions}>
                  <Button title="Cancel" type="secondary" onPress={() => setFuelModal(false)} style={{ flex: 1 }} />
                  <Button title="Add Log" onPress={handleAddFuel} style={{ flex: 1.5, marginLeft: 10 }} />
               </View>
            </View>
            </KeyboardAvoidingView>
         </View>
      </Modal>

      <Modal visible={maintModal} animationType="fade" transparent>
         <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
            >
            <View style={styles.modalContent}>
               <Text style={styles.modalTitle}>Record Repair</Text>
               <TextInput style={styles.input} placeholder="Service Type" placeholderTextColor={COLORS.gray[300]} onChangeText={t => setMaintForm({...maintForm, type: t})} />
               <TextInput style={[styles.input, { height: 100 }]} multiline placeholder="Add repair notes..." placeholderTextColor={COLORS.gray[300]} onChangeText={t => setMaintForm({...maintForm, notes: t})} />
               <TextInput style={styles.input} placeholder="Total Cost ($)" placeholderTextColor={COLORS.gray[300]} keyboardType="numeric" onChangeText={t => setMaintForm({...maintForm, cost: '$' + t})} />
               <View style={styles.modalActions}>
                  <Button title="Cancel" type="secondary" onPress={() => setMaintModal(false)} style={{ flex: 1 }} />
                  <Button title="Add Record" onPress={handleAddMaint} style={{ flex: 1.5, marginLeft: 10 }} />
               </View>
            </View>
            </KeyboardAvoidingView>
         </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBanner: { backgroundColor: COLORS.primary, paddingBottom: 25, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginTop: 10 },
  headerLogo: { width: 110, height: 35 },
  headerTitle: { fontSize: 13, fontWeight: '900', color: COLORS.white, letterSpacing: 2, textTransform: 'uppercase' },
  tabBarStrip: { paddingVertical: 15, backgroundColor: COLORS.background },
  tabBarRow: { paddingHorizontal: 25, gap: 12 },
  tab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '900', color: COLORS.gray[300], textTransform: 'uppercase' },
  tabTextActive: { color: COLORS.white },
  scroll: { paddingHorizontal: 25, paddingBottom: 100 },
  card: { backgroundColor: COLORS.white, borderRadius: 32, padding: 25, marginBottom: 15, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 18 },
  cardIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.primary + '10', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '900', color: COLORS.black, letterSpacing: -0.3 },
  cardSub: { fontSize: 10, color: COLORS.gray[300], marginTop: 5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  iconBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  metricsRow: { flexDirection: 'row', backgroundColor: COLORS.background, borderRadius: 20, padding: 20, alignItems: 'center' },
  metricItem: { flex: 1, alignItems: 'center' },
  metricDivider: { width: 1, height: 25, backgroundColor: 'rgba(0,0,0,0.05)' },
  mValue: { fontSize: 16, fontWeight: '900', color: COLORS.black },
  mLabel: { fontSize: 9, color: COLORS.gray[300], textTransform: 'uppercase', marginTop: 5, fontWeight: '800', letterSpacing: 1 },
  maintContent: { backgroundColor: COLORS.background, borderRadius: 22, padding: 20 },
  maintNotes: { fontSize: 14, color: COLORS.black, lineHeight: 22, fontWeight: '700', marginBottom: 15 },
  maintCost: { fontSize: 18, fontWeight: '900', color: COLORS.secondary },
  empty: { textAlign: 'center', marginTop: 80, color: COLORS.gray[300], fontSize: 15, fontWeight: '800' },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 64, height: 64, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', ...SHADOWS.medium },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(40,40,41,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 30, paddingBottom: 50 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: COLORS.black, marginBottom: 25, letterSpacing: -0.5 },
  input: { backgroundColor: COLORS.background, borderRadius: 16, padding: 18, fontSize: 16, color: COLORS.black, fontWeight: '700', marginBottom: 15 },
  inputRow: { flexDirection: 'row', gap: 15 },
  modalActions: { flexDirection: 'row', marginTop: 15, gap: 12 },
});
