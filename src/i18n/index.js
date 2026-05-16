import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './en.json';
import fr from './fr.json';

const getLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('user-language');
    if (savedLanguage) {
      return savedLanguage;
    }
    return Localization.getLocales()[0].languageCode;
  } catch (error) {
    return 'en';
  }
};

const i18nConfig = {
  compatibilityJSON: 'v3',
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  lng: 'en', // default language
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
};

i18n
  .use(initReactI18next)
  .init(i18nConfig);

// Initialize language from storage
getLanguage().then(lng => {
  i18n.changeLanguage(lng);
});

export default i18n;
