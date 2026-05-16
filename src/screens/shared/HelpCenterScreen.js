import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';

import { useGlobal } from '../../store/GlobalContext';

export const HelpCenterScreen = ({ navigation }) => {
  const { currentRole } = useGlobal();
  const [expanded, setExpanded] = useState(null);

  const faqs = [
    { id: '1', q: 'How do I book a ride?', a: 'Go to the Home screen, select a date, find an available shuttle, and click "Book Seat".' },
    { id: '2', q: 'Can I cancel my booking?', a: 'Yes, you can cancel any confirmed booking from the "My Bookings" tab at least 2 hours before departure.' },
    { id: '3', q: 'What if the shuttle is full?', a: 'If a shuttle is full, you can request a "Custom Ride" in the Request tab, and an admin will review it.' },
    { id: '4', q: 'How many seats can I book?', a: 'You can book up to 7 seats per shuttle, depending on remaining capacity.' },
  ];

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(expanded === id ? null : id);
  };

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
          <Text style={styles.headerTitle}>Help Center</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.contactCard}>
           <MaterialCommunityIcons name="headphones" size={32} color="#ffffff" />
           <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Need immediate help?</Text>
              <Text style={styles.contactSub}>Our support team is available 24/7</Text>
           </View>
           <TouchableOpacity style={styles.contactBtn}>
              <Text style={styles.contactBtnText}>Contact Support</Text>
           </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

        <View style={styles.faqList}>
          {faqs.map(f => (
            <TouchableOpacity key={f.id} style={styles.faqItem} onPress={() => toggleExpand(f.id)}>
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{f.q}</Text>
                <AntDesign name={expanded === f.id ? "up" : "down"} size={16} color="#64748b" />
              </View>
              {expanded === f.id && (
                <Text style={styles.faqAnswer}>{f.a}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  scroll: { padding: 20 },
  contactCard: { backgroundColor: '#2563eb', padding: 24, borderRadius: 24, marginBottom: 30, elevation: 10, shadowColor: '#2563eb', shadowOpacity: 0.3, shadowRadius: 15 },
  contactInfo: { marginVertical: 15 },
  contactTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  contactSub: { fontSize: 14, color: '#ffffff', opacity: 0.8, marginTop: 4 },
  contactBtn: { backgroundColor: '#ffffff', padding: 14, borderRadius: 14, alignItems: 'center' },
  contactBtnText: { color: '#2563eb', fontWeight: 'bold', fontSize: 16 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#64748b', letterSpacing: 0.5, marginBottom: 15, marginLeft: 5 },
  faqList: { gap: 15 },
  faqItem: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontSize: 15, fontWeight: 'bold', color: '#0f172a', flex: 1, marginRight: 10 },
  faqAnswer: { fontSize: 14, color: '#64748b', marginTop: 12, lineHeight: 22 },
});
