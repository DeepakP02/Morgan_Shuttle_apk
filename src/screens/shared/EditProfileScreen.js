import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert, Platform, StatusBar, TouchableOpacity, Image, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobal } from '../../store/GlobalContext';
import { Button } from '../../components/shared/Button';
import { COLORS, SHADOWS } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export const EditProfileScreen = ({ navigation }) => {
  const { user, updateUser, currentRole } = useGlobal();
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const initialPhone = user?.phone || user?.mobile || user?.mobile_number || user?.phone_number || '';
  const initialExtra =
    user?.extra ||
    user?.license ||
    user?.license_number ||
    user?.license_no ||
    user?.license_id ||
    user?.room ||
    user?.room_number ||
    user?.room_no ||
    '';
  const initialSpecial = user?.special || user?.shuttle_id || user?.vehicle_id || user?.vehicle_no || '';
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: initialPhone,
    extra: initialExtra,
    special: initialSpecial,
  });

  const isDriver = currentRole === 'driver';
  const isTenant = currentRole === 'tenant';
  const profileUpdateTitle = isDriver
    ? t('settings.update_driver_profile')
    : isTenant
      ? t('settings.update_resident_profile')
      : t('settings.update_admin_profile');

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert(t('common.error'), t('auth.empty_error'));
      return;
    }
    setSaving(true);
    try {
      await updateUser(formData);
      Alert.alert(t('common.success'), t('settings.profile_updated'), [
        { text: t('common.ok'), onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert(t('common.error'), error.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topBanner}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
             <TouchableOpacity onPress={() => navigation.goBack()}>
               <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.white} />
             </TouchableOpacity>
             <Image 
               source={require('../../../assets/image.png')} 
               style={styles.headerLogo}
               resizeMode="contain" 
             />
             <Text style={styles.headerTitle}>{profileUpdateTitle.toUpperCase()}</Text>
             <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarSection}>
           <View style={styles.avatar}>
             <Image 
               source={require('../../../assets/image.png')} 
               style={styles.avatarImage}
               resizeMode="contain"
             />
           </View>
           <Text style={styles.changeLabel}>{currentRole.toUpperCase()} {t('dashboard.profile')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.name').toUpperCase()}</Text>
            <TextInput 
              style={styles.input} 
              value={formData.name} 
              onChangeText={(txt) => setFormData({...formData, name: txt})}
              placeholder="..."
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.email').toUpperCase()}</Text>
            <TextInput 
              style={styles.input} 
              value={formData.email} 
              onChangeText={(txt) => setFormData({...formData, email: txt})}
              placeholder="..."
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>MOBILE NUMBER</Text>
            <TextInput 
              style={styles.input} 
              value={formData.phone} 
              onChangeText={(txt) => setFormData({...formData, phone: txt})}
              placeholder="..."
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{isDriver ? t('driver.license').toUpperCase() : t('tenant.room')}</Text>
            <TextInput 
              style={styles.input} 
              value={formData.extra} 
              onChangeText={(txt) => setFormData({...formData, extra: txt})}
              placeholder="..."
            />
          </View>

          {isDriver && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ASSIGNED SHUTTLE ID</Text>
              <TextInput 
                style={styles.input} 
                value={formData.special} 
                onChangeText={(txt) => setFormData({...formData, special: txt})}
                placeholder="..."
              />
            </View>
          )}
        </View>

        <Button 
          title={t('common.save')} 
          loading={saving}
          onPress={handleSave} 
          style={styles.saveBtn}
        />
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBanner: { backgroundColor: COLORS.primary, paddingBottom: 50, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginTop: 15 },
  headerLogo: { width: 110, height: 35 },
  headerTitle: { fontSize: 13, fontWeight: '900', color: COLORS.white, letterSpacing: 2 },
  scroll: { padding: 30, paddingBottom: 100 },
  avatarSection: { alignItems: 'center', marginBottom: 40, marginTop: 10 },
  avatar: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    backgroundColor: COLORS.white, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 15,
    borderWidth: 2,
    borderColor: COLORS.primary
  },
  avatarImage: {
    width: '80%',
    height: '80%',
  },
  avatarText: { fontSize: 36, fontWeight: '900', color: COLORS.primary },
  changeLabel: { color: COLORS.primary, fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 2 },
  form: { 
    backgroundColor: COLORS.white, 
    borderRadius: 30, 
    padding: 25, 
    gap: 20, 
    marginBottom: 40 
  },
  inputGroup: { gap: 8 },
  label: { fontSize: 11, fontWeight: '900', color: COLORS.gray[300], letterSpacing: 1.5, textTransform: 'uppercase' },
  input: { 
    backgroundColor: COLORS.gray[100], 
    borderRadius: 12, 
    padding: 15, 
    fontSize: 16, 
    color: COLORS.black, 
    fontWeight: '600', 
  },
  saveBtn: { 
    height: 60, 
    borderRadius: 16, 
    backgroundColor: COLORS.primary,
  },
});
