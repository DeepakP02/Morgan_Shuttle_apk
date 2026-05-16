import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Platform, StatusBar, TouchableOpacity, Image, Alert, Modal, TextInput, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useGlobal } from '../../store/GlobalContext';

// SecureStore only allows alphanumeric, '.', '-', '_' — sanitize email/id before use
const getSettingsKey = (identifier) => {
  const safe = (identifier || 'default').toString().replace(/[^a-zA-Z0-9._-]/g, '_');
  return `morgan_user_settings_${safe}`;
};

// Defined OUTSIDE the parent component so React never recreates its identity on re-render.
// If defined inside, ALL switches animate when ANY one changes — classic iOS bug.
const SettingRow = React.memo(({ label, value, onValueChange, icon }) => (
  <View style={settingRowStyles.settingRow}>
    <View style={settingRowStyles.rowLeft}>
      <View style={settingRowStyles.iconBox}>
        <MaterialCommunityIcons name={icon} size={20} color="#2563eb" />
      </View>
      <Text style={settingRowStyles.settingLabel}>{label}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: COLORS.gray[100], true: COLORS.primary }}
      thumbColor={Platform.OS === 'ios' ? '#ffffff' : value ? COLORS.white : COLORS.gray[100]}
    />
  </View>
));

const settingRowStyles = StyleSheet.create({
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.primary + '10', justifyContent: 'center', alignItems: 'center', marginRight: 18 },
  settingLabel: { fontSize: 15, fontWeight: '900', color: COLORS.black, letterSpacing: -0.3 },
});

