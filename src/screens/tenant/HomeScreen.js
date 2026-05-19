import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, StatusBar, Dimensions, Image, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobal } from '../../store/GlobalContext';
import { BookingCard } from '../../components/tenant/BookingCard';
import { COLORS, SPACING, SIZES, SHADOWS } from '../../constants/theme';
import { MaterialCommunityIcons, AntDesign, Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { isSameDay, addDays, format } from 'date-fns';

const { width } = Dimensions.get('window');

export const HomeScreen = ({ navigation }) => {
  const { user, trips } = useGlobal();
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dates = Array.from({ length: 8 }, (_, i) => addDays(new Date(), i));
  const filteredTrips = trips.filter(t => {
     if (!t || !t.date) return false;
     const [y, m, d] = t.date.split('-').map(Number);
     const tripDate = new Date(y, m - 1, d);
     
     // 1. If it's the exact same day, always show it
     if (isSameDay(tripDate, selectedDate)) return true;
     
     // 2. If it is a recurring trip, check if the selected date falls within its active period
     if (t.is_recurring) {
        // Strip the time portions so we only compare the calendar days
        const compareSelected = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        const compareTripStart = new Date(tripDate.getFullYear(), tripDate.getMonth(), tripDate.getDate());
        
        // It must be on or after the day the trip was created
        const isAfterStart = compareSelected >= compareTripStart;
        
        let isBeforeEnd = true;
        if (t.recurring_end_date) {
           const [ey, em, ed] = t.recurring_end_date.split('-').map(Number);
           const compareTripEnd = new Date(ey, em - 1, ed);
           isBeforeEnd = compareSelected <= compareTripEnd;
        }
        
        return isAfterStart && isBeforeEnd;
     }
     
     return false;
  });

  const renderDate = ({ item }) => {
    const isSelected = isSameDay(item, selectedDate);
    return (
      <TouchableOpacity
        style={[styles.dateCard, isSelected && styles.dateCardActive]}
        onPress={() => setSelectedDate(item)}
      >
        <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>{format(item, 'EEE')}</Text>
        <Text style={[styles.numText, isSelected && styles.numTextActive]}>{format(item, 'd')}</Text>
        {isSelected && <View style={styles.activeDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Premium Prestigious Header */}
      <View style={styles.topBanner}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
             <Image 
               source={require('../../../assets/image.png')} 
               style={[styles.headerLogo, { tintColor: COLORS.white }]}
               resizeMode="contain" 
             />
             <TouchableOpacity style={styles.notificationBtn} onPress={() => navigation.navigate('Notifications')}>
               <Feather name="bell" size={20} color={COLORS.white} />
               <View style={styles.badgeDot} />
             </TouchableOpacity>
          </View>
          <View style={styles.greetingBox}>
             <Text style={styles.greetText}>{t('home.greeting')}, {user?.name?.split(' ')[0] || 'RESIDENT'}</Text>
             <Text style={styles.tagline}>{t('home.tagline')}</Text>
          </View>
        </SafeAreaView>
        <View style={styles.headerCurve} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Modern Date Selection */}
        <View style={styles.calendarSection}>
          <FlatList
            data={dates}
            renderItem={renderDate}
            keyExtractor={d => d.toISOString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateList}
          />
        </View>

        {/* Immersive Spotlight */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{t('home.spotlight')}</Text>
        </View>

        <TouchableOpacity style={[styles.heroCard, SHADOWS.medium]} activeOpacity={0.95}>
          <ImageBackground 
            source={{ uri: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=800&auto=format&fit=crop' }} 
            style={styles.heroImg}
            imageStyle={{ borderRadius: 24 }}
          >
            <View style={styles.heroOverlay}>
              <View style={styles.heroTag}><Text style={styles.heroTagText}>{t('home.new_adventure')}</Text></View>
              <View>
                <Text style={styles.heroTitle}>{t('home.hero_title')}</Text>
                <Text style={styles.heroDesc}>{t('home.hero_desc')}</Text>
              </View>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        {/* Shuttle Routes Section */}
        <View style={styles.routeHeader}>
          <Text style={styles.sectionTitle}>{t('home.transit_schedule')}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{t('home.tours', { count: filteredTrips.length })}</Text>
          </View>
        </View>

        <View style={styles.routeContainer}>
          {filteredTrips.map(item => (
            <BookingCard key={item.id} trip={item} />
          ))}

          {filteredTrips.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="clock" size={48} color={COLORS.gray[200]} />
              <Text style={styles.emptyMsg}>{t('home.no_tours')}</Text>
              <Text style={styles.emptySub}>{t('home.select_another')}</Text>
            </View>
          )}
        </View>

        {/* RESIDENT SERVICES SECTION */}
        <View style={[styles.sectionHead, { marginTop: 30 }]}>
          <Text style={styles.sectionTitle}>{t('home.resident_services')}</Text>
        </View>
        
        <View style={styles.servicesGrid}>
          <TouchableOpacity
            style={[styles.serviceCard, SHADOWS.soft]}
            onPress={() => navigation.navigate('LiveTracking', { shuttleOnly: true })}
          >
             <View style={[styles.serviceIcon, { backgroundColor: COLORS.secondary + '18' }]}>
                <Feather name="map-pin" size={18} color={COLORS.secondary} />
             </View>
             <View style={{ flex: 1 }}>
                <Text style={styles.serviceTitle}>{t('tenant.live_map') || 'Live shuttle map'}</Text>
                <Text style={styles.serviceSub}>{t('tenant.live_map_hint') || 'See the shuttle during active shifts'}</Text>
             </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.serviceCard, SHADOWS.soft]} 
            onPress={() => navigation.navigate('Requests')}
          >
             <View style={[styles.serviceIcon, { backgroundColor: COLORS.accent + '15' }]}>
                <Feather name="plus-circle" size={18} color={COLORS.accent} />
             </View>
             <View style={{ flex: 1 }}>
                <Text style={styles.serviceTitle}>{t('dashboard.request')}</Text>
                <Text style={styles.serviceSub}>{t('home.special_run')}</Text>
             </View>
          </TouchableOpacity>
        </View>

        {/* Brand Narrative Card */}
        <View style={[styles.narrativeCard, { backgroundColor: COLORS.primary }]}>
           <Image 
             source={require('../../../assets/image.png')} 
             style={styles.narrativeLogo}
             resizeMode="contain" 
           />
           <Text style={styles.narrativeTitle}>{t('home.elevated_living')}</Text>
           <Text style={styles.narrativeSub}>{t('home.narrative_sub')}</Text>
           <TouchableOpacity 
             style={styles.narrativeBtn}
             onPress={() => navigation.navigate('Requests')}
           >
             <Text style={styles.narrativeBtnText}>{t('home.discover_morgan')}</Text>
             <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.primary} />
           </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBanner: { backgroundColor: COLORS.primary, paddingBottom: 40, borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginTop: 15 },
  headerLogo: { width: 110, height: 35 },
  notificationBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  badgeDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent, borderWidth: 1.5, borderColor: COLORS.primary },
  greetingBox: { paddingHorizontal: 25, marginTop: 30, paddingBottom: 15 },
  greetText: { fontSize: 28, fontWeight: '900', color: COLORS.white, letterSpacing: -0.5 },
  tagline: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 6, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  scrollContent: { paddingTop: 25 },
  calendarSection: { marginBottom: 30 },
  dateList: { paddingHorizontal: 25, gap: 12 },
  dateCard: { width: 52, height: 72, backgroundColor: COLORS.white, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.gray[100] },
  dateCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayText: { fontSize: 10, fontWeight: '900', color: COLORS.gray[300], textTransform: 'uppercase' },
  dayTextActive: { color: 'rgba(255,255,255,0.6)' },
  numText: { fontSize: 18, fontWeight: '900', color: COLORS.black, marginTop: 2 },
  numTextActive: { color: COLORS.white },
  activeDot: { position: 'absolute', bottom: 8, width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.accent },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 15 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.gray[300], letterSpacing: 1.5, textTransform: 'uppercase' },
  viewMore: { fontSize: 12, fontWeight: '800', color: COLORS.primary, letterSpacing: 1 },
  heroCard: { marginHorizontal: 25, borderRadius: 24, height: 260, marginBottom: 35 },
  heroImg: { flex: 1, justifyContent: 'flex-end' },
  heroOverlay: { padding: 25, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 24, flex: 1, justifyContent: 'space-between' },
  heroTag: { backgroundColor: COLORS.accent, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start' },
  heroTagText: { color: COLORS.white, fontSize: 9, fontWeight: '900' },
  heroTitle: { color: COLORS.white, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  heroDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700', marginTop: 5 },
  routeHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, marginBottom: 20, gap: 12 },
  countBadge: { backgroundColor: COLORS.secondary + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  countText: { color: COLORS.secondary, fontSize: 10, fontWeight: '900' },
  routeContainer: { paddingHorizontal: 25 },
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyMsg: { marginTop: 15, fontSize: 16, fontWeight: '800', color: COLORS.black },
  emptySub: { fontSize: 13, color: COLORS.gray[300], marginTop: 5, fontWeight: '600' },
  narrativeCard: { marginHorizontal: 25, padding: 35, borderRadius: 32, alignItems: 'center', marginTop: 30 },
  narrativeLogo: { width: 100, height: 30, tintColor: COLORS.white, marginBottom: 20 },
  narrativeTitle: { fontSize: 16, fontWeight: '900', color: COLORS.white, letterSpacing: 2, textAlign: 'center' },
  narrativeSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 12, lineHeight: 22, fontWeight: '700' },
  narrativeBtn: { backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, marginTop: 25, flexDirection: 'row', alignItems: 'center', gap: 8 },
  narrativeBtnText: { color: COLORS.primary, fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  servicesGrid: { flexDirection: 'row', gap: 15, paddingHorizontal: 25 },
  serviceCard: { 
    flex: 1,
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.white, 
    padding: 15, 
    borderRadius: 20, 
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[50]
  },
  serviceIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  serviceTitle: { fontSize: 13, fontWeight: '900', color: COLORS.black, letterSpacing: 0.3 },
  serviceSub: { fontSize: 8, color: COLORS.gray[300], fontWeight: '900', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },
});



