import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobal } from '../../store/GlobalContext';
import { COLORS, SHADOWS } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export const DrivingLicenseScreen = ({ navigation }) => {
  const { user } = useGlobal();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topBanner}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')} style={styles.backBtn}>
              <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('driver.license')}</Text>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.licenseCard, SHADOWS.medium]}>
           <View style={styles.cardHeader}>
              <Image 
                source={require('../../../assets/image.png')} 
                style={[styles.logo, { tintColor: COLORS.primary }]} 
                resizeMode="contain" 
              />
              <View style={styles.verifiedBadge}>
                 <MaterialCommunityIcons name="shield-check" size={14} color={COLORS.secondary} />
                 <Text style={styles.verifiedText}>{t('driver.verified')}</Text>
              </View>
           </View>

           <View style={styles.mainInfo}>
              <Text style={styles.label}>{t('driver.license').toUpperCase()} NUMBER</Text>
              <Text style={styles.value}>{user?.extra || 'MLH-9928-1029-X'}</Text>
              
              <View style={styles.grid}>
                 <View style={styles.gridItem}>
                    <Text style={styles.label}>CLASS</Text>
                    <Text style={styles.value}>Commercial (Heavy)</Text>
                 </View>
                 <View style={styles.gridItem}>
                    <Text style={styles.label}>EXPIRY</Text>
                    <Text style={[styles.value, { color: COLORS.accent }]}>DEC 2028</Text>
                 </View>
              </View>
           </View>

           <View style={styles.holderBox}>
              <View style={styles.avatar}>
                 <Text style={styles.avatarTxt}>{(user?.name || 'D').charAt(0)}</Text>
              </View>
              <View>
                 <Text style={styles.holderLabel}>LICENSED TO</Text>
                 <Text style={styles.holderName}>{user?.name}</Text>
                 <Text style={styles.org}>Morgan Campus Habitations</Text>
              </View>
           </View>
        </View>

        <View style={styles.infoBox}>
           <MaterialCommunityIcons name="information-outline" size={20} color={COLORS.primary} />
           <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Verification Active</Text>
              <Text style={styles.infoSub}>Your license is currently in good standing and cleared for all shuttle operations within the campus premises.</Text>
           </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBanner: { backgroundColor: COLORS.primary, paddingBottom: 40, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', marginRight: 44, fontSize: 18, fontWeight: '900', color: COLORS.white, textTransform: 'uppercase', letterSpacing: 1.5 },
  scroll: { padding: 25, paddingBottom: 50 },
  licenseCard: { backgroundColor: COLORS.white, borderRadius: 32, padding: 30, marginBottom: 30, borderWidth: 1, borderColor: COLORS.gray[50] },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 35 },
  logo: { width: 100, height: 30 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.background, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  verifiedText: { fontSize: 10, fontWeight: '900', color: COLORS.secondary, letterSpacing: 1 },
  mainInfo: { marginBottom: 35 },
  label: { fontSize: 9, fontWeight: '900', color: COLORS.gray[300], letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' },
  value: { fontSize: 18, fontWeight: '900', color: COLORS.black, letterSpacing: 0.5, marginBottom: 25 },
  grid: { flexDirection: 'row', gap: 30 },
  gridItem: { flex: 1 },
  holderBox: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingTop: 30, borderTopWidth: 1, borderTopColor: COLORS.gray[50] },
  avatar: { width: 54, height: 54, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { fontSize: 24, fontWeight: '900', color: COLORS.white },
  holderLabel: { fontSize: 8, fontWeight: '900', color: COLORS.gray[300], letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
  holderName: { fontSize: 16, fontWeight: '900', color: COLORS.black, letterSpacing: -0.3 },
  org: { fontSize: 10, fontWeight: '800', color: COLORS.primary, opacity: 0.7, marginTop: 2 },
  infoBox: { flexDirection: 'row', gap: 15, backgroundColor: COLORS.white, padding: 22, borderRadius: 24, borderWidth: 1, borderColor: COLORS.gray[50] },
  infoText: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '900', color: COLORS.black, marginBottom: 4 },
  infoSub: { fontSize: 12, fontWeight: '700', color: COLORS.gray[300], lineHeight: 18 },
});
