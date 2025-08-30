import React, { useContext } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, StatusBar, Platform } from 'react-native';
import CustomText from '../CustomText';
import { ThemeContext } from '../theme/ThemeContext'; 
import { useTranslation } from '../context/TranslationContext'; 
import Icon from 'react-native-vector-icons/MaterialIcons';

const Welcome = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 
  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={theme === 'light' ? '#fff' : '#1A1A1A'}
        translucent={true}
      />

      <TouchableOpacity
        style={styles.languageIcon}
        onPress={() => navigation.navigate('Language')}
        accessibilityLabel={t('languageSelection') || 'Language selection'}
        accessibilityRole="button"
        accessibilityHint={t('languageSelectionHint') || 'Tap to change app language'}
      >
        <Icon
          name="language"
          size={28}
          color={theme === 'light' ? '#000' : '#e5e5e7'}
        />
      </TouchableOpacity>

      <Image
        source={require('../assets/map.png')}
        style={styles.image}
        accessibilityLabel={t('welcomeImage') || 'Welcome screen illustration'} 
      />
      <CustomText style={styles.title}>{t('discoverLocalServices') || 'Discover Local Services,'}</CustomText>
      <CustomText style={styles.title}>{t('simplified') || 'Simplified.'}</CustomText>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.replace('Login')}
          accessibilityLabel={t('getStarted') || 'Get Started'} 
          accessibilityRole="button"
          accessibilityHint={t('getStartedHint') || 'Navigates to login screen'}  hint
        >
          <CustomText style={styles.buttonText}>{t('getStarted') || 'Get Started'}</CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
      marginTop: 30,
    },
    languageIcon: {
      position: 'absolute',
      top: Platform.OS === 'android' ? StatusBar.currentHeight + 0 : 50,
      right: 20,
      padding: 8,
      borderRadius: 20,
      backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
      zIndex: 1,
    },
    image: {
      width: 250,
      height: 250,
      marginBottom: 30,
      borderRadius: 200,
    },
    title: {
      fontSize: 18,
      marginBottom: 10,
      color: theme === 'light' ? '#000' : '#e5e5e7',
      textAlign: 'center',
    },
    buttonContainer: {
      position: 'absolute',
      bottom: 30,
      width: '100%',
      alignItems: 'center',
    },
    button: {
      backgroundColor: '#333',
      paddingVertical: 15,
      paddingHorizontal: 50,
      borderRadius: 50,
      alignItems: 'center',
      width: '90%',
      marginBottom: 20,
      elevation: 5,
      shadowColor: theme === 'light' ? '#000' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    buttonText: {
      fontSize: 18,
      color: '#fff',
    },
  });

export default Welcome;