export const PrivacySecurityScreen = ({ navigation }) => {
  const { user, updateUser, currentRole } = useGlobal();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [settings, setSettings] = useState({
    biometrics: false,
    notifications: true,
    dataSharing: true,
  });
  const [biometricPassword, setBiometricPassword] = useState('');
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Load settings from SecureStore on mount — scoped per user
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(getSettingsKey(user.id));
        if (stored) setSettings(JSON.parse(stored));
        else setSettings({ biometrics: false, notifications: true, dataSharing: true });
      } catch (e) {
        console.warn('Could not load settings:', e.message);
      }
    })();
  }, [user?.id]);

  const saveSettings = async (updated) => {
    // We already call setSettings in the caller for UX, so just persist here
    try {
      await SecureStore.setItemAsync(getSettingsKey(user?.id), JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save settings:', e.message);
    }
  };

   const handleToggle = async (key) => {
    if (key === 'biometrics' && !settings.biometrics) {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!compatible || !enrolled) {
        return Alert.alert('Not Supported', 'No biometric hardware found or enrolled.');
      }
      const savedEmail = await SecureStore.getItemAsync('biometric_email');
      const savedPassword = await SecureStore.getItemAsync('biometric_password');
      if (!savedEmail || !savedPassword) {
        setShowBiometricSetup(true);
        return;
      }
    }

    const newValue = !settings[key];
    const updated = { ...settings, [key]: newValue };
    setSettings(updated);

    if (key === 'biometrics' && !newValue) {
      await SecureStore.deleteItemAsync('biometric_email');
      await SecureStore.deleteItemAsync('biometric_password');
    }
    await saveSettings(updated);
  };

  const verifyAndEnableBiometrics = async () => {
    if (!biometricPassword) return;
    setIsVerifying(true);
    try {
      // We assume the user email is available in GlobalContext
      if (user?.email) {
        // We save it to SecureStore. Next time they use biometric button on login, 
        // it will successfully fetch these.
        await SecureStore.setItemAsync('biometric_email', user.email);
        await SecureStore.setItemAsync('biometric_password', biometricPassword);
        
        const updated = { ...settings, biometrics: true };
        setSettings(updated);
        await saveSettings(updated);
        setShowBiometricSetup(false);
        setBiometricPassword('');
        Alert.alert("Success", "Biometric login enabled.");
      }
    } catch (e) {
      Alert.alert("Error", "Could not enable biometrics.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetPassword = async () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        "Reset Password",
        "Enter your new secure password:",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Update", 
            onPress: async (pw) => {
              if (pw.length < 6) return Alert.alert("Error", "Password too short.");
              try {
                await updateUser({ password: pw });
                Alert.alert("Success", "Password updated successfully.");
              } catch (e) {
                Alert.alert("Error", "Could not update password.");
              }
            } 
          }
        ],
        "secure-text"
      );
    } else {
      setShowPasswordModal(true);
    }
  };

  const saveNewPassword = async () => {
    if (newPassword.length < 6) return Alert.alert("Error", "Password too short.");
    try {
      await updateUser({ password: newPassword });
      setShowPasswordModal(false);
      setNewPassword('');
      Alert.alert("Success", "Password updated successfully.");
    } catch (e) {
      Alert.alert("Error", "Could not update password.");
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
                 const dest = currentRole === 'admin' ? 'AdminMain' : (currentRole === 'driver' ? 'DriverMain' : 'TenantMain');
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
             <Text style={styles.headerTitle}>SECURITY HUB</Text>
             <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Preferences</Text>
        </View>

        <View style={styles.card}>
          <SettingRow 
            label="Biometric Login" 
            value={settings.biometrics} 
            onValueChange={() => handleToggle('biometrics')} 
            icon="fingerprint"
          />
          <View style={styles.separator} />
          <SettingRow 
             label="Ride Notifications" 
             value={settings.notifications} 
             onValueChange={() => handleToggle('notifications')} 
             icon="bell-ring-outline"
          />
        </View>

        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Privacy Controls</Text>
        </View>

        <View style={styles.card}>
          <SettingRow 
            label="Share Ride Activity" 
            value={settings.dataSharing} 
            onValueChange={() => handleToggle('dataSharing')} 
            icon="account-group-outline"
          />
          <View style={styles.separator} />
          <TouchableOpacity style={styles.resetBtn} onPress={handleResetPassword}>
             <MaterialCommunityIcons name="lock-reset" size={20} color={COLORS.accent} />
             <Text style={styles.resetText}>RESET LOGIN PASSWORD</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>
          Your data is processed according to Morgan's Privacy Policy. We do not sell your personal information.
        </Text>
      </ScrollView>

      {/* Android Reset Modal */}
      <Modal visible={showPasswordModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={20}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>New Password</Text>
              <TextInput style={styles.modalInput} secureTextEntry placeholder="Min 6 characters" value={newPassword} onChangeText={setNewPassword} />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShowPasswordModal(false)} style={styles.modalBtnSec}><Text style={styles.modalBtnTextSec}>CANCEL</Text></TouchableOpacity>
                <TouchableOpacity onPress={saveNewPassword} style={styles.modalBtnPri}><Text style={styles.modalBtnTextPri}>UPDATE</Text></TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Biometric Password Verification Modal */}
      <Modal visible={showBiometricSetup} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={20}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Enable Biometrics</Text>
              <Text style={{ fontSize: 13, color: COLORS.gray[300], marginBottom: 20, fontWeight: '600' }}>
                Please enter your current account password once to securely enable biometric login.
              </Text>
              <TextInput 
                style={styles.modalInput} 
                secureTextEntry 
                placeholder="Current Password" 
                value={biometricPassword} 
                onChangeText={setBiometricPassword} 
              />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShowBiometricSetup(false)} style={styles.modalBtnSec}><Text style={styles.modalBtnTextSec}>CANCEL</Text></TouchableOpacity>
                <TouchableOpacity onPress={verifyAndEnableBiometrics} style={styles.modalBtnPri} disabled={isVerifying}>
                  {isVerifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnTextPri}>ENABLE</Text>}
                </TouchableOpacity>
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
  headerTitle: { fontSize: 13, fontWeight: '900', color: COLORS.white, letterSpacing: 2 },
  scroll: { padding: 30, paddingBottom: 100 },
  sectionHeader: { marginBottom: 15 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: COLORS.gray[300], letterSpacing: 2, marginLeft: 5, textTransform: 'uppercase' },
  card: { backgroundColor: COLORS.white, borderRadius: 28, padding: 10, marginBottom: 25, borderWidth: 1, borderColor: COLORS.gray[50], ...SHADOWS.soft },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.primary + '10', justifyContent: 'center', alignItems: 'center', marginRight: 18 },
  settingLabel: { fontSize: 15, fontWeight: '900', color: COLORS.black, letterSpacing: -0.3 },
  separator: { height: 1, backgroundColor: COLORS.gray[50], marginHorizontal: 20 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 },
  resetText: { fontSize: 12, fontWeight: '900', color: COLORS.accent, letterSpacing: 1 },
  footerNote: { fontSize: 10, color: COLORS.gray[200], textAlign: 'center', lineHeight: 20, paddingHorizontal: 30, marginTop: 20, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: COLORS.white, borderRadius: 24, padding: 30 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.black, marginBottom: 20 },
  modalInput: { backgroundColor: COLORS.background, borderRadius: 12, padding: 15, fontSize: 16, marginBottom: 25 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15 },
  modalBtnSec: { paddingHorizontal: 15, paddingVertical: 10 },
  modalBtnPri: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  modalBtnTextSec: { fontSize: 10, fontWeight: '900', color: COLORS.gray[300] },
  modalBtnTextPri: { fontSize: 10, fontWeight: '900', color: COLORS.white },
});
