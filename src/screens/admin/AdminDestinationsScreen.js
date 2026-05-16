import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, ScrollView, StatusBar, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobal } from '../../store/GlobalContext';
import { MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { Button } from '../../components/shared/Button';
import { COLORS, SHADOWS } from '../../constants/theme';
import { Image } from 'react-native';
import { useTranslation } from 'react-i18next';

export const AdminDestinationsScreen = () => {
  const { t } = useTranslation();
  const { destinations, addDestination, removeDestination } = useGlobal();
  const [newDest, setNewDest] = useState('');

  const handleAdd = () => {
    if (!newDest.trim()) return;
    addDestination(newDest.trim());
    setNewDest('');
  };

  const confirmDelete = (dest) => {
    if (['Morgan Campus', 'Station Mont-Tremblant', 'Village Center'].includes(dest)) {
      Alert.alert('Protected', 'This is a core operations site and cannot be removed.');
      return;
    }
    Alert.alert('Control', t('admin.remove_landmark', { name: dest }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => {
        console.log('🗑️ UI: User requested deletion of:', dest);
        removeDestination(dest);
      }}
    ]);
  };

  const suggestions = ['Walmart', 'IGA Extra', 'Ski Resort', 'Hospital', 'Casino'];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topBanner}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
             <Image 
               source={require('../../../assets/image.png')} 
               style={[styles.headerLogo, { tintColor: COLORS.white }]}
               resizeMode="contain" 
             />
             <Text style={styles.headerTitle}>{t('admin.site_assets')}</Text>
             <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.addSection}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
        >
          <View style={[styles.inputWrapper, SHADOWS.soft]}>
            <MaterialCommunityIcons name="magnify" size={20} color={COLORS.gray[300]} style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder={t('admin.add_landmark')} 
              placeholderTextColor={COLORS.gray[300]}
              value={newDest}
              onChangeText={setNewDest}
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
              <MaterialCommunityIcons name="plus-circle" size={32} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionList}>
           <Text style={styles.suggestionTitle}>{t('admin.quick_add')}:</Text>
           {suggestions.map(s => (
             <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => setNewDest(s)}>
                <Text style={styles.suggestionText}>{s}</Text>
             </TouchableOpacity>
           ))}
        </ScrollView>
      </View>

      <FlatList
        data={destinations}
        keyExtractor={item => item}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.siteCard, SHADOWS.soft]}>
            <View style={styles.siteLeft}>
               <View style={styles.siteIconBox}>
                 <MaterialCommunityIcons name="office-building" size={24} color={COLORS.secondary} />
               </View>
               <View>
                 <Text style={styles.siteName}>{item}</Text>
                 <Text style={styles.siteType}>Operational Hub</Text>
               </View>
            </View>
            <TouchableOpacity onPress={() => confirmDelete(item)} style={styles.deleteBtn}>
               <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBanner: { backgroundColor: COLORS.primary, paddingBottom: 25, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginTop: 10 },
  headerLogo: { width: 110, height: 35 },
  headerTitle: { fontSize: 13, fontWeight: '900', color: COLORS.white, letterSpacing: 2, textTransform: 'uppercase' },
  addSection: { padding: 30, backgroundColor: COLORS.background },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 22, padding: 8, overflow: 'hidden' },
  inputIcon: { marginLeft: 15 },
  input: { flex: 1, height: 50, paddingHorizontal: 15, fontSize: 16, color: COLORS.black, fontWeight: '700' },
  addBtn: { padding: 5 },
  suggestionList: { paddingTop: 20, alignItems: 'center', gap: 12 },
  suggestionTitle: { fontSize: 10, fontWeight: '900', color: COLORS.gray[300], letterSpacing: 1.5, textTransform: 'uppercase' },
  suggestionChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.white, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  suggestionText: { fontSize: 12, fontWeight: '800', color: COLORS.primary },
  list: { paddingHorizontal: 25, paddingBottom: 100 },
  siteCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, padding: 22, borderRadius: 32, marginBottom: 15, overflow: 'hidden' },
  siteLeft: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  siteIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.secondary + '15', justifyContent: 'center', alignItems: 'center' },
  siteName: { fontSize: 16, fontWeight: '900', color: COLORS.black, letterSpacing: -0.3 },
  siteType: { fontSize: 10, color: COLORS.gray[300], marginTop: 5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  deleteBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }
});
