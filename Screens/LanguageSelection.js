import React, { useContext, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useTranslation } from '../context/TranslationContext';
import { supportedLanguages } from '../translations/translations';
import { ThemeContext } from '../theme/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

export default function LanguageSelection({ navigation }) {
  const { language, changeLanguage, t } = useTranslation();
  const themeContext = useContext(ThemeContext);

  if (!themeContext) {
    throw new Error('ThemeContext must be used within a ThemeProvider');
  }

  const { theme = 'light' } = themeContext;
  const styles = useMemo(() => getStyles(theme), [theme]);

  const handleSelect = async (lang) => {
    await changeLanguage(lang);
    navigation.goBack();
  };

  const languageNames = {
    en: 'English',
    te: 'తెలుగు',
    hi: 'हिन्दी',
  };

  const languageIcons = {
    en: 'globe-outline',
    te: 'newspaper-outline',
    hi: 'school-outline',
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={theme === 'light' ? '#fff' : '#1A1A1A'}
        translucent={true}

      />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme === 'light' ? '#333' : '#e5e5e7'}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('selectLanguage')}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="language-outline"
              size={80}
              color={theme === 'light' ? '#007bff' : '#55aaff'}
            />
          </View>

          <Text style={styles.title}>{t('selectLanguage')}</Text>
          <Text style={styles.subtitle}>
            {t('choosePreferredLanguage') || 'Choose your preferred language'}
          </Text>

          <View style={styles.languageContainer}>
            {supportedLanguages.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.languageButton,
                  language === lang && styles.selectedLanguageButton,
                ]}
                onPress={() => handleSelect(lang)}
                accessibilityLabel={`Select ${languageNames[lang]}`}
                accessibilityRole="button"
              >
                <View style={styles.languageContent}>
                  <Ionicons
                    name={languageIcons[lang]}
                    size={24}
                    color={theme === 'light' ? '#007bff' : '#55aaff'}
                    style={styles.icon}
                  />
                  <Text
                    style={[
                      styles.languageText,
                      language === lang && styles.selectedLanguageText,
                    ]}
                  >
                    {languageNames[lang]}
                  </Text>
                  {language === lang && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={theme === 'light' ? '#007bff' : '#55aaff'}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
    },
    container: {
      flex: 1,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
      marginTop: 30,

    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme === 'light' ? '#f0f0f0' : '#333',
    },
    backButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: theme === 'light' ? '#f8f9fa' : '#2A2A2A',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme === 'light' ? '#333' : '#e5e5e7',
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 40,
      alignItems: 'center',
    },
    iconContainer: {
      marginBottom: 30,
      padding: 20,
      borderRadius: 50,
      backgroundColor: theme === 'light' ? '#f8f9fa' : '#2A2A2A',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme === 'light' ? '#333' : '#e5e5e7',
      textAlign: 'center',
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: theme === 'light' ? '#666' : '#b3b3b3',
      textAlign: 'center',
      marginBottom: 40,
      paddingHorizontal: 20,
    },
    languageContainer: {
      width: '100%',
      maxWidth: 300,
    },
    languageButton: {
      backgroundColor: theme === 'light' ? '#f8f9fa' : '#2A2A2A',
      marginBottom: 15,
      borderRadius: 15,
      borderWidth: 2,
      borderColor: 'transparent',
      ...Platform.select({
        ios: {
          shadowColor: theme === 'light' ? '#000' : '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    selectedLanguageButton: {
      backgroundColor: theme === 'light' ? '#e3f2fd' : '#1e3a5f',
      borderColor: theme === 'light' ? '#007bff' : '#55aaff',
    },
    languageContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 18,
      paddingHorizontal: 20,
    },
    icon: {
      marginRight: 15,
    },
    languageText: {
      flex: 1,
      fontSize: 18,
      fontWeight: '500',
      color: theme === 'light' ? '#333' : '#e5e5e7',
    },
    selectedLanguageText: {
      color: theme === 'light' ? '#007bff' : '#55aaff',
      fontWeight: '600',
    },
    footer: {
      paddingHorizontal: 20,
      paddingBottom: 30,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 14,
      color: theme === 'light' ? '#999' : '#888',
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });
