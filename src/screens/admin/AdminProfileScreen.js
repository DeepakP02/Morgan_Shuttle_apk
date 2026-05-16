import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Dimensions, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobal } from '../../store/GlobalContext';
import { COLORS, SHADOWS } from '../../constants/theme';
import { Image } from 'react-native';
import { MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

const { width } = Dimensions.get('window');

export const AdminProfileScreen = ({ navigation }) => {
  const { user, logout, language, changeLanguage } = useGlobal();
  const { t } = useTranslation();
  const firstLetter = (user?.name || 'A').charAt(0).toUpperCase();

   const ActionBtn = ({ icon, label, onPress, color }) => (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
       <View style={[styles.actionIconBox, { backgroundColor: color + '15' }]}>
         <MaterialCommunityIcons name={icon} size={22} color={color} />
       </View>
       <Text 
         style={styles.actionLabel} 
         numberOfLines={1} 
         adjustsFontSizeToFit
       >
         {label}
       </Text>
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
             <Text style={styles.headerTitle}>{t('dashboard.profile').toUpperCase()}</Text>
             <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card Section */}
        <View style={[styles.profileCard, SHADOWS.soft]}>
           <View style={[styles.avatar, { backgroundColor: COLORS.primary }]}>
             <Text style={styles.avatarText}>{firstLetter}</Text>
             <View style={styles.statusDot} />
           </View>
           <View style={styles.headerText}>
              <Text style={styles.name}>{user?.name}</Text>
              <Text style={styles.adminTag} numberOfLines={1} adjustsFontSizeToFit>{t('admin.system_admin')} • ID: #9932</Text>
            </View>
        </View>

        {/* Quick Stats / Summary Grid */}
        <View style={styles.statsGrid}>
           <View style={styles.statBox}>
              <Text style={styles.statVal} numberOfLines={1} adjustsFontSizeToFit>{t('admin.active_status')}</Text>
              <Text style={styles.statLbl}>{t('admin.status')}</Text>
           </View>
           <View style={[styles.statBox, { backgroundColor: '#eff6ff' }]}>
              <Text style={[styles.statVal, { color: '#2563eb' }]} numberOfLines={1} adjustsFontSizeToFit>{t('admin.access_full')}</Text>
              <Text style={styles.statLbl}>{t('admin.access')}</Text>
           </View>
        </View>

        {/* Console Controls - Grid Layout */}
        <Text style={styles.sectionHeader}>{t('dashboard.home')}</Text>
        <View style={styles.gridRow}>
           <ActionBtn icon="view-dashboard" label={t('dashboard.schedule')} color={COLORS.slate} onPress={() => navigation.navigate('Schedule')} />
           <ActionBtn icon="bus-multiple" label={t('dashboard.requests')} color={COLORS.accent} onPress={() => navigation.navigate('Requests')} />
           <ActionBtn icon="map-marker-path" label={t('dashboard.places')} color={COLORS.taupe} onPress={() => navigation.navigate('Places')} />
        </View>
        <View style={[styles.gridRow, { marginTop: 12 }]}>
           <ActionBtn
             icon="map-marker-radius"
             label={t('admin.live_shuttle') || 'Live shuttle'}
             color={COLORS.secondary}
             onPress={() => navigation.navigate('LiveTracking', { shuttleOnly: true, fromAdmin: true })}
           />
           <ActionBtn icon="file-document" label={t('dashboard.logs')} color={COLORS.gray[300]} onPress={() => navigation.navigate('Logs')} />
           <View style={{ flex: 1, minWidth: 0 }} />
        </View>

        {/* Personnel Management - New Section per Client Doc */}
        <Text style={styles.sectionHeader}>{t('settings.personnel')}</Text>
        <View style={styles.manageBox}>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AdminUsers', { type: 'drivers' })}>
               <View style={[styles.iconBox, {backgroundColor: COLORS.gold + '10'}]}><MaterialCommunityIcons name="account-tie" size={20} color={COLORS.gold} /></View>
               <View style={styles.menuInfo}>
                  <Text style={styles.menuTitle}>{t('settings.drivers_fleet')}</Text>
                  <Text style={styles.menuSub}>{t('settings.drivers_fleet_desc')}</Text>
               </View>
               <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.gray[100]} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AdminUsers', { type: 'tenants' })}>
               <View style={[styles.iconBox, {backgroundColor: COLORS.secondary + '10'}]}><MaterialCommunityIcons name="account-group" size={20} color={COLORS.secondary} /></View>
               <View style={styles.menuInfo}>
                  <Text style={styles.menuTitle}>{t('settings.resident_dir')}</Text>
                  <Text style={styles.menuSub}>{t('settings.resident_dir_desc')}</Text>
               </View>
               <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.gray[100]} />
            </TouchableOpacity>
        </View>

        {/* Preferences */}
        <Text style={styles.sectionHeader}>{t('dashboard.settings')}</Text>
        <View style={styles.menuBox}>
           <View style={styles.menuItem}>
              <MaterialCommunityIcons name="translate" size={20} color="#8b5cf6" />
              <Text style={styles.menuText}>{t('settings.language')}</Text>
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
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EditProfile')}>
               <MaterialCommunityIcons name="account-cog-outline" size={20} color="#64748b" />
               <Text style={styles.menuText}>{t('settings.update_admin_profile')}</Text>
               <MaterialCommunityIcons name="chevron-right" size={14} color="#cbd5e1" />
            </TouchableOpacity>
            <View style={styles.divider} />
             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('PrivacySecurity')}>
                <MaterialCommunityIcons name="shield-lock-outline" size={20} color="#64748b" />
                <Text style={styles.menuText}>{t('settings.privacy')}</Text>
                <MaterialCommunityIcons name="chevron-right" size={14} color="#cbd5e1" />
             </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Notifications')}>
               <MaterialCommunityIcons name="bell-outline" size={20} color="#64748b" />
               <Text style={styles.menuText}>{t('settings.notifications')}</Text>
               <MaterialCommunityIcons name="chevron-right" size={14} color="#cbd5e1" />
            </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <MaterialCommunityIcons name="logout-variant" size={20} color={COLORS.white} />
          <Text style={styles.logoutText}>{t('dashboard.logout')}</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionTag}>Morgan Shuttle Admin v1.0.4 r2</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBanner: { backgroundColor: COLORS.primary, paddingBottom: 25, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  headerLogo: { width: 110, height: 35 },
  headerTitle: { fontSize: 13, fontWeight: '900', color: COLORS.white, letterSpacing: 2 },
  scroll: { padding: 20 },
  profileCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.white, 
    borderRadius: 28, 
    padding: 20, 
    marginBottom: 25, 
    borderWidth: 1, 
    borderColor: COLORS.gray[50] 
  },
  avatar: { width: 72, height: 72, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 28, fontWeight: '900', color: COLORS.white },
  statusDot: { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.secondary, borderWidth: 3, borderColor: COLORS.white },
  headerText: { marginLeft: 20 },
  name: { fontSize: 20, fontWeight: '900', color: COLORS.black, letterSpacing: -0.5 },
  adminTag: { fontSize: 10, color: COLORS.gray[400], marginTop: 4, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  statBox: { flex: 1, backgroundColor: COLORS.white, padding: 15, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: COLORS.gray[50] },
  statVal: { fontSize: 12, fontWeight: '900', color: COLORS.secondary, textTransform: 'uppercase' },
  statLbl: { fontSize: 9, color: COLORS.gray[300], textTransform: 'uppercase', marginTop: 4, fontWeight: '800', letterSpacing: 0.5 },
  sectionHeader: { fontSize: 11, fontWeight: '900', color: COLORS.gray[300], textTransform: 'uppercase', letterSpacing: 2, marginBottom: 15, marginLeft: 5 },
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  actionBtn: { flex: 1, backgroundColor: COLORS.white, padding: 15, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.gray[50] },
  actionIconBox: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  actionLabel: { fontSize: 10, fontWeight: '900', color: COLORS.black, textTransform: 'uppercase', letterSpacing: 0.3 },
  menuBox: { backgroundColor: COLORS.white, borderRadius: 28, padding: 8, marginBottom: 35, borderWidth: 1, borderColor: COLORS.gray[50] },
  manageBox: { backgroundColor: COLORS.white, borderRadius: 28, padding: 8, marginBottom: 35, borderWidth: 1, borderColor: COLORS.gray[50] },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  menuInfo: { flex: 1, marginLeft: 15 },
  menuTitle: { fontSize: 14, fontWeight: '900', color: COLORS.black, letterSpacing: 0.3 },
  menuSub: { fontSize: 11, color: COLORS.gray[400], marginTop: 2, fontWeight: '700' },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  menuText: { flex: 1, fontSize: 14, fontWeight: '800', color: COLORS.black, marginLeft: 15 },
  switchBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  langText: { fontSize: 10, fontWeight: '900', color: COLORS.gray[200] },
  activeLang: { color: COLORS.primary },
  currentLanguage: { fontSize: 12, color: COLORS.gray[300], fontWeight: '600', marginRight: 10 },
  divider: { height: 1, backgroundColor: COLORS.gray[50], marginHorizontal: 20 },
  logoutBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: COLORS.accent, 
    padding: 20, 
    borderRadius: 24, 
    marginTop: 20,
    ...SHADOWS.medium
  },
  logoutText: { fontSize: 14, fontWeight: '900', color: COLORS.white, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 10 },
  versionTag: { textAlign: 'center', color: COLORS.gray[200], fontSize: 10, marginTop: 50, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
});
