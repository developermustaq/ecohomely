import React, { useState, useEffect, useContext } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, StatusBar, Image } from 'react-native';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import CustomText from '../../CustomText';
import CustomModal from './CustomModal';
import { setConfirmation } from './OtpConfirmation';
import { ThemeContext } from '../../theme/ThemeContext'; 
import { useTranslation } from '../../context/TranslationContext'; 
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const RegisterPhoneNumberInput = () => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 
  const styles = getStyles(theme);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchPhoneNumber = async () => {
      const storedPhoneNumber = await AsyncStorage.getItem('phoneNumber');
      if (storedPhoneNumber) {
        setPhoneNumber(storedPhoneNumber.slice(-10));
      }
    };

    fetchPhoneNumber();
  }, []);

  const sendOtp = async () => {
    if (!phoneNumber || !email || !name) {
      showModal(t('fillAllFields') || 'Please fill out all fields');
      return;
    }

    if (phoneNumber.length !== 10) {
      showModal(t('phoneNumberMustBe10Digits') || 'Phone number must be 10 digits');
      return;
    }

    setLoading(true);

    try {
      const fullPhoneNumber = `+91${phoneNumber}`;
      const confirmation = await auth().signInWithPhoneNumber(fullPhoneNumber);
      setConfirmation(confirmation);
      await AsyncStorage.setItem('phoneNumber', fullPhoneNumber);
      await AsyncStorage.setItem('email', email);
      await AsyncStorage.setItem('name', name);

      navigation.replace('RegisterOtpVerification');
    } catch (error) {
      console.error('Error sending OTP:', error);
      showModal((t('failedToSendOtp') || 'Failed to send OTP') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const showModal = (message) => {
    setModalMessage(message);
    setModalVisible(true);
  };

  const handlePhoneNumberChange = (text) => {
    const cleanedText = text.replace(/[^0-9]/g, '');
    if (cleanedText.length <= 10) {
      setPhoneNumber(cleanedText);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={theme === 'light' ? '#fff' : '#1A1A1A'}
        translucent={true}
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <CustomText style={styles.label}>{t('enterYourDetails') || 'Enter Your Details'}</CustomText>

        <View style={styles.inputContainer}>
          <Image
            source={require('../../assets/flag.png')}
            style={styles.flag}
            accessibilityLabel={t('indianFlag') || 'Indian flag'} 
          />
          <CustomText style={styles.countryCode}>+91</CustomText>
          <TextInput
            style={styles.phoneNumberInput}
            placeholder={t('phoneNumber') || 'Phone Number'}
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange}
            keyboardType="phone-pad"
            maxLength={10}
            placeholderTextColor={theme === 'light' ? '#888' : '#aaa'}
            accessibilityLabel={t('phoneNumberInput') || 'Phone number input'} 
            accessibilityRole="text"
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons
            name="email"
            size={24}
            color={theme === 'light' ? '#000' : '#e5e5e7'}
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder={t('email') || 'Email'}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholderTextColor={theme === 'light' ? '#888' : '#aaa'}
            accessibilityLabel={t('emailInput') || 'Email input'} 
            accessibilityRole="text"
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons
            name="person"
            size={24}
            color={theme === 'light' ? '#000' : '#e5e5e7'}
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder={t('fullName') || 'Full Name'}
            value={name}
            onChangeText={setName}
            placeholderTextColor={theme === 'light' ? '#888' : '#aaa'}
            accessibilityLabel={t('fullNameInput') || 'Full name input'} 
            accessibilityRole="text"
          />
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={sendOtp}
        disabled={loading}
        accessibilityLabel={loading ? t('registering') || 'Registering' : t('register') || 'Register'} 
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color="#fff"
            accessibilityLabel={t('loading') || 'Loading'} 
          />
        ) : (
          <CustomText style={styles.buttonText}>{t('register') || 'Register'}</CustomText>
        )}
      </TouchableOpacity>

      <CustomModal
        visible={modalVisible}
        message={modalMessage}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
      marginTop: 30,
    },
    scrollContainer: {
      flexGrow: 1,
      alignItems: 'center',
      padding: 20,
    },
    label: {
      fontSize: 22,
      marginBottom: 20,
      color: theme === 'light' ? '#000' : '#e5e5e7',
      fontWeight: 'bold',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'light' ? '#F4F4F5' : '#3C3C3E',
      borderRadius: 10,
      padding: 10,
      width: '100%',
      marginBottom: 20,
    },
    flag: {
      width: 24,
      height: 16,
      marginRight: 10,
    },
    icon: {
      marginRight: 10,
    },
    countryCode: {
      fontSize: 18,
      color: theme === 'light' ? '#000' : '#e5e5e7',
      marginRight: 10,
    },
    phoneNumberInput: {
      flex: 1,
      height: 40,
      fontSize: 18,
      color: theme === 'light' ? '#000' : '#e5e5e7',
      backgroundColor: theme === 'light' ? '#F4F4F5' : '#3C3C3E',
      borderRadius: 10,
      paddingHorizontal: 10,
    },
    input: {
      flex: 1,
      height: 40,
      fontSize: 18,
      color: theme === 'light' ? '#000' : '#e5e5e7',
      backgroundColor: theme === 'light' ? '#F4F4F5' : '#3C3C3E',
      borderRadius: 10,
      paddingHorizontal: 10,
    },
    button: {
      backgroundColor: '#333',
      borderRadius: 25,
      paddingVertical: 15,
      paddingHorizontal: 40,
      width: '90%',
      alignItems: 'center',
      margin: 15,
      elevation: 3,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      color: '#fff',
      fontSize: 18,
    },
  });

export default RegisterPhoneNumberInput;
