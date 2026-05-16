import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobal } from '../../store/GlobalContext';
import { COLORS, SHADOWS } from '../../constants/theme';
import { Image } from 'react-native';
import { MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export const DriverProfileScreen = ({ navigation }) => {
  const { user, logout, trips, language, changeLanguage } = useGlobal();
  const { t } = useTranslation();
  const firstLetter = (user?.name || 'D').charAt(0).toUpperCase();
  const licenseValue =
    user?.extra ||
    user?.license ||
    user?.license_number ||
    user?.license_no ||
    user?.license_id ||
    'N/A';
  const vehicleValue =
    user?.special ||
    user?.shuttle_id ||
    user?.vehicle_id ||
    user?.vehicle_no ||
    'N/A';

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTrips = (trips || [])
    .filter(t => t && t.date === todayStr);

  const completedCount = todayTrips.filter(t => t.status === 'completed').length;
  const totalPax = todayTrips.reduce((acc, t) => acc + (t.actual_passengers || 0), 0);

  const DriverRow = ({ icon, label, onPress, color, hideArrow = false }) => (
    <TouchableOpacity style={styles.driverRow} onPress={onPress}>
       <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
         <MaterialCommunityIcons name={icon} size={22} color={color} />
       </View>
       <Text style={styles.rowLabel}>{label}</Text>
       {!hideArrow && (
         <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
           <AntDesign name="right" size={16} color="#cbd5e1" />
         </View>
       )}
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
             <TouchableOpacity style={styles.notificationBtn} onPress={() => navigation.navigate('Notifications')}>
               <MaterialCommunityIcons name="bell-badge-outline" size={20} color={COLORS.white} />
             </TouchableOpacity>
          </View>
          <View style={styles.greetingBox}>
             <Text style={styles.greetText}>{t('dashboard.profile').toUpperCase()}</Text>
             <Text style={styles.tagline}>OPERATIONAL ID: SHUTTLE-02</Text>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, SHADOWS.soft]}>
           <View style={[styles.avatar, { backgroundColor: COLORS.primary }]}>
             <Text style={styles.avatarText}>{firstLetter}</Text>
           </View>
            <View style={{ flex: 1, marginLeft: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.name}>{user?.name}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
                  <MaterialCommunityIcons name="pencil-circle" size={26} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.shiftBadge}>
                <MaterialCommunityIcons name="circle" size={8} color="#10b981" />
                <Text style={styles.shiftText}>On-Duty • {vehicleValue !== 'N/A' ? vehicleValue : 'Shuttle #02'}</Text>
              </View>
            </View>
        </View>

        <View style={styles.statsStrip}>
         <View style={[styles.statBox, { borderColor: COLORS.slate + '40' }]}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.slate + '15' }]}>
               <MaterialCommunityIcons name="bus-clock" size={18} color={COLORS.slate} />
            </View>
            <View>
               <Text style={[styles.statVal, { color: COLORS.black }]}>{todayTrips.length}</Text>
               <Text style={styles.statLbl}>{t('driver.total')}</Text>
            </View>
         </View>
         <View style={[styles.statBox, { borderColor: COLORS.gold + '40' }]}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.gold + '15' }]}>
               <MaterialCommunityIcons name="check-decagram" size={18} color={COLORS.gold} />
            </View>
            <View>
               <Text style={[styles.statVal, { color: COLORS.black }]}>{completedCount}</Text>
               <Text style={styles.statLbl}>{t('driver.done')}</Text>
            </View>
         </View>
         <View style={[styles.statBox, { borderColor: COLORS.secondary + '40' }]}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.secondary + '15' }]}>
               <MaterialCommunityIcons name="account-group" size={18} color={COLORS.secondary} />
            </View>
            <View>
               <Text style={[styles.statVal, { color: COLORS.black }]}>{totalPax}</Text>
               <Text style={styles.statLbl}>{t('driver.pax')}</Text>
            </View>
         </View>
      </View>

      <View style={styles.infoCard}>
         <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('driver.license')}:</Text>
            <Text style={styles.infoValue}>{licenseValue}</Text>
         </View>
         <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vehicle ID:</Text>
            <Text style={styles.infoValue}>{vehicleValue}</Text>
         </View>
      </View>
        <Text style={styles.sectionHeader}>{t('dashboard.settings')}</Text>
        <View style={styles.settingsCard}>
          <View style={styles.driverRow}>
             <View style={[styles.iconBox, { backgroundColor: '#8b5cf620' }]}>
               <MaterialCommunityIcons name="translate" size={22} color="#8b5cf6" />
             </View>
             <Text style={styles.rowLabel}>{t('settings.language')}</Text>
             <View style={styles.switchBox}>
               <Text style={[styles.langText, language === 'en' && styles.activeLang]}>EN</Text>
               <Switch
                 value={language === 'fr'}
                 onValueChange={(val) => changeLanguage(val ? 'fr' : 'en')}
                 trackColor={{ false: COLORS.gray[100], true: COLORS.primary + '40' }}
                 thumbColor={language === 'fr' ? COLORS.primary : COLORS.gray[300]}
                 ios_backgroundColor={COLORS.gray[100]}
               />
               <Text style={[styles.langText, language === 'fr' && styles.activeLang]}>FR</Text>
             </View>
          </View>
          <View style={styles.divider} />
          <DriverRow icon="account-circle-outline" label={t('settings.update_driver_profile')} color="#2563eb" onPress={() => navigation.navigate('EditProfile')} />
          <View style={styles.divider} />
          <DriverRow icon="calendar-clock" label={t('tenant.past_history')} color="#7c3aed" onPress={() => navigation.navigate('Home')} />
          <View style={styles.divider} />
          <DriverRow icon="bell-outline" label={t('settings.notifications')} color="#f59e0b" onPress={() => navigation.navigate('Notifications')} />
          <View style={styles.divider} />
          <DriverRow icon="shield-check-outline" label={t('settings.privacy')} color="#10b981" onPress={() => navigation.navigate('PrivacySecurity')} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <MaterialCommunityIcons name="power" size={24} color={COLORS.white} />
          <Text style={styles.logoutText}>{t('dashboard.logout')}</Text>
        </TouchableOpacity>
        
        <Text style={styles.tagline_footer}>Morgan Shuttle v1.1.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBanner: { backgroundColor: COLORS.primary, paddingBottom: 50, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginTop: 15 },
  headerLogo: { width: 110, height: 35 },
  notificationBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  greetingBox: { paddingHorizontal: 25, marginTop: 40, paddingBottom: 15 },
  greetText: { fontSize: 32, fontWeight: '900', color: COLORS.white, letterSpacing: -1 },
  tagline: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2 },
  scroll: { padding: 30, paddingBottom: 100 },
  profileCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.white, 
    borderRadius: 32, 
    padding: 25, 
    marginBottom: 35, 
    borderWidth: 1, 
    borderColor: COLORS.gray[50],
    ...SHADOWS.soft
  },
  avatar: { width: 72, height: 72, borderRadius: 24, justifyContent: 'center', alignItems: 'center', ...SHADOWS.soft },
  avatarText: { fontSize: 28, fontWeight: '900', color: COLORS.white },
  headerText: { marginLeft: 20 },
  name: { fontSize: 22, fontWeight: '900', color: COLORS.black, letterSpacing: -0.5 },
  shiftBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginTop: 8, gap: 8 },
  shiftText: { fontSize: 10, fontWeight: '900', color: COLORS.secondary, textTransform: 'uppercase', letterSpacing: 1 },
  statsStrip: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  statBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 15, borderRadius: 24, gap: 10, borderWidth: 1.5 },
  statIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '900', color: COLORS.black, letterSpacing: -0.5 },
  statLbl: { fontSize: 8, color: COLORS.gray[300], textTransform: 'uppercase', fontWeight: '900', letterSpacing: 1.5 },
  infoCard: { backgroundColor: COLORS.white, borderRadius: 28, padding: 22, marginBottom: 35, borderWidth: 1, borderColor: COLORS.gray[50], ...SHADOWS.soft },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray[50] },
  infoLabel: { fontSize: 11, color: COLORS.gray[300], fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 },
  infoValue: { fontSize: 14, fontWeight: '900', color: COLORS.black, letterSpacing: -0.3 },
  sectionHeader: { fontSize: 12, fontWeight: '900', color: COLORS.gray[300], textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 15, marginLeft: 5 },
  settingsCard: { backgroundColor: COLORS.white, borderRadius: 28, borderWidth: 1, borderColor: COLORS.gray[50], marginBottom: 15, overflow: 'hidden', ...SHADOWS.soft },
  driverRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, padding: 20 },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 18 },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '900', color: COLORS.black, textTransform: 'uppercase', letterSpacing: 0.8 },
  switchBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  langText: { fontSize: 10, fontWeight: '900', color: COLORS.gray[200] },
  activeLang: { color: COLORS.primary },
  divider: { height: 1, backgroundColor: COLORS.gray[50], marginHorizontal: 20 },
  logoutBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: COLORS.accent, 
    padding: 22, 
    borderRadius: 28, 
    marginTop: 20,
    ...SHADOWS.medium
  },
  logoutText: { fontSize: 14, fontWeight: '900', color: COLORS.white, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 10 },
  tagline_footer: { textAlign: 'center', color: COLORS.gray[200], fontSize: 10, marginTop: 50, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 },
});
