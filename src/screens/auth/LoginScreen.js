import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, TextInput, Platform, 
  KeyboardAvoidingView, ScrollView,
  Animated, Image, Alert, ActivityIndicator
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGlobal } from '../../store/GlobalContext';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import { useTranslation } from 'react-i18next';

// SecureStore only allows alphanumeric, '.', '-', '_' — sanitize email/id before use
const getSettingsKey = (identifier) => {
  const safe = (identifier || 'default').toString().replace(/[^a-zA-Z0-9._-]/g, '_');
  return `morgan_user_settings_${safe}`;
};

export const LoginScreen = ({ navigation }) => {
  const { login, language, changeLanguage } = useGlobal();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true })
    ]).start();

    // Check biometric availability on mount
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const savedEmail = await SecureStore.getItemAsync('biometric_email');
      const savedPassword = await SecureStore.getItemAsync('biometric_password');
      // Check biometric setting using saved email as identifier
      const settingsKey = savedEmail ? getSettingsKey(savedEmail) : getSettingsKey('default');
      const settingsRaw = await SecureStore.getItemAsync(settingsKey);
      const settings = settingsRaw ? JSON.parse(settingsRaw) : {};
      const biometricsEnabled = !!settings.biometrics;
      setBiometricAvailable(compatible && enrolled && biometricsEnabled && !!savedEmail && !!savedPassword);
    })();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('auth.error_empty'));
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // Save credentials only when biometric preference is ON.
      // Use email as key since we have it at login time (before user.id is available)
      const settingsKey = getSettingsKey(email);
      const settingsRaw = await SecureStore.getItemAsync(settingsKey);
      const settings = settingsRaw ? JSON.parse(settingsRaw) : {};
      if (settings.biometrics) {
        await SecureStore.setItemAsync('biometric_email', email);
        await SecureStore.setItemAsync('biometric_password', password);
        setBiometricAvailable(true);
      } else {
        await SecureStore.deleteItemAsync('biometric_email');
        await SecureStore.deleteItemAsync('biometric_password');
        setBiometricAvailable(false);
      }
    } catch (error) {
      Alert.alert(t('auth.login_failed'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      // 1. Check hardware
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        Alert.alert('Not Supported', 'This device does not support biometric authentication.');
        return;
      }

      // 2. Check enrollment
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        Alert.alert('No Biometrics', 'Please enroll fingerprint or Face ID in your device Settings first.');
        return;
      }

      // 3. Check for saved credentials
      // Use saved email as settings key identifier
      const settingsKey = savedEmail ? getSettingsKey(savedEmail) : getSettingsKey('default');
      const settingsRaw = await SecureStore.getItemAsync(settingsKey);
      const settings = settingsRaw ? JSON.parse(settingsRaw) : {};
      if (!settings.biometrics) {
        Alert.alert('Biometric Login Disabled', 'Enable biometric login from Privacy & Security settings first.');
        return;
      }
      const savedEmail = await SecureStore.getItemAsync('biometric_email');
      const savedPassword = await SecureStore.getItemAsync('biometric_password');

      if (!savedEmail || !savedPassword) {
        Alert.alert(
          'Setup Required',
          'Log in with email & password once first to enable biometric login.',
        );
        return;
      }

      // 4. Prompt fingerprint / Face ID
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('auth.biometric_prompt') || 'Login with Biometrics',
        fallbackLabel: t('auth.use_password') || 'Use Password',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        // 5. ✅ Actually log in using saved credentials
        setLoading(true);
        try {
          await login(savedEmail, savedPassword);
        } catch (error) {
          Alert.alert(t('auth.login_failed'), 'Saved credentials invalid. Please log in manually.');
          // Clear stale credentials
          await SecureStore.deleteItemAsync('biometric_email');
          await SecureStore.deleteItemAsync('biometric_password');
          setBiometricAvailable(false);
        } finally {
          setLoading(false);
        }
      }
    } catch (e) {
      console.error('Biometric error:', e);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Section */}
          <Animated.View style={[styles.logoSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Image 
              source={require('../../../assets/image.png')} 
              style={styles.logo} 
              resizeMode="contain" 
            />
            <Text style={styles.tagline}>{t('auth.tagline')}</Text>
          </Animated.View>

          {/* Form Section */}
          <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('auth.email')}</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholderTextColor={COLORS.gray[300]}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('auth.password')}</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor={COLORS.gray[300]}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons 
                    name={showPassword ? "eye" : "eye-off"} 
                    size={20} 
                    color={COLORS.gray[400]} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.signInButton} 
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.signInText}>{t('auth.login')}</Text>
              )}
            </TouchableOpacity>

            {/* Biometric Button */}
            <View style={styles.biometricRow}>
               <TouchableOpacity style={styles.biometricBtn} onPress={handleBiometricAuth} disabled={loading}>
                  <MaterialCommunityIcons 
                    name="fingerprint" 
                    size={40} 
                    color={biometricAvailable ? COLORS.primary : COLORS.gray[300]} 
                  />
                  <Text style={[styles.biometricText, !biometricAvailable && { color: COLORS.gray[300] }]}>
                    {biometricAvailable ? 'BIOMETRIC LOGIN' : 'LOG IN ONCE TO ENABLE'}
                  </Text>
               </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.forgotButton}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.forgotButton}
              onPress={() => navigation.navigate('PasswordSetup')}
            >
              <Text style={styles.forgotText}>{t('auth.first_time')}</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Footer Language Switcher */}
          <View style={styles.footerLang}>
             <TouchableOpacity onPress={() => changeLanguage('en')}>
                <Text style={[styles.footerLangText, language === 'en' && styles.footerLangTextActive]}>English</Text>
             </TouchableOpacity>
             <View style={styles.footerLangDot} />
             <TouchableOpacity onPress={() => changeLanguage('fr')}>
                <Text style={[styles.footerLangText, language === 'fr' && styles.footerLangTextActive]}>Français</Text>
             </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  scrollContent: { 
    flexGrow: 1,
    paddingHorizontal: 40, 
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'center'
  },
  logoSection: { 
    alignItems: 'center', 
    marginBottom: 60 
  },
  logo: { 
    width: 220, 
    height: 100,
    marginBottom: 20
  },
  tagline: { 
    fontSize: 18, 
    color: '#999', 
    fontWeight: '400',
    marginTop: 10,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'serif'
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 30,
    borderBottomWidth: 1.5,
    borderBottomColor: '#ccc',
    paddingBottom: 5,
  },
  inputLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 5,
  },
  input: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '500',
    paddingVertical: 5,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '500',
    paddingVertical: 5,
  },
  signInButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    ...SHADOWS.medium,
  },
  signInText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  forgotButton: {
    alignSelf: 'center',
    marginVertical: 10,
  },
  footerLang: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingBottom: 20,
  },
  footerLangText: {
     fontSize: 12,
     color: '#999',
     fontWeight: '600',
  },
  footerLangTextActive: {
     color: COLORS.primary,
     fontWeight: '900',
  },
  footerLangDot: {
     width: 4,
     height: 4,
     borderRadius: 2,
     backgroundColor: '#cbd5e1',
     marginHorizontal: 15,
  },
  forgotText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  biometricRow: {
    marginTop: 30,
    alignItems: 'center',
  },
  biometricBtn: {
    alignItems: 'center',
    gap: 8,
  },
  biometricText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1,
  }
});
