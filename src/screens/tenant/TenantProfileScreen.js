import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Image, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobal } from '../../store/GlobalContext';
import { COLORS, SHADOWS, SPACING, SIZES } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

export const TenantProfileScreen = ({ navigation }) => {
  const { user, logout, language, changeLanguage } = useGlobal();
  const { t } = useTranslation();
  const firstLetter = (user?.name || 'U').charAt(0).toUpperCase();

  const MenuLink = ({ icon, label, onPress, color = COLORS.primary, style }) => (
    <TouchableOpacity style={[styles.menuLink, style]} onPress={onPress}>
      <View style={styles.menuLeft}>
        <View style={[styles.menuIcon, { backgroundColor: color + '10' }]}>
          <MaterialCommunityIcons name={icon} size={22} color={color} />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {label === t('settings.language') && <Text style={styles.currentLanguage}>{language === 'en' ? 'English' : 'Français'}</Text>}
        <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.gray[300]} />
      </View>
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

        <View style={[styles.profileHeader, SHADOWS.soft]}>
          <View style={[styles.avatar, { backgroundColor: COLORS.primary }]}>
            <Text style={styles.avatarText}>{firstLetter}</Text>
            <View style={styles.badge}>
              <MaterialCommunityIcons name="shield-check" size={14} color={COLORS.white} />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.emailText}>{user?.email || 'tenant@campus.com'}</Text>
            <View style={styles.roleTag}>
               <Text style={styles.roleTagText}>{user?.extra ? `${t('tenant.room')}: ${user.extra}` : 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('tenant.your_journeys')}</Text>
          <View style={[styles.menuGroup, SHADOWS.soft]}>
            <MenuLink 
              icon="history" 
              label={t('tenant.past_history')} 
              color={COLORS.secondary} 
              onPress={() => navigation.navigate('Bookings')} 
            />
          </View>
        </View>

         <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.settings')}</Text>
          <View style={[styles.menuGroup, SHADOWS.soft]}>
            <View style={styles.toggleRow}>
               <View style={styles.menuLeft}>
                 <View style={[styles.menuIcon, { backgroundColor: '#8b5cf610' }]}>
                   <MaterialCommunityIcons name="translate" size={22} color="#8b5cf6" />
                 </View>
                 <Text style={styles.menuLabel}>{t('settings.language')}</Text>
               </View>
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
            <MenuLink icon="account-edit-outline" label={t('settings.update_resident_profile')} onPress={() => navigation.navigate('EditProfile')} />
            <View style={styles.divider} />
            <MenuLink icon="bell-ring-outline" label={t('settings.notifications')} onPress={() => navigation.navigate('Notifications')} />
            <View style={styles.divider} />
            <MenuLink icon="shield-lock-outline" label={t('settings.privacy')} onPress={() => navigation.navigate('PrivacySecurity')} />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <MaterialCommunityIcons name="logout-variant" size={20} color={COLORS.white} />
          <Text style={styles.logoutText}>{t('dashboard.logout')}</Text>
        </TouchableOpacity>
        
        <Text style={styles.version}>{t('home.hero_title')} v1.1.0</Text>
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
  scroll: { padding: 30 },
  profileHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.white, 
    borderRadius: 28, 
    padding: 25, 
    marginBottom: 35,
    borderWidth: 1,
    borderColor: COLORS.gray[50]
  },
  avatar: { 
    width: 72, 
    height: 72, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarText: { fontSize: 28, fontWeight: '900', color: COLORS.white },
  badge: { 
    position: 'absolute', 
    bottom: -2, 
    right: -2, 
    backgroundColor: COLORS.secondary, 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    borderWidth: 2, 
    borderColor: COLORS.white, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  profileInfo: { marginLeft: 20, flex: 1 },
  name: { fontSize: 20, fontWeight: '900', color: COLORS.black, letterSpacing: -0.5 },
  emailText: { fontSize: 13, color: COLORS.gray[400], marginTop: 2, fontWeight: '700' },
  roleTag: { 
    backgroundColor: COLORS.secondary + '10', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 8, 
    alignSelf: 'flex-start', 
    marginTop: 10 
  },
  roleTagText: { fontSize: 9, color: COLORS.secondary, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  section: { marginBottom: 30 },
  sectionTitle: { 
    fontSize: 11, 
    fontWeight: '900', 
    color: COLORS.gray[300], 
    textTransform: 'uppercase', 
    letterSpacing: 2, 
    marginLeft: 5, 
    marginBottom: 15 
  },
  menuGroup: { backgroundColor: COLORS.white, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.gray[50] },
  menuLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 18 },
  menuLabel: { fontSize: 14, fontWeight: '800', color: COLORS.black, letterSpacing: 0.3 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  switchBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  langText: { fontSize: 10, fontWeight: '900', color: COLORS.gray[200] },
  activeLang: { color: COLORS.primary },
  currentLanguage: { fontSize: 12, color: COLORS.gray[300], fontWeight: '600' },
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
  logoutText: { 
    fontSize: 14, 
    fontWeight: '900', 
    color: COLORS.white, 
    marginLeft: 10, 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },
  version: { textAlign: 'center', color: COLORS.gray[200], fontSize: 10, marginTop: 50, fontWeight: '800', letterSpacing: 1 },
});

