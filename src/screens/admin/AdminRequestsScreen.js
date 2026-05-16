import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Alert, Platform, Modal, TextInput, ScrollView, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobal }  from '../../store/GlobalContext';
import { Badge }      from '../../components/shared/Badge';
import { Button }     from '../../components/shared/Button';
import { COLORS, SHADOWS } from '../../constants/theme';
import { Image } from 'react-native';
import { MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export const AdminRequestsScreen = () => {
  const { t } = useTranslation();
  const { requests, approveRequest, rejectRequest, deleteRequest, addRequest, destinations } = useGlobal();
  const [filter, setFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [newReq, setNewReq] = useState({ tenant_name: 'Resident', origin: '', destination: '', date: '2024-03-26', time: '12:00', passengers: 1 });

  const filtered = filter === 'all' ? requests : requests.filter(r => r && r.status === filter);

  const handleApprove = (id) => {
    Alert.alert(t('admin.approve'), t('admin.approve'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('admin.approve'), onPress: () => approveRequest(id) },
    ]);
  };

  const handleReject = (id) => {
    Alert.alert(t('admin.reject'), t('admin.reject'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('admin.reject'), style: 'destructive', onPress: () => rejectRequest(id) },
    ]);
  };

  const handleDelete = (id) => {
    Alert.alert('Control', t('admin.remove_trip'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteRequest(id) },
    ]);
  };

  const handleAddRequest = () => {
    if (!newReq.origin || !newReq.destination) return Alert.alert('Error', 'Fill all fields.');
    addRequest(newReq);
    setModalVisible(false);
    setNewReq({ ...newReq, origin: '', destination: '' });
  };

  const FilterBtn = ({ label, value }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.filterBtn, filter === value && styles.filterBtnActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => (
    <View style={[styles.card, SHADOWS.soft]}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.tenantName}>{item.tenant_name}</Text>
          <Text style={styles.sourceText}>{item.source === 'admin' ? `🔑 ${t('admin.dispatch_hub')}` : `📱 ${t('dashboard.requests')}`}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Badge label={item.status} type={item.status === 'pending' ? 'warning' : item.status === 'approved' ? 'success' : 'gray'} />
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
             <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoBox}>
        <View style={styles.infoRow}><MaterialCommunityIcons name="calendar-clock" size={16} color={COLORS.primary} /><Text style={styles.infoText}>{item.date} at {item.time}</Text></View>
        <View style={styles.infoRow}><MaterialCommunityIcons name="map-marker-outline" size={16} color={COLORS.secondary} /><Text style={styles.infoText}>{item.origin} → {item.destination}</Text></View>
        <View style={styles.infoRow}><MaterialCommunityIcons name="account-group-outline" size={16} color={COLORS.gray[300]} /><Text style={styles.infoText}>{item.passengers} pax</Text></View>
      </View>

      {item.status === 'pending' && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item.id)}>
            <MaterialCommunityIcons name="check-circle-outline" size={16} color="#ffffff" />
            <Text style={styles.approveTxt}>{t('admin.approve')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item.id)}>
            <MaterialCommunityIcons name="close-circle-outline" size={16} color="#ef4444" />
            <Text style={styles.rejectTxt}>{t('admin.reject')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
             <Text style={styles.headerTitle}>{t('admin.dispatch_hub')}</Text>
             <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.filterStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <FilterBtn label={t('admin.all_runs')} value="all" />
          <FilterBtn label={t('admin.pending')} value="pending" />
          <FilterBtn label={t('admin.approved')} value="approved" />
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <AntDesign name="plus" size={24} color="#ffffff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
          >
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Manual Entry</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>TIME</Text>
                  <TextInput style={styles.input} value={newReq.time} onChangeText={(t)=>setNewReq({...newReq, time: t})} />
                </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>ORIGIN / DESTINATION</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                   {destinations.map(d => (
                     <TouchableOpacity 
                       key={d+'o'} 
                       style={[styles.pill, newReq.origin === d && styles.pillActive]} 
                       onPress={() => setNewReq({...newReq, origin: d})}
                     >
                        <Text style={[styles.pillText, newReq.origin === d && {color:'#fff'}]}>{d}</Text>
                     </TouchableOpacity>
                   ))}
                </ScrollView>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                   {destinations.map(d => (
                     <TouchableOpacity 
                       key={d+'d'} 
                       style={[styles.pill, newReq.destination === d && styles.pillActive]} 
                       onPress={() => setNewReq({...newReq, destination: d})}
                     >
                        <Text style={[styles.pillText, newReq.destination === d && {color:'#fff'}]}>{d}</Text>
                     </TouchableOpacity>
                   ))}
                </ScrollView>
              </View>

                <View style={styles.modalActions}>
                  <Button title="Close" type="secondary" onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
                  <Button title="Save Entry" onPress={handleAddRequest} style={{ flex: 1.5, marginLeft: 10 }} />
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  headerLogo: { width: 110, height: 35 },
  headerTitle: { fontSize: 13, fontWeight: '900', color: COLORS.white, letterSpacing: 2, textTransform: 'uppercase' },
  filterStrip: { paddingVertical: 15, backgroundColor: COLORS.background },
  filterRow: { paddingHorizontal: 20, gap: 10 },
  filterBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, backgroundColor: COLORS.white, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 11, fontWeight: '900', color: COLORS.gray[300], textTransform: 'uppercase', letterSpacing: 1.5 },
  filterTextActive: { color: COLORS.white },
  list: { padding: 20, paddingBottom: 100 },
  card: { backgroundColor: COLORS.white, borderRadius: 32, padding: 18, marginBottom: 15, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  tenantName: { fontSize: 17, fontWeight: '900', color: COLORS.black, letterSpacing: -0.3 },
  sourceText: { fontSize: 10, color: COLORS.gray[300], marginTop: 5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  iconBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  infoBox: { gap: 10, marginBottom: 20, padding: 15, backgroundColor: COLORS.background, borderRadius: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoText: { fontSize: 14, color: COLORS.black, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  approveBtn: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 14, gap: 10 },
  approveTxt: { color: COLORS.white, fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white, borderRadius: 16, paddingVertical: 14, gap: 10, borderWidth: 1, borderColor: COLORS.gray[100] },
  rejectTxt: { color: COLORS.gray[300], fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 64, height: 64, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', ...SHADOWS.medium },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(40,40,41,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 30, paddingBottom: 50 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: COLORS.black, marginBottom: 25, letterSpacing: -0.5 },
  inputGroup: { marginBottom: 25 },
  label: { fontSize: 11, fontWeight: '900', color: COLORS.gray[300], marginBottom: 12, letterSpacing: 1.5, textTransform: 'uppercase' },
  input: { backgroundColor: COLORS.background, borderRadius: 16, padding: 18, fontSize: 16, color: COLORS.black, fontWeight: '700' },
  pill: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: COLORS.background, borderRadius: 10, marginRight: 10 },
  pillActive: { backgroundColor: COLORS.primary },
  pillText: { fontSize: 11, fontWeight: '900', color: COLORS.gray[300], textTransform: 'uppercase' },
  modalActions: { flexDirection: 'row', marginTop: 15, gap: 12 },
});
