import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, 
  TouchableOpacity, Alert, StatusBar, 
  KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobal } from '../../store/GlobalContext';
import { COLORS, SHADOWS } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const PasswordSetupScreen = ({ navigation, route }) => {
  const prefilledToken = route?.params?.prefilledToken || '';
  const { setPasswordViaToken } = useGlobal();
  const [token, setToken] = useState(prefilledToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (prefilledToken) {
      setToken(prefilledToken);
    }
  }, [prefilledToken]);

  const handleSetup = async () => {
    if (!token || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await setPasswordViaToken(token, password);
      Alert.alert('Success', 'Password set successfully! You can now log in.', [
        {
          text: 'Done',
          onPress: () => {
            if (navigation.canGoBack()) navigation.goBack();
          },
        }
      ]);
    } catch (error) {
      Alert.alert('Setup Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.black} />
            </TouchableOpacity>

            <Text style={styles.title}>Secure Onboarding</Text>
            <Text style={styles.subtitle}>Enter the invitation token sent to your email to set up your secure password.</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>INVITATION TOKEN</Text>
                <TextInput 
                  style={styles.input}
                  value={token}
                  onChangeText={setToken}
                  placeholder="e.g. token-xyz123"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>NEW PASSWORD</Text>
                <View style={styles.passwordContainer}>
                  <TextInput 
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholder="••••••••"
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialCommunityIcons 
                      name={showPassword ? "eye" : "eye-off"} 
                      size={20} 
                      color={COLORS.gray[300]} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CONFIRM PASSWORD</Text>
                <View style={styles.passwordContainer}>
                  <TextInput 
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    placeholder="••••••••"
                  />
                  <TouchableOpacity 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialCommunityIcons 
                      name={showConfirmPassword ? "eye" : "eye-off"} 
                      size={20} 
                      color={COLORS.gray[300]} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.btn, loading && { opacity: 0.7 }]} 
                onPress={handleSetup}
                disabled={loading}
              >
                <Text style={styles.btnText}>{loading ? 'SETTING UP...' : 'FINISH SETUP'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 30, flex: 1 },
  backBtn: { marginBottom: 30 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.black, marginBottom: 15 },
  subtitle: { fontSize: 14, color: COLORS.gray[300], lineHeight: 22, marginBottom: 40 },
  form: { flex: 1 },
  inputGroup: { marginBottom: 25 },
  label: { fontSize: 10, fontWeight: '900', color: COLORS.gray[300], marginBottom: 10, letterSpacing: 1 },
  input: { backgroundColor: COLORS.white, borderRadius: 16, padding: 18, fontSize: 16, color: COLORS.black, fontWeight: '700', ...SHADOWS.soft },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingRight: 18,
    ...SHADOWS.soft,
  },
  passwordInput: {
    flex: 1,
    padding: 18,
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '700',
  },
  btn: { backgroundColor: COLORS.primary, padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 20, ...SHADOWS.medium },
  btnText: { color: COLORS.white, fontWeight: '900', fontSize: 16, letterSpacing: 1 }
});
