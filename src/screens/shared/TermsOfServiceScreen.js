import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGlobal } from '../../store/GlobalContext';

export const TermsOfServiceScreen = ({ navigation }) => {
  const { currentRole } = useGlobal();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={24} 
            color="#0f172a" 
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                const dest = currentRole === 'admin' ? 'AdminMain' : (currentRole === 'driver' ? 'DriverMain' : 'TenantMain');
                navigation.navigate(dest);
              }
            }} 
          />
          <Text style={styles.headerTitle}>Terms of Service</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.lastUpdated}>Last Updated: March 2024</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.text}>By downloading and using the Morgan Shuttle application, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Service Description</Text>
          <Text style={styles.text}>The application provides a platform for booking and managing shuttle services within the Morgan Campus. Features include ride booking, request submission, and status tracking.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.text}>You are responsible for maintaining the confidentiality of your account information. Any activity under your account is your responsibility.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Booking Policies</Text>
          <Text style={styles.text}>- Bookings must be made at least 2 hours in advance.
- Cancellations are permitted up to 2 hours before departure.
- A maximum of 7 seats can be booked per transaction.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Privacy</Text>
          <Text style={styles.text}>Your use of the service is also governed by our Privacy Policy, which is incorporated by reference into these terms.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Modifications</Text>
          <Text style={styles.text}>We reserve the right to modify these terms at any time. Continued use of the service after such changes constitutes acceptance of the new terms.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  scroll: { padding: 25 },
  lastUpdated: { fontSize: 13, color: '#94a3b8', marginBottom: 25 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 },
  text: { fontSize: 15, color: '#64748b', lineHeight: 24 },
});
