import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet, Alert, StatusBar, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomText from '../../CustomText';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { ThemeContext } from '../../theme/ThemeContext';
import { useTranslation } from '../../context/TranslationContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function scheduleSinglePushNotification(identifier, t) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: t('notificationsEnabled') || 'Notifications Enabled!',
        body: t('stayUpdated') || 'Stay updated with the latest news and updates from our app!',
        data: { someData: 'goes here' },
      },
      trigger: null,
      identifier,
    });
  } catch (e) {
    console.error(`Failed to schedule notification: ${e}`);
  }
}

async function cancelPushNotification(identifier) {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (e) {
    console.error(`Failed to cancel notification: ${e}`);
  }
}

const Settings = () => {
  const navigation = useNavigation();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { t, language } = useTranslation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const notificationListener = useRef();
  const responseListener = useRef();
  const [notificationSent, setNotificationSent] = useState(false);
  
  const languageNames = {
    en: 'English',
    te: 'తెలుగు',
    hi: 'हिन्दी',
  };

  useEffect(() => {
    const loadState = async () => {
      const toggleNotificationState = await AsyncStorage.getItem('toggleNotification');
      if (toggleNotificationState !== null) {
        setNotificationsEnabled(toggleNotificationState === 'true');
      }
    };

    loadState();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const handleToggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    await AsyncStorage.setItem('toggleNotification', newValue.toString());

    if (newValue && !notificationSent) {
      await scheduleSinglePushNotification('singleNotification', t);
      setNotificationSent(true);
    } else if (!newValue) {
      await cancelPushNotification('singleNotification');
      setNotificationSent(false);
    }
  };

  const handleLanguageNavigation = () => {
    navigation.navigate('Language');
  };

  // Privacy Policy handler
  const handlePrivacyPolicy = async () => {
    try {
      const docRef = doc(db, 'playstore', 'privacy-policy');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const { url } = docSnap.data();
        if (url) {
          await Linking.openURL(url);
        } else {
          console.error('URL field is missing in privacy-policy document');
          Alert.alert(
            t('error') || 'Error',
            t('urlNotFound') || 'Privacy Policy URL not found'
          );
        }
      } else {
        console.error('Privacy Policy document does not exist');
        Alert.alert(
          t('error') || 'Error',
          t('documentNotFound') || 'Privacy Policy document not found'
        );
      }
    } catch (error) {
      console.error('Error fetching Privacy Policy URL from Firestore: ', error);
      Alert.alert(
        t('error') || 'Error',
        t('networkError') || 'Failed to load Privacy Policy. Please try again.'
      );
    }
  };

  const handleTermsConditions = async () => {
    try {
      const docRef = doc(db, 'playstore', 'terms-conditions');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const { url } = docSnap.data();
        if (url) {
          await Linking.openURL(url);
        } else {
          console.error('URL field is missing in terms-conditions document');
          Alert.alert(
            t('error') || 'Error',
            t('urlNotFound') || 'Terms & Conditions URL not found'
          );
        }
      } else {
        console.error('Terms & Conditions document does not exist');
        Alert.alert(
          t('error') || 'Error',
          t('documentNotFound') || 'Terms & Conditions document not found'
        );
      }
    } catch (error) {
      console.error('Error fetching Terms & Conditions URL from Firestore: ', error);
      Alert.alert(
        t('error') || 'Error',
        t('networkError') || 'Failed to load Terms & Conditions. Please try again.'
      );
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('logout') || 'Logout',
      t('logoutConfirm') || 'Are you sure you want to logout?',
      [
        { 
          text: t('cancel') || 'Cancel', 
          onPress: () => console.log('Cancel Pressed'), 
          style: 'cancel' 
        },
        {
          text: t('ok') || 'OK',
          onPress: async () => {
            try {
              const uid = await AsyncStorage.getItem('uid');
              if (uid) {
                const userDocRef = doc(db, 'users', uid);
                await updateDoc(userDocRef, {
                  active: false,
                  expoPushToken: null,
                  lastSeen: serverTimestamp(),
                });
              }

              await AsyncStorage.clear();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });

              console.log('User logged out successfully.');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert(
                t('error') || 'Error', 
                t('logoutError') || 'Failed to logout. Please try again.'
              );
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={theme === 'light' ? '#fff' : '#1A1A1A'}
        translucent={true}
      />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color='#000' />
        </TouchableOpacity>
        <CustomText style={styles.title}>{t('settings') || 'Settings'}</CustomText>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.optionContainer}>
        <CustomText style={styles.optionText}>{t('notifications') || 'App Notifications'}</CustomText>
        <Switch
          value={notificationsEnabled}
          onValueChange={handleToggleNotifications}
          trackColor={{ false: '#767577', true: theme === 'light' ? '#000' : '#fff' }}
          thumbColor={notificationsEnabled ? '#fff' : '#fff'}
        />
      </View>
      
      <View style={styles.optionContainer}>
        <CustomText style={styles.optionText}>{t('darkMode') || 'Dark Mode'}</CustomText>
        <Switch
          value={theme === 'dark'}
          onValueChange={toggleTheme}
          trackColor={{ false: '#767577', true: theme === 'light' ? '#000' : '#fff' }}
          thumbColor={theme === 'dark' ? '#fff' : '#fff'}
        />
      </View>
      
      {/* Language Selection Option */}
      <TouchableOpacity 
        style={styles.optionContainer}
        onPress={handleLanguageNavigation}
        accessibilityLabel={t('selectLanguage') || 'Select Language'}
        accessibilityRole="button"
      >
        <View style={styles.languageOption}>
          <CustomText style={styles.optionText}>{t('language') || 'Language'}</CustomText>
          <CustomText style={styles.currentLanguageText}>
            {languageNames[language] || 'English'}
          </CustomText>
        </View>
        <Icon 
          name="chevron-forward" 
          size={20} 
          color={theme === 'light' ? '#666' : '#aaa'} 
        />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.optionContainer}
        onPress={handlePrivacyPolicy}
        accessibilityLabel={t('privacyPolicy') || 'Privacy Policy'}
        accessibilityRole="button"
      >
        <CustomText style={styles.optionText}>{t('privacyPolicy') || 'Privacy Policy'}</CustomText>
        <Icon 
          name="chevron-forward" 
          size={20} 
          color={theme === 'light' ? '#666' : '#aaa'} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.optionContainer}
        onPress={handleTermsConditions}
        accessibilityLabel={t('termsConditions') || 'Terms & Conditions'}
        accessibilityRole="button"
      >
        <CustomText style={styles.optionText}>{t('termsConditions') || 'Terms & Conditions'}</CustomText>
        <Icon 
          name="chevron-forward" 
          size={20} 
          color={theme === 'light' ? '#666' : '#aaa'} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.logoutContainer} onPress={handleLogout}>
        <CustomText style={styles.logoutText}>{t('logout') || 'Logout'}</CustomText>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: theme === 'light' ? '#ffffff' : '#1A1A1A',
      marginTop: 30,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 30,
      justifyContent: 'space-between',
    },
    backButton: {
      padding: 8,
      elevation: 4,
      borderRadius: 30,
      backgroundColor:'#fff',
    },
    title: {
      fontSize: 24,
      flex: 1,
      textAlign: 'center',
      color: theme === 'light' ? '#000' : '#fff',
    },
    placeholder: {
      width: 24,
    },
    optionContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 10,
      backgroundColor: theme === 'light' ? '#ffffff' : '#333',
      borderRadius: 10,
      marginBottom: 20,
      elevation: 3,
    },
    optionText: {
      fontSize: 16,
      color: theme === 'light' ? '#000' : '#fff',
    },
    languageOption: {
      flex: 1,
    },
    currentLanguageText: {
      fontSize: 14,
      color: theme === 'light' ? '#666' : '#aaa',
      marginTop: 2,
    },
    logoutContainer: {
      alignItems: 'center',
      paddingVertical: 15,
      backgroundColor: theme === 'light' ? '#fff' : '#333',
      borderRadius: 10,
      elevation: 3,
    },
    logoutText: {
      fontSize: 16,
      color: 'red',
    },
  });

export default Settings;
