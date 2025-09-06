import React, { useState, useContext } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  ActivityIndicator,
  Modal,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { db, firebaseAuth } from '../../utils/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import CustomText from '../../CustomText';
import { setConfirmation } from './OtpConfirmation';
import { ThemeContext } from '../../theme/ThemeContext'; 
import { useTranslation } from '../../context/TranslationContext'; 

const PhoneNumberInput = () => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 
  const styles = getStyles(theme);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigation = useNavigation();

  const checkUserExists = async (phoneNumber) => {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where('phone', '==', phoneNumber));
    const querySnapshot = await getDocs(q);
  
    return !querySnapshot.empty;
  };

  const sendOtp = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      setModalMessage(t('invalidPhoneNumber') || 'Please enter a valid 10-digit phone number');
      setShowModal(true);
      return;
    }

    if (!agreedToTerms) {
      setModalMessage('Please agree to the Terms and Conditions to continue');
      setShowModal(true);
      return;
    }

    setLoading(true);
    const fullPhoneNumber = `+91${phoneNumber}`;

    try {
      const userExists = await checkUserExists(phoneNumber);

      if (userExists) {
        const confirmation = await firebaseAuth.signInWithPhoneNumber(fullPhoneNumber);
        setConfirmation(confirmation);
        await AsyncStorage.setItem('phoneNumber', fullPhoneNumber);
        navigation.replace('OtpVerification');
      } else {
        await AsyncStorage.setItem('phoneNumber', fullPhoneNumber);
        navigation.replace('RegisterOtp');
      }
    } catch (error) {
      console.error('Error:', error);
      setModalMessage(t('genericError') || 'An error occurred. Please try again.');
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneNumberChange = (text) => {
    const cleanedText = text.replace(/[^0-9]/g, '');
    if (cleanedText.length <= 10) {
      setPhoneNumber(cleanedText);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalMessage('');
  };

  const openTermsAndConditions = () => {
    Linking.openURL('https://www.ecohomely.com/custterms').catch(err => {
      console.error('Error opening terms and conditions:', err);
      setModalMessage('Unable to open Terms and Conditions');
      setShowModal(true);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <StatusBar
          barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
          backgroundColor={theme === 'light' ? '#fff' : '#1A1A1A'}
          translucent={true}
        />
        <CustomText style={styles.label}>{t('enterPhoneNumber') || 'Enter Phone Number'}</CustomText>
        <View style={styles.inputContainer}>
          <View style={styles.countryCodeContainer}>
            <Image
              source={require('../../assets/flag.png')}
              style={styles.flag}
              accessibilityLabel={t('indianFlag') || 'Indian flag'} 
            />
            <CustomText style={styles.countryCode}>+91</CustomText>
          </View>
          <TextInput
            style={styles.input}
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
      </View>

      <View style={styles.spacer} />

      <View style={styles.termsContainer}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setAgreedToTerms(!agreedToTerms)}
          accessibilityLabel="Terms and conditions checkbox"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreedToTerms }}
        >
          <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
            {agreedToTerms && (
              <CustomText style={styles.checkmark}>✓</CustomText>
            )}
          </View>
          <View style={styles.termsTextContainer}>
            <CustomText style={styles.termsText}>
              I agree with{' '}
            </CustomText>
            <TouchableOpacity onPress={openTermsAndConditions}>
              <CustomText style={styles.termsLink}>
                Terms and Conditions
              </CustomText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={sendOtp}
        disabled={loading}
        accessibilityLabel={t('getStarted') || 'Get Started'} 
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color="#fff"
            accessibilityLabel={t('loading') || 'Loading'} 
          />
        ) : (
          <CustomText style={styles.buttonText}>{t('getStarted') || 'Get Started'}</CustomText>
        )}
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
        accessibilityViewIsModal={true} 
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <CustomText style={styles.modalText}>{modalMessage}</CustomText>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={closeModal}
              accessibilityLabel={t('ok') || 'OK'} 
              accessibilityRole="button"
            >
              <CustomText style={styles.modalButtonText}>{t('ok') || 'OK'}</CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
      paddingTop: 50,
    },
    contentContainer: {
      width: '100%',
      alignItems: 'center',
    },
    spacer: {
      flex: 1,
    },
    label: {
      fontSize: 20,
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
    countryCodeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 10,
    },
    flag: {
      width: 24,
      height: 16,
      marginRight: 10,
    },
    countryCode: {
      fontSize: 18,
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
    input: {
      flex: 1,
      height: 40,
      fontSize: 18,
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
    termsContainer: {
      width: '100%',
      marginBottom: 10,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 5,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: theme === 'light' ? '#333' : '#e5e5e7',
      marginRight: 10,
      marginTop: 2,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
    },
    checkboxChecked: {
      backgroundColor: '#333',
      borderColor: '#333',
    },
    checkmark: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    termsTextContainer: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    termsText: {
      fontSize: 14,
      color: theme === 'light' ? '#000' : '#e5e5e7',
      lineHeight: 20,
    },
    termsLink: {
      fontSize: 14,
      color: '#007AFF',
      textDecorationLine: 'underline',
    },
    button: {
      backgroundColor: '#333',
      borderRadius: 25,
      paddingVertical: 15,
      paddingHorizontal: 40,
      width: '100%',
      alignItems: 'center',
      marginBottom: 20,
      elevation: 3,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      color: '#fff',
      fontSize: 18,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme === 'light' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(26, 26, 26, 0.7)',
    },
    modalContent: {
      width: '80%',
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
      borderRadius: 10,
      padding: 20,
      alignItems: 'center',
      elevation: 5,
      shadowColor: theme === 'light' ? '#000' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3.84,
    },
    modalText: {
      fontSize: 18,
      marginBottom: 20,
      textAlign: 'center',
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
    modalButton: {
      backgroundColor: '#333',
      borderRadius: 25,
      paddingVertical: 10,
      paddingHorizontal: 30,
    },
    modalButtonText: {
      color: '#fff',
      fontSize: 16,
    },
  });

export default PhoneNumberInput;
