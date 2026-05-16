import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobal } from '../../store/GlobalContext';
import { COLORS, SPACING } from '../../constants/theme';
import { MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next/dist/commonjs/index.js';

export const ProfileScreen = ({ navigation }) => {
  const { user, logout, currentRole, language, changeLanguage } = useGlobal();
  const { t } = useTranslation();

  const userName = user?.name || 'User';
  const firstLetter = userName.charAt(0).toUpperCase();

  const MenuLink = ({ icon, label, onPress, color = COLORS.black }) => (
    <TouchableOpacity style={styles.menuLink} onPress={onPress}>
      <View style={styles.menuLeft}>
        <View style={[styles.menuIcon, { backgroundColor: color + '15' }]}>
          <MaterialCommunityIcons name={icon} size={22} color={color} />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <View style={styles.menuRight}>
        {label === t('settings.language') && <Text style={styles.currentLanguage}>{language === 'en' ? 'English' : 'Français'}</Text>}
        <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.gray[300]} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{firstLetter}</Text>
          </View>
          <Text style={styles.name}>{userName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{currentRole ? currentRole.toUpperCase() : 'USER'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.settings')}</Text>
          <MenuLink 
            icon="translate" 
            label={t('settings.language')} 
            color="#8b5cf6" 
            onPress={() => {
              Alert.alert(
                t('settings.language'),
                t('settings.language_description'),
                [
                  { text: t('settings.english'), onPress: () => changeLanguage('en') },
                  { text: t('settings.french'), onPress: () => changeLanguage('fr') },
                  { text: t('common.cancel'), style: 'cancel' }
                ]
              );
            }} 
          />
          <MenuLink icon="account-outline" label="Edit Profile" color="#2563eb" onPress={() => navigation.navigate('EditProfile')} />
          <MenuLink icon="bell-outline"    label="Notifications" color="#f59e0b" onPress={() => navigation.navigate('Notifications')} />
          <MenuLink icon="shield-check-outline" label="Privacy & Security" color="#10b981" onPress={() => navigation.navigate('PrivacySecurity')} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <MenuLink icon="help-circle-outline" label="Help Center" color="#64748b" onPress={() => navigation.navigate('HelpCenter')} />
          <MenuLink icon="file-document-outline" label="Terms of Service" color="#64748b" onPress={() => navigation.navigate('TermsOfService')} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <MaterialCommunityIcons name="logout" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>{t('dashboard.logout')}</Text>
        </TouchableOpacity>
        
        <Text style={styles.version}>v1.0.4 (Build 509)</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { padding: 20 },
  profileHeader: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 10, shadowColor: '#2563eb', shadowOpacity: 0.2, shadowRadius: 10 },
  avatarText: { fontSize: 40, fontWeight: 'bold', color: '#ffffff' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  roleBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: '#dbeafe' },
  roleText: { fontSize: 12, fontWeight: 'bold', color: '#2563eb' },
  section: { backgroundColor: '#ffffff', borderRadius: 20, padding: 10, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#64748b', marginLeft: 10, marginBottom: 10, marginTop: 5 },
  menuLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuLabel: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currentLanguage: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff1f2', padding: 16, borderRadius: 16, marginTop: 10, gap: 10, borderWidth: 1, borderColor: '#fecdd3' },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#e11d48' },
  version: { textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 30 },
});
