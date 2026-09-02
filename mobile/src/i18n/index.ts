import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import th from './locales/th.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';

export const LANGUAGE_STORAGE_KEY = 'hyg3_language';

// Matches the design's device-style picker order/labels exactly
// (project/HYG3 Mobile App.dc.html LANGS) — English, Thai, Chinese, Japanese.
export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'th', label: 'ไทย' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    th: { translation: th },
    zh: { translation: zh },
    ja: { translation: ja },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export async function restoreLanguage(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && LANGUAGES.some((l) => l.code === stored)) {
      await i18n.changeLanguage(stored);
    }
  } catch {
    // fall back to default 'en'
  }
}

export async function setLanguage(code: LanguageCode): Promise<void> {
  await i18n.changeLanguage(code);
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch {
    // non-fatal — language still applied for this session
  }
}

export default i18n;
