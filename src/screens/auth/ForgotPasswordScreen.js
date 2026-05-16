import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, 
  TouchableOpacity, Alert, StatusBar, 
  SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator
} from 'react-native';
import { useGlobal } from '../../store/GlobalContext';
import { COLORS, SHADOWS } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const ForgotPasswordScreen = ({ navigation }) => {
  const { forgotPassword } = useGlobal();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetRequest = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await forgotPassword(email);
      if (response.success) {
        Alert.alert(
          'Success', 
          `Reset token generated: ${response.token}\n\nIn a production app, this would be sent to your email. You will now be taken to the password setup screen.`,
          [
            { 
              text: 'Go to Reset', 
              onPress: () => navigation.navigate('PasswordSetup', { prefilledToken: response.token }) 
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.content}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.black} />
          </TouchableOpacity>

          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>Enter your registered email address to receive a secure reset token.</Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <TextInput 
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <TouchableOpacity 
              style={[styles.btn, loading && { opacity: 0.7 }]} 
              onPress={handleResetRequest}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.btnText}>SEND RESET TOKEN</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
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
  btn: { backgroundColor: COLORS.primary, padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 20, ...SHADOWS.medium },
  btnText: { color: COLORS.white, fontWeight: '900', fontSize: 16, letterSpacing: 1 }
});
