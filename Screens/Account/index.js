import React, { useState, useCallback, useEffect, useContext } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import CustomText from '../../CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../../theme/ThemeContext';
import { useTranslation } from '../../context/TranslationContext';

const ProfilePage = () => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();

  const [userDetails, setUserDetails] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [footerMessage, setFooterMessage] = useState('');

  /* ---------------------- Helpers ---------------------- */
  const fetchUserDetails = async () => {
    try {
      const userId = await AsyncStorage.getItem('uid');
      const message = await AsyncStorage.getItem('message');

      if (message) setFooterMessage(message);

      if (userId) {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserDetails(userData);

          if (userData.image) {
            const base64Image = userData.image.trim();
            setProfileImage(`data:image/jpeg;base64,${base64Image}`);
          }
        } else {
          console.log('No such document!');
        }
      } else {
        console.log('No user ID found in AsyncStorage');
      }
    } catch (error) {
      console.error('Error fetching user details: ', error);
    }
  };

  const handleRegisterServicemen = async () => {
    try {
      const docRef = doc(db, 'playstore', 'ecohomely-partner');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const { url } = docSnap.data();
        if (url) await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error fetching URL from Firestore: ', error);
    }
  };

  const handleAboutUs = async () => {
    try {
      const docRef = doc(db, 'playstore', 'about');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const { url } = docSnap.data();
        if (url) await Linking.openURL(url);
        else console.error('URL field is missing in the document');
      } else {
        console.error('Document does not exist');
      }
    } catch (error) {
      console.error('Error fetching URL from Firestore: ', error);
    }
  };

  /* -------------------- Lifecycle -------------------- */
  useFocusEffect(
    useCallback(() => {
      fetchUserDetails();
    }, [])
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setFooterMessage('');
      AsyncStorage.removeItem('message');
    }, 2000);
    return () => clearTimeout(timer);
  }, [footerMessage]);

  /* ---------------------- UI ---------------------- */
  const styles = getStyles(theme);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={theme === 'light' ? '#ffffff' : '#1A1A1A'}
        translucent
      />

      {/* Profile header */}
      <View style={styles.profileContainer}>
        <Image
          source={{
            uri: profileImage
              ? profileImage
              : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRqItMEHRi0-glvCU-WK_IttS5ehFZCG5qrQ&s',
          }}
          style={styles.profileImage}
        />
        <View style={styles.profileInfo}>
          <CustomText style={styles.profileName}>
            {userDetails ? userDetails.name : t('name') || 'Name'}
          </CustomText>
          <CustomText style={styles.profilePhone}>
            {userDetails ? userDetails.phone : t('phone') || 'Phone'}
          </CustomText>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => navigation.navigate('EditProfile')}
            accessibilityLabel={t('editProfile') || 'Edit Profile'}
            accessibilityRole="button"
          >
            <CustomText style={styles.editProfileText}>
              {t('editProfile') || 'Edit Profile'}
            </CustomText>
            <Image
              source={require('../../assets/GoSearch.png')}
              style={[styles.GoSearch, { tintColor: theme === 'light' ? '#000' : '#fff' }]}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ------------ Menu Options ------------ */}
      <TouchableOpacity
        style={styles.optionContainer}
        onPress={() => navigation.navigate('Favorites')}
        accessibilityLabel={t('favorites') || 'Favorites'}
        accessibilityRole="button"
      >
        <Icon name="heart-outline" size={24} color={theme === 'light' ? '#000' : '#fff'} style={styles.optionIcon} />
        <CustomText style={styles.optionText}>
          {t('favorites') || 'Favorites'}
        </CustomText>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionContainer}
        onPress={() => navigation.navigate('Contact')}
        accessibilityLabel={t('contactUs') || 'Contact Us'}
        accessibilityRole="button"
      >
        <Icon name="headset-outline" size={24} color={theme === 'light' ? '#000' : '#fff'} style={styles.optionIcon} />
        <CustomText style={styles.optionText}>
          {t('contactUs') || 'Contact Us'}
        </CustomText>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionContainer}
        onPress={handleRegisterServicemen}
        accessibilityLabel={t('registerAsServicemen') || 'Register as Servicemen'}
        accessibilityRole="button"
      >
        <Icon name="person-add-outline" size={24} color={theme === 'light' ? '#000' : '#fff'} style={styles.optionIcon} />
        <CustomText style={styles.optionText}>
          {t('registerAsServicemen') || 'Register as Servicemen'}
        </CustomText>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionContainer}
        onPress={handleAboutUs}
        accessibilityLabel={t('aboutUs') || 'About Us'}
        accessibilityRole="button"
      >
        <Icon name="information-circle-outline" size={24} color={theme === 'light' ? '#000' : '#fff'} style={styles.optionIcon} />
        <CustomText style={styles.optionText}>
          {t('aboutUs') || 'About Us'}
        </CustomText>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionContainer}
        onPress={() => navigation.navigate('Settings')}
        accessibilityLabel={t('settings') || 'Settings'}
        accessibilityRole="button"
      >
        <Icon name="settings-outline" size={24} color={theme === 'light' ? '#000' : '#fff'} style={styles.optionIcon} />
        <CustomText style={styles.optionText}>
          {t('settings') || 'Settings'}
        </CustomText>
      </TouchableOpacity>

      {/* Footer toast */}
      {footerMessage ? (
        <View style={styles.footerContainer}>
          <Icon
            name="checkmark"
            size={12}
            color={theme === 'light' ? '#fff' : '#000'}
            style={styles.checkIcon}
          />
          <CustomText style={styles.footerText}>{footerMessage}</CustomText>
        </View>
      ) : null}
    </ScrollView>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      alignItems: 'center',
      paddingVertical: 20,
      backgroundColor: theme === 'light' ? '#ffffff' : '#1A1A1A',
      marginTop: 30,
    },
    profileContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme === 'light' ? '#fff' : '#333333',
      borderRadius: 10,
      marginBottom: 20,
      width: '90%',
      elevation: 5,
    },
    profileImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
      marginRight: 20,
    },
    profileInfo: { flex: 1 },
    profileName: {
      fontSize: 16,
      color: theme === 'light' ? '#000' : '#fff',
      marginBottom: 5,
    },
    profilePhone: {
      fontSize: 16,
      color: theme === 'light' ? '#666' : '#aaa',
      marginBottom: 10,
    },
    editProfileButton: { flexDirection: 'row', alignItems: 'center' },
    editProfileText: {
      fontSize: 16,
      color: theme === 'light' ? '#000' : '#fff',
      marginRight: 5,
    },
    GoSearch: { width: 16, height: 16, marginLeft: 8 },
    optionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme === 'light' ? '#fff' : '#333333',
      borderRadius: 10,
      marginBottom: 20,
      width: '90%',
      elevation: 5,
    },
    optionIcon: { width: 24, height: 24 },
    optionText: {
      fontSize: 18,
      color: theme === 'light' ? '#000' : '#fff',
      marginLeft: 20,
    },
    footerContainer: {
      padding: 10,
      backgroundColor: theme === 'light' ? '#E7F8E9' : '#2D6A4F',
      borderRadius: 10,
      marginTop: 'auto',
      marginBottom: 70,
      width: '90%',
      flexDirection: 'row',
    },
    checkIcon: {
      backgroundColor: theme === 'light' ? '#2D6A4F' : '#E7F8E9',
      padding: 3,
      borderRadius: 10,
      margin: 5,
    },
    footerText: {
      fontSize: 16,
      color: theme === 'light' ? '#2D6A4F' : '#E7F8E9',
      fontWeight: '600',
    },
  });

export default ProfilePage;
