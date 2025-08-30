import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { translations, supportedLanguages, defaultLanguage } from '../translations/translations';

const TranslationContext = createContext();

export const TranslationProvider = ({ children }) => {
  const [language, setLanguage] = useState(defaultLanguage || 'en'); 
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem('language');
        
        if (savedLang && supportedLanguages.includes(savedLang)) {
          setLanguage(savedLang);
        } else if (!savedLang) {
          const deviceLang = Localization.locale.split('-')[0];
          const finalLang = supportedLanguages.includes(deviceLang) ? deviceLang : (defaultLanguage || 'en');
          setLanguage(finalLang);
          
          await AsyncStorage.setItem('language', finalLang);
        }
      } catch (error) {
        console.error('Failed to initialize language:', error);
        setLanguage(defaultLanguage || 'en');
      } finally {
        setIsLoading(false); 
      }
    };

    initializeLanguage();
  }, []);

  const changeLanguage = async (lang) => {
    if (!supportedLanguages.includes(lang)) {
      console.warn(`Language ${lang} is not supported`);
      return;
    }

    try {
      setLanguage(lang);
      await AsyncStorage.setItem('language', lang);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || 
           translations[defaultLanguage || 'en']?.[key] || 
           key;
  };

  return (
    <TranslationContext.Provider value={{ 
      language, 
      changeLanguage, 
      t, 
      isLoading 
    }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
