import React from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useTranslation } from 'react-i18next';
import { useGlobal } from '../../store/GlobalContext';
import { isAdminNavigatorRole } from '../../constants/permissions';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

export const NotificationsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { notifications, markNotificationRead, fetchNotifications, user, currentRole } = useGlobal();
  const [localNotifications, setLocalNotifications] = React.useState([]);

  useFocusEffect(
    React.useCallback(() => {
      const load = async () => {
        try {
          if (!user?.id) return;
          const response = await axios.get(`/users/${user.id}/notifications`);
          if (response.data?.success && Array.isArray(response.data.notifications)) {
            setLocalNotifications(response.data.notifications);
          } else {
            setLocalNotifications([]);
          }
        } catch (e) {
          // Fallback to global state if a transient network request fails.
          setLocalNotifications(Array.isArray(notifications) ? notifications : []);
        }
      };
      load();
      fetchNotifications();
    }, [fetchNotifications, notifications, user?.id])
  );

  const formatTimestamp = (value) => {
    if (!value) return '';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return '';
    return `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };
  
  const handleItemPress = (item) => {
    if (!item.isRead) {
      markNotificationRead(item.id);
    }
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topBanner}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
             <TouchableOpacity onPress={() => {
               if (navigation.canGoBack()) {
                 navigation.goBack();
               } else {
                 const dest = isAdminNavigatorRole(currentRole) ? 'AdminMain' : (currentRole === 'driver' ? 'DriverMain' : 'TenantMain');
                 navigation.navigate(dest);
               }
             }}>
               <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
             </TouchableOpacity>
             <Image 
               source={require('../../../assets/image.png')} 
               style={[styles.headerLogo, { tintColor: COLORS.white }]}
               resizeMode="contain" 
             />
             <Text style={styles.headerTitle}>{t('common.alerts')}</Text>
             <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </View>

      <FlatList
        data={localNotifications}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.card, item.isRead && { opacity: 0.7 }]} 
            onPress={() => handleItemPress(item)}
          >
            <View style={[styles.iconBox, item.isRead && { backgroundColor: COLORS.gray[50] }]}>
               <MaterialCommunityIcons name={item.icon || 'bell-outline'} size={24} color={item.isRead ? COLORS.gray[300] : COLORS.primary} />
            </View>
            <View style={styles.content}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
               <Text style={[styles.title, item.isRead && { color: COLORS.gray[300] }]}>{item.title || 'Notification'}</Text>
                 {!item.isRead && <View style={styles.unreadDot} />}
               </View>
               <Text style={[styles.body, item.isRead && { color: COLORS.gray[200] }]}>{item.body || ''}</Text>
               {!!formatTimestamp(item.createdAt) && (
                 <Text style={styles.time}>{formatTimestamp(item.createdAt)}</Text>
               )}
            </View>
          </TouchableOpacity>
        )}

        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{t('common.no_notifications') || 'No notifications yet.'}</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBanner: { backgroundColor: COLORS.primary, paddingBottom: 25, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  headerLogo: { width: 110, height: 35 },
  headerTitle: { fontSize: 13, fontWeight: '900', color: COLORS.white, letterSpacing: 2 },
  list: { padding: 30, paddingBottom: 100 },
  card: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.white, 
    borderRadius: 24, 
    padding: 22, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: COLORS.gray[50],
    ...SHADOWS.soft 
  },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.primary + '10', justifyContent: 'center', alignItems: 'center', marginRight: 18 },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '900', color: COLORS.black, marginBottom: 5, letterSpacing: -0.3 },
  body: { fontSize: 13, color: COLORS.gray[300], lineHeight: 20, fontWeight: '700' },
  time: { fontSize: 10, color: COLORS.gray[200], marginTop: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  empty: { textAlign: 'center', marginTop: 120, color: COLORS.gray[200], fontSize: 15, fontWeight: '800', fontStyle: 'italic' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginRight: 5 },
});

