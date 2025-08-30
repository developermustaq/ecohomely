import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Alert, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../utils/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { setConfirmation, getConfirmation, clearConfirmation } from './OtpConfirmation';
import CustomText from '../../CustomText';
import { ThemeContext } from '../../theme/ThemeContext'; 
import { useTranslation } from '../../context/TranslationContext'; 

const OtpVerification = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 
  const styles = getStyles(theme);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [timer, setTimer] = useState(25);
  const [codeResent, setCodeResent] = useState(false);
  const [incorrectOtp, setIncorrectOtp] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    const getPhoneNumber = async () => {
      try {
        const storedPhoneNumber = await AsyncStorage.getItem('phoneNumber');
        if (storedPhoneNumber !== null) {
          const phoneNumberWithoutPlus = storedPhoneNumber.startsWith('+') ? storedPhoneNumber.slice(1) : storedPhoneNumber;
          setPhoneNumber(storedPhoneNumber);
        } else {
          Alert.alert(t('error') || 'Error', t('phoneNumberNotFound') || 'Phone number not found');
        }
      } catch (error) {
        Alert.alert(t('error') || 'Error', t('failedToRetrievePhoneNumber') || 'Failed to retrieve phone number');
      }
    };
    
    getPhoneNumber();
  }, [t]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleOtpChange = (index, value) => {
    if (isNaN(value) || value.length > 1) return;
  
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
  
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (index, key) => {
    if (key === 'Backspace') {
      const newOtp = [...otp];
  
      if (newOtp[index] !== '') {
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1].focus();
        newOtp[index - 1] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleFocus = (index) => {
    inputRefs.current[index].setNativeProps({ selection: { start: otp[index].length, end: otp[index].length } });
  };

  const getUserByPhoneNumber = async (db, phoneNumber) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phone', '==', phoneNumber.trim()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await AsyncStorage.setItem('uid', userDoc.id);
        return userDoc.data();
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error querying user by phone number:', error);
      throw error;
    }
  };

  const verifyOtp = async () => {
    const otpString = otp.join('');
  
    setIsLoading(true);
    setIncorrectOtp(false);
  
    try {
      const confirmation = getConfirmation();
  
      if (!confirmation) {
        Alert.alert(t('error') || 'Error', t('noOtpConfirmation') || 'No OTP confirmation found. Please try again.');
        setIsLoading(false);
        return;
      }
  
      const result = await confirmation.confirm(otpString);
  
      if (result) {
        const user = result.user;
        const phoneWithoutPlus = phoneNumber.replace('+91', '').trim();
        const userData = await getUserByPhoneNumber(db, phoneWithoutPlus);
  
        if (userData) {
          navigation.replace('Location');
        }
      } else {
        setIncorrectOtp(true);
      }
    } catch (error) {
      setIncorrectOtp(true);
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    setIsLoading(true);
    setCodeResent(false);

    try {
      const fullPhoneNumber = phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`;
      const confirmationResult = await auth().signInWithPhoneNumber(fullPhoneNumber);
      setConfirmation(confirmationResult);
      setCodeResent(true);
      setTimer(25);
    } catch (error) {
      console.error('Error resending OTP:', error);
      Alert.alert(t('error') || 'Error', t('failedToResendOtp') || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={theme === 'light' ? '#fff' : '#1A1A1A'}
        translucent={true}
      />

      <View style={styles.contentContainer}>
        <CustomText style={styles.title}>{t('verificationTitle') || 'Verification'}</CustomText>
        <CustomText style={styles.subTitle}>{t('codeSentTo') || 'Code has been sent to'} {phoneNumber}</CustomText>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              style={[styles.otpInput, incorrectOtp ? styles.otpInputError : null]}
              keyboardType="numeric"
              value={digit}
              onChangeText={(value) => handleOtpChange(index, value)}
              maxLength={1}
              autoFocus={index === 0}
              onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
              onFocus={() => handleFocus(index)}
              accessibilityLabel={`${t('otpDigit') || 'OTP digit'} ${index + 1}`} 
              accessibilityRole="text"
            />
          ))}
        </View>

        {incorrectOtp && (
          <CustomText style={styles.invalidOtpMessage}>{t('invalidOtp') || 'Invalid OTP'}</CustomText>
        )}

        {errorMessage ? <CustomText style={styles.errorText}>{errorMessage}</CustomText> : null}

        <CustomText style={styles.resendPromptText}>{t('didntReceiveCode') || 'Didn\'t receive code?'}</CustomText>
        <View style={styles.timerContainer}>
          <Icon
            name="access-time"
            size={20}
            color={theme === 'light' ? '#000' : '#e5e5e7'}
            style={styles.timerIcon}
          />
          <CustomText style={styles.timerText}>{`00 : ${timer < 10 ? `0${timer}` : timer}`}</CustomText>
        </View>

        {timer === 0 ? (
          <TouchableOpacity 
            onPress={resendOtp} 
            disabled={isLoading}
            accessibilityLabel={t('resendCode') || 'Resend Code'} 
            accessibilityRole="button"
          >
            <CustomText style={[styles.resendText, isLoading ? styles.buttonDisabled : null]}>
              {t('resendCode') || 'Resend Code'}
            </CustomText>
          </TouchableOpacity>
        ) : (
          <CustomText style={[styles.resendText, styles.buttonDisabled]}>{t('resendCode') || 'Resend Code'}</CustomText>
        )}
      </View>

      <View style={styles.verificationGroup}>
        {codeResent && (
          <View style={styles.codeResentContainer}>
            <Icon
              name="check"
              size={20}
              color={theme === 'light' ? '#27AE60' : '#2ECC71'}
              style={styles.checkmarkIcon}
            />
            <CustomText style={styles.codeResentMessage}>{t('newVerificationCodeSent') || 'New Verification Code Sent'}</CustomText>
          </View>
        )}
        <TouchableOpacity
          style={[styles.verifyButton, isLoading ? styles.buttonDisabled : null]}
          onPress={verifyOtp}
          disabled={isLoading}
          accessibilityLabel={t('verify') || 'Verify'} 
          accessibilityRole="button"
        >
          <CustomText style={styles.verifyButtonText}>{t('verify') || 'Verify'}</CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
      marginTop: 30,
    },
    contentContainer: {
      alignItems: 'center',
      width: '100%',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme === 'light' ? '#000' : '#e5e5e7',
      marginBottom: 10,
    },
    subTitle: {
      fontSize: 16,
      color: theme === 'light' ? '#000' : '#e5e5e7',
      marginBottom: 30,
    },
    otpContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
      width: '80%',
    },
    otpInput: {
      width: 40,
      height: 50,
      borderRadius: 8,
      textAlign: 'center',
      fontSize: 24,
      fontWeight: 'bold',
      backgroundColor: theme === 'light' ? '#F4F4F5' : '#3C3C3E',
      color: theme === 'light' ? '#000' : '#e5e5e7',
      marginLeft: 5,
    },
    otpInputError: {
      borderColor: theme === 'light' ? '#FF0000' : '#FF5555',
    },
    errorText: {
      color: theme === 'light' ? '#FF0000' : '#FF5555',
      marginBottom: 20,
    },
    invalidOtpMessage: {
      fontSize: 16,
      color: theme === 'light' ? '#FF0000' : '#FF5555',
      fontWeight: 'bold',
      marginBottom: 10,
    },
    codeResentContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme === 'light' ? '#e8f5e9' : '#2A4D3E',
      padding: 12,
      width: '100%',
      marginVertical: 20,
      borderRadius: 10,
    },
    checkmarkIcon: {
      marginRight: 10,
    },
    codeResentMessage: {
      fontSize: 16,
      color: theme === 'light' ? '#27AE60' : '#2ECC71',
    },
    resendPromptText: {
      fontSize: 16,
      color: theme === 'light' ? '#888' : '#aaa',
      marginBottom: 10,
    },
    timerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    timerIcon: {
      marginRight: 8,
    },
    timerText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
    resendText: {
      fontSize: 16,
      color: theme === 'light' ? '#000' : '#e5e5e7',
      marginBottom: 20,
    },
    buttonDisabled: {
      color: theme === 'light' ? '#888' : '#aaa',
      opacity: 0.7,
    },
    verificationGroup: {
      alignItems: 'center',
      width: '100%',
      marginTop: 20,
    },
    verifyButton: {
      backgroundColor: '#333',
      paddingVertical: 15,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 50,
      elevation: 3,
    },
    verifyButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
  });

export default OtpVerification;
