import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Modal, TextInput, Alert, ActivityIndicator, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { useGlobal } from '../../store/GlobalContext';
import { Button } from '../../components/shared/Button';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useTranslation } from 'react-i18next';

export const AdminUsersScreen = ({ route, navigation }) => {
  const { type } = route.params || { type: 'drivers' }; // 'drivers' or 'tenants'
  const { mockUsers: users, sendInvitation, syncPMS, internalCreateUser, deleteUser } = useGlobal();
  const { t } = useTranslation();
  
  const isDriver = type === 'drivers';
  const pageTitle = isDriver ? t('settings.resident_dir') : t('settings.resident_dir'); // Adjust if needed
  const iconName = isDriver ? 'account-tie' : 'account-group';
  const colorTheme = isDriver ? COLORS.primary : COLORS.secondary;

  const [invitingId, setInvitingId] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [pmsModalVisible, setPmsModalVisible] = useState(false);
  const [showPmsPassword, setShowPmsPassword] = useState(false);
  const [pmsCreds, setPmsCreds] = useState({ pmsId: '', apiKey: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'driver' });

  const filteredUsers = (users || [])
    .filter(u => isDriver ? (u.role === 'driver' || u.role === 'admin') : u.role === 'tenant')
    .filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleSync = () => {
    setPmsModalVisible(true);
  };

  const handlePmsSubmit = async () => {
    if (!pmsCreds.pmsId || !pmsCreds.apiKey) {
      return Alert.alert(t('common.error'), 'Please enter both PMS ID and API Key.');
    }

    setSyncing(true);
    setPmsModalVisible(false);
    try {
      const result = await syncPMS(pmsCreds);
      Alert.alert(t('common.success'), result.message || 'PMS Sync complete.');
      setPmsCreds({ pmsId: '', apiKey: '' });
    } catch (error) {
      Alert.alert(t('common.error'), error?.response?.data?.message || 'Masteko Sync failed. Please check credentials and connection.');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateInternal = async () => {
    if (!newUser.name || !newUser.email) return Alert.alert(t('common.error'), t('auth.empty_error'));
    try {
      await internalCreateUser(newUser.name, newUser.email, newUser.role);
      setModalVisible(false);
      setNewUser({ name: '', email: '', role: 'driver' });
      Alert.alert(t('common.success'), 'User created successfully.');
    } catch (error) {
      Alert.alert(t('common.error'), error?.response?.data?.message || error?.message || 'Could not create user.');
    }
  };

  const handleDeleteUser = (item) => {
    Alert.alert(
      'Delete user?',
      `Remove ${item?.name || 'this user'} from system?`,
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(item.id);
              Alert.alert(t('common.success') || 'Success', 'User deleted successfully.');
            } catch (error) {
              Alert.alert(t('common.error') || 'Error', 'Could not delete user.');
            }
          },
        },
      ]
    );
  };

  const handleSendInvite = async (userId) => {
    setInvitingId(userId);
    try {
      const result = await sendInvitation(userId);
      const token = result?.token || '';
      Alert.alert(
        t('common.success'),
        token
          ? `Invitation sent.\n\nToken: ${token}\n\nShare this token with driver for password setup.`
          : 'Invitation sent successfully.',
        [
          {
            text: 'Setup Now',
            onPress: () => navigation.navigate('PasswordSetup', { prefilledToken: token }),
          },
          { text: t('common.ok') || 'OK' },
        ]
      );
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to send invitation.');
    } finally {
      setInvitingId(null);
    }
  };

  const renderUser = ({ item }) => (
    <View style={[styles.userCard, SHADOWS.soft]}>
      <View style={[styles.iconBox, { backgroundColor: colorTheme + '15' }]}>
        <MaterialCommunityIcons name={iconName} size={24} color={colorTheme} />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userContact}>{item.email}</Text>
        <Text style={styles.pmsLabel}>📱 {t('admin.status').toUpperCase()}: {item.source || 'PMS'}</Text>
      </View>
      
      {!item.invitation_sent ? (
        <TouchableOpacity 
          style={[styles.inviteBtn, { borderColor: colorTheme }]} 
          onPress={() => handleSendInvite(item.id)}
          disabled={invitingId === item.id}
        >
          {invitingId === item.id ? (
            <ActivityIndicator size="small" color={colorTheme} />
          ) : (
            <Text style={[styles.inviteText, { color: colorTheme }]}>INVITE</Text>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{item.password_set ? 'ACTIVE' : 'SENT'}</Text>
          {!item.password_set && item.invitation_token && (
            <Text style={styles.tokenDisplay}>[{item.invitation_token}]</Text>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteUser(item)}>
        <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topBanner}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')} style={styles.backBtn}>
              <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isDriver ? 'STAFF' : 'RESIDENTS'}</Text>
            {!isDriver ? (
               <TouchableOpacity onPress={handleSync} disabled={syncing} style={styles.syncBtn}>
                  {syncing ? <ActivityIndicator size="small" color="#fff" /> : <MaterialCommunityIcons name="sync" size={20} color="#fff" />}
               </TouchableOpacity>
            ) : <View style={{ width: 44 }} />}
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.gray[300]} />
          <TextInput
            placeholder={t('common.search') + "..."}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.gray[300]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={16} color={COLORS.gray[300]} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.statsLabel}>
          {isDriver ? 'Internal Staff' : 'PMS Synced Data'}
        </Text>
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>{t('common.no_notifications')}</Text>}
      />

      {isDriver && (
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <AntDesign name="plus" size={24} color="#ffffff" />
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
         <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
            >
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
               <Text style={styles.modalTitle}>{t('settings.update_profile')}</Text>
               <View style={styles.inputGroup}>
                  <Text style={styles.label}>{(t('auth.name') || 'Name').toUpperCase()}</Text>
                  <TextInput 
                    style={styles.input} 
                    value={newUser.name} 
                    onChangeText={t => setNewUser({...newUser, name: t})} 
                  />
               </View>
               <View style={styles.inputGroup}>
                  <Text style={styles.label}>{(t('auth.email') || 'Email').toUpperCase()}</Text>
                  <TextInput 
                    style={styles.input} 
                    value={newUser.email} 
                    onChangeText={t => setNewUser({...newUser, email: t})} 
                    keyboardType="email-address"
                  />
               </View>
               <View style={styles.inputGroup}>
                  <Text style={styles.label}>SYSTEM ROLE</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity 
                      style={[styles.roleBtn, newUser.role === 'driver' && styles.roleBtnActive]}
                      onPress={() => setNewUser({...newUser, role: 'driver'})}
                    >
                      <Text style={[styles.roleBtnText, newUser.role === 'driver' && {color:'#fff'}]}>DRIVER</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.roleBtn, newUser.role === 'admin' && styles.roleBtnActive]}
                      onPress={() => setNewUser({...newUser, role: 'admin'})}
                    >
                      <Text style={[styles.roleBtnText, newUser.role === 'admin' && {color:'#fff'}]}>ADMIN</Text>
                    </TouchableOpacity>
                  </View>
               </View>

               <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
                  <Button title={t('common.cancel')} type="secondary" style={{ flex: 1 }} onPress={() => setModalVisible(false)} />
                  <Button title={t('common.save')} style={{ flex: 1.5 }} onPress={handleCreateInternal} />
               </View>
               </ScrollView>
            </View>
            </KeyboardAvoidingView>
         </View>
      </Modal>

      {/* PMS Sync Modal */}
      <Modal visible={pmsModalVisible} animationType="slide" transparent>
         <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
              style={{ width: '100%' }}
            >
              <View style={styles.modalContent}>
                 <View style={styles.modalHandle} />
                 <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <Text style={styles.modalTitle}>{t('admin.pms_auth')}</Text>
                    <Text style={styles.pmsHint}>{t('admin.pms_hint')}</Text>
                    
                    <View style={styles.inputGroup}>
                       <Text style={styles.label}>{t('admin.pms_id')}</Text>
                       <TextInput 
                         style={styles.input} 
                         value={pmsCreds.pmsId} 
                         onChangeText={t => setPmsCreds({...pmsCreds, pmsId: t})} 
                         placeholder={t('admin.pms_id_placeholder')}
                         placeholderTextColor={COLORS.gray[100]}
                       />
                    </View>

                    <View style={styles.inputGroup}>
                       <Text style={styles.label}>{t('admin.pms_password')}</Text>
                       <View style={styles.passwordContainer}>
                         <TextInput 
                           style={[styles.input, { flex: 1 }]} 
                           value={pmsCreds.apiKey} 
                           onChangeText={t => setPmsCreds({...pmsCreds, apiKey: t})} 
                           secureTextEntry={!showPmsPassword}
                           placeholder={t('admin.pms_password_placeholder')}
                           placeholderTextColor={COLORS.gray[100]}
                         />
                         <TouchableOpacity 
                           onPress={() => setShowPmsPassword(!showPmsPassword)}
                           style={styles.eyeIcon}
                         >
                           <MaterialCommunityIcons 
                             name={showPmsPassword ? "eye-off" : "eye"} 
                             size={20} 
                             color={COLORS.gray[300]} 
                           />
                         </TouchableOpacity>
                       </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
                       <Button title={t('common.cancel')} type="secondary" style={{ flex: 1 }} onPress={() => setPmsModalVisible(false)} />
                       <Button 
                         title={syncing ? t('admin.syncing') : t('admin.start_sync')} 
                         style={{ flex: 2 }} 
                         onPress={handlePmsSubmit}
                         disabled={syncing}
                       />
                    </View>
                 </ScrollView>
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
  headerTitle: { fontSize: 13, fontWeight: '900', color: COLORS.white, letterSpacing: 2, textTransform: 'uppercase' },
  backBtn: { padding: 5 },
  syncBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  searchContainer: { paddingHorizontal: 25, marginTop: 25 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 10, marginBottom: 15, ...SHADOWS.soft },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 13, color: COLORS.black, fontWeight: '700' },
  statsLabel: { fontSize: 11, color: COLORS.gray[300], fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 },
  list: { padding: 25, paddingBottom: 100 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 32, padding: 18, marginBottom: 15, overflow: 'hidden' },
  iconBox: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '900', color: COLORS.black },
  userContact: { fontSize: 11, color: COLORS.gray[300], marginTop: 3, fontWeight: '700' },
  pmsLabel: { fontSize: 9, color: COLORS.secondary, marginTop: 6, fontWeight: '900', letterSpacing: 0.5 },
  inviteBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, borderWidth: 1, marginRight: 10 },
  inviteText: { fontSize: 11, fontWeight: '900' },
  statusBox: { backgroundColor: COLORS.background, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginRight: 10 },
  statusText: { fontSize: 10, fontWeight: '900', color: COLORS.gray[300] },
  tokenDisplay: { fontSize: 8, color: COLORS.primary, marginTop: 4, fontWeight: '700', letterSpacing: 0.5 },
  iconBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: COLORS.gray[300], marginTop: 80, fontSize: 15, fontWeight: '800' },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 64, height: 64, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', ...SHADOWS.medium },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 25, paddingBottom: 40, maxHeight: '90%' },
  modalHandle: { width: 40, height: 5, backgroundColor: '#e5e7eb', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: COLORS.black, marginBottom: 15, letterSpacing: -0.5 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 10, fontWeight: '900', color: COLORS.gray[300], marginBottom: 8, letterSpacing: 1 },
  input: { backgroundColor: COLORS.background, borderRadius: 14, padding: 15, fontSize: 15, color: COLORS.black, fontWeight: '700' },
  roleBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.background },
  roleBtnActive: { backgroundColor: COLORS.primary },
  roleBtnText: { fontSize: 10, fontWeight: '900', color: COLORS.gray[300] },
  pmsHint: { fontSize: 13, color: COLORS.gray[300], marginBottom: 20, fontWeight: '600', lineHeight: 20, paddingRight: 10 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 14, overflow: 'hidden' },
  eyeIcon: { paddingHorizontal: 15 }
});
