"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { language_en } from './en';
import { language_ko } from './ko';
import { language_tr } from './tr';
import { language_vi } from './vn';
import { language_zh } from './zh';

// Define available languages
export type Language = 'en' | 'vi' | 'ko' | 'zh' | 'tr';
// Language names for display
export const languageNames = {
  en: 'English',
  vi: 'Tiếng Việt',
  ko: '한국어',
  zh: '中文',
  tr: 'Türkçe'
};

// Language flags/codes for display
export const languageCodes = {
  en: '🇺🇸',
  vi: '🇻🇳',
  ko: '🇰🇷',
  zh: '🇨🇳',
  tr: '🇹🇷'
};


type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, any>) => string | string[];
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Load translations
const loadTranslations = async (lang: Language) => {
  try {
    // In a real implementation, you'd load JSON files for each language
    // For now, we'll use mock translations
    const translations = {
      en: language_en,
      vi: language_vi,
      ko: language_ko,      
      zh: language_zh,
      tr:  language_tr,
          
    };
    
    return translations[lang] || translations.en;
  } catch (error) {
    console.error('Failed to load translations:', error);
    return {};
  }
};

export const LanguageProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  // Initialize with a default language to prevent SSR error.
  const [language, setLanguage] = useState<Language>('en');
  const [translations, setTranslations] = useState<Record<string, any>>({});

  // Set initial language from localStorage or browser preference on client-side
  useEffect(() => {
    const getBrowserLanguage = (): Language => {
      const browserLang = navigator.language.split('-')[0];
      return (browserLang as Language) in languageNames ? (browserLang as Language) : 'en';
    };

    const savedLanguage = localStorage.getItem('language') as Language;
    setLanguage(savedLanguage || getBrowserLanguage());
  }, []);

  // Updated translation function to handle template variables and arrays
  const t = (key: string, variables?: Record<string, any>): string | string[] => {
    let text = translations[key] || key;
    
    // If the translation is an array, return it directly
    if (Array.isArray(text)) {
      return text;
    }
    
    // Replace template variables if provided (only for strings)
    if (variables && typeof text === 'string') {
      Object.entries(variables).forEach(([varName, value]) => {
        text = text.replace(new RegExp(`{{${varName}}}`, 'g'), String(value));
      });
    }
    
    return text;
  };

  // Set language handler
  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  // Load translations when language changes
  useEffect(() => {
    if (!language) return;

    const loadLanguage = async () => {
      const trans = await loadTranslations(language);
      setTranslations(trans);
      // Set html lang attribute for accessibility
      document.documentElement.lang = language;
    };
    
    loadLanguage();
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};