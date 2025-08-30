import React, { useState, useEffect, useContext } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Image, StatusBar, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import * as ImageManipulator from 'expo-image-manipulator';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import CustomText from '../CustomText';
import { ThemeContext } from '../theme/ThemeContext'; 
import { useTranslation } from '../context/TranslationContext'; 

const CustomDropdown = ({ value, onValueChange, options, t }) => { 
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option) => {
    onValueChange(option.value);
    setIsOpen(false);
  };

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity 
        onPress={() => setIsOpen(!isOpen)} 
        style={styles.dropdownButton}
        accessibilityLabel={`${t('selectGender') || 'Select Gender'}: ${value || t('notSelected') || 'Not selected'}`} 
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
      >
        <CustomText style={[styles.dropdownText, !value && styles.placeholderText]}>
          {value || t('selectGender') || 'Select Gender'}
        </CustomText>
        <Icon
          name={isOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={24}
          color={theme === 'light' ? '#888' : '#aaa'}
        />
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.dropdownList}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleSelect(option)}
              style={styles.dropdownItem}
              accessibilityLabel={`${t('selectOption') || 'Select option'}: ${option.label}`} 
              accessibilityRole="button"
            >
              <CustomText style={styles.dropdownText}>{option.label}</CustomText>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const isToday = (someDate) => {
  const today = new Date();
  return (
    someDate.getDate() === today.getDate() &&
    someDate.getMonth() === today.getMonth() &&
    someDate.getFullYear() === today.getFullYear()
  );
};

const SetProfile = () => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 
  const styles = getStyles(theme);
  const [profilePicture, setProfilePicture] = useState(null);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const navigation = useNavigation();

  const genderOptions = [
    { label: t('male') || 'Male', value: 'Male' },
    { label: t('female') || 'Female', value: 'Female' },
    { label: t('other') || 'Other', value: 'Other' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const uid = await AsyncStorage.getItem('uid');
        if (uid) {
          const userDocRef = doc(db, 'users', uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const { name, email, phone, dob, gender } = userData;
            setName(name);
            setEmail(email);
            setPhoneNumber(phone);
            setGender(gender);
            if (dob) {
              const validDOB = new Date(dob);
              setDateOfBirth(isNaN(validDOB) ? null : validDOB);
            }
          } else {
            console.error('No such document in Firestore!');
            Alert.alert(
              t('error') || 'Error',
              t('userDataNotFound') || 'User data not found in database.'
            );
          }
        } else {
          console.error('Document ID not found in AsyncStorage');
          Alert.alert(
            t('error') || 'Error',
            t('userIdNotFound') || 'User ID not found. Please login again.'
          );
        }
      } catch (error) {
        console.error('Error fetching user data from Firestore:', error);
        Alert.alert(
          t('error') || 'Error',
          t('dataFetchError') || 'Failed to fetch user data. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t]);

  const updateProfile = async () => {
    try {
      const storeduid = await AsyncStorage.getItem('uid');
      if (storeduid) {
        const userDocRef = doc(db, 'users', storeduid);
        await updateDoc(userDocRef, {
          name: name,
          dob: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : '',
          gender: gender,
        });
        console.log('Profile updated successfully in Firestore');
      } else {
        console.error('Document ID not found in AsyncStorage');
        throw new Error('User ID not found');
      }
    } catch (error) {
      console.error('Error updating profile in Firestore:', error);
      Alert.alert(
        t('error') || 'Error',
        t('profileUpdateError') || 'Failed to update profile. Please try again.'
      );
    }
  };

  const handleProfilePictureChange = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert(
          t('permissionRequired') || 'Permission Required',
          t('photoLibraryPermissionRequired') || 'Permission to access photo library is required!'
        );
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.cancelled && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        if (selectedImage.uri) {
          try {
            const fileName = `${FileSystem.documentDirectory}profile_picture.jpg`;
            await FileSystem.copyAsync({ from: selectedImage.uri, to: fileName });
            await AsyncStorage.setItem('profilePicture', fileName);
            setProfilePicture(selectedImage.uri);
            const compressedImageUri = await compressImage(selectedImage.uri);
            const response = await fetch(compressedImageUri);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64String = reader.result.split(',')[1];
              sendToServer(base64String);
            };
            reader.readAsDataURL(blob);
          } catch (error) {
            console.error('Error saving profile picture to AsyncStorage:', error);
            Alert.alert(
              t('error') || 'Error',
              t('profilePictureSaveError') || 'Failed to save profile picture'
            );
          }
        } else {
          console.error('Selected image URI is null or undefined');
          Alert.alert(
            t('error') || 'Error',
            t('invalidImageSelected') || 'Invalid image selected'
          );
        }
      }
    } catch (error) {
      console.error('Error in handleProfilePictureChange:', error);
      Alert.alert(
        t('error') || 'Error',
        t('imageSelectionError') || 'Error selecting image. Please try again.'
      );
    }
  };

  const compressImage = async (uri) => {
    try {
      const resizedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 500 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      return resizedImage.uri;
    } catch (error) {
      console.error('Error compressing image:', error);
      return uri;
    }
  };

  const sendToServer = async (base64String) => {
    try {
      const storeduid = await AsyncStorage.getItem('uid');
      if (!storeduid) {
        throw new Error('Document ID not found in AsyncStorage');
      }
      const userDocRef = doc(db, 'users', storeduid);
      await updateDoc(userDocRef, {
        image: base64String,
      });
      console.log('Image uploaded successfully to Firestore');
    } catch (error) {
      console.error('Error uploading image to Firestore:', error);
      Alert.alert(
        t('error') || 'Error',
        t('imageUploadError') || 'Failed to upload image. Please try again.'
      );
    }
  };

  const handleContinue = () => {
    if (!dateOfBirth || !gender) {
      Alert.alert(
        t('incompleteProfile') || 'Incomplete Profile',
        t('pleaseCompleteAllFields') || 'Please complete all required fields before continuing.'
      );
      return;
    }
    updateProfile();
    navigation.replace('Location');
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const formatDate = (date) => {
    if (!date) return t('dateFormat') || 'dd-mm-yyyy';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator 
          size="large" 
          color={theme === 'light' ? '#007AFF' : '#1AD5B3'}
          accessibilityLabel={t('loading') || 'Loading'} 
        />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <StatusBar
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={theme === 'light' ? '#fff' : '#1A1A1A'}
        translucent={true}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.replace('Welcome')}
            accessibilityLabel={t('goBack') || 'Go back'} 
            accessibilityRole="button"
          >
            <View style={styles.backIconContainer}>
              <Icon name="arrow-back" size={24} color='#000' />
            </View>
          </TouchableOpacity>
          <CustomText style={styles.title}>{t('yourProfile') || 'Your Profile'}</CustomText>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.profilePictureContainer}>
          <TouchableOpacity 
            onPress={handleProfilePictureChange}
            accessibilityLabel={t('changeProfilePicture') || 'Change profile picture'} 
            accessibilityRole="button"
          >
            <Image
              source={{
                uri: profilePicture || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRqItMEHRi0-glvCU-WK_IttS5ehFZCG5qrQ&s',
              }}
              style={styles.profilePicture}
              accessibilityLabel={t('profilePicture') || 'Profile picture'} 
            />
            <View style={styles.editIconContainer}>
              <Icon name="edit" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        <CustomText style={styles.label}>{t('fullName') || 'FULL NAME'}</CustomText>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholder={t('enterFullName') || 'Enter full name'}
          placeholderTextColor={theme === 'light' ? '#888' : '#aaa'}
          editable={false}
          accessibilityLabel={t('fullNameInput') || 'Full name input'} 
          accessibilityState={{ disabled: true }}
        />

        <CustomText style={styles.label}>{t('phoneNumber') || 'PHONE NUMBER'}</CustomText>
        <TextInput
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          style={styles.input}
          placeholder={t('enterPhoneNumber') || 'Enter phone number'}
          placeholderTextColor={theme === 'light' ? '#888' : '#aaa'}
          editable={false}
          accessibilityLabel={t('phoneNumberInput') || 'Phone number input'} 
          accessibilityState={{ disabled: true }}
        />

        <CustomText style={styles.label}>{t('emailAddress') || 'EMAIL ADDRESS'}</CustomText>
        <TextInput
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholder={t('enterEmailAddress') || 'Enter email address'}
          placeholderTextColor={theme === 'light' ? '#888' : '#aaa'}
          editable={false}
          accessibilityLabel={t('emailAddressInput') || 'Email address input'} 
          accessibilityState={{ disabled: true }}
        />

        <CustomText style={styles.label}>{t('dateOfBirth') || 'DATE OF BIRTH'}</CustomText>
        <View style={styles.datePickerContainer}>
          <TouchableOpacity 
            onPress={() => setShowDatePicker(true)} 
            style={styles.datePickerButton}
            accessibilityLabel={`${t('selectDateOfBirth') || 'Select date of birth'}: ${formatDate(dateOfBirth)}`} 
            accessibilityRole="button"
          >
            <CustomText style={[styles.dateText, !dateOfBirth && styles.placeholderText]}>
              {formatDate(dateOfBirth)}
            </CustomText>
            <Icon name="calendar-today" size={24} color={theme === 'light' ? '#888' : '#aaa'} style={styles.calendarIcon} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dateOfBirth || new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </View>

        <CustomText style={styles.label}>{t('gender') || 'GENDER'}</CustomText>
        <CustomDropdown
          value={gender}
          onValueChange={setGender}
          options={genderOptions} 
          t={t} 
        />

        <TouchableOpacity
          style={[styles.continueButton, (!dateOfBirth || !gender) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!dateOfBirth || !gender}
          accessibilityLabel={t('continueToNextStep') || 'Continue to next step'} 
          accessibilityRole="button"
          accessibilityState={{ disabled: !dateOfBirth || !gender }}
        >
          <CustomText style={styles.continueButtonText}>{t('continue') || 'Continue'}</CustomText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
      flex: 1,
      marginTop: 30,
    },
    scrollContainer: {
      flexGrow: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      paddingHorizontal: 8,
      paddingTop: 25,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
    },
    backButton: {
      marginRight: 10,
    },
    backIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme === 'light' ? '#000' : '#e5e5e7',
      flex: 1,
      textAlign: 'center',
    },
    placeholder: {
      width: 40,
    },
    profilePictureContainer: {
      alignItems: 'center',
      marginBottom: 30,
    },
    profilePicture: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme === 'light' ? '#F4F4F5' : '#3C3C3E',
      borderWidth: 1,
      borderColor: theme === 'light' ? '#ccc' : '#555',
    },
    editIconContainer: {
      position: 'absolute',
      bottom: 0,
      right: 10,
      backgroundColor: '#333',
      borderRadius: 50,
      padding: 5,
    },
    label: {
      marginBottom: 8,
      fontSize: 16,
      color: theme === 'light' ? '#000' : '#e5e5e7',
      fontWeight: '600',
    },
    input: {
      borderColor: theme === 'light' ? '#ccc' : '#555',
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginBottom: 16,
      fontSize: 16,
      backgroundColor: theme === 'light' ? '#F4F4F5' : '#3C3C3E',
      color: theme === 'light' ? '#000' : '#e5e5e7',
      elevation: 2,
    },
    datePickerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderColor: theme === 'light' ? '#ccc' : '#555',
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginBottom: 16,
      backgroundColor: theme === 'light' ? '#F4F4F5' : '#3C3C3E',
      elevation: 2,
    },
    datePickerButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    dateText: {
      flex: 1,
      fontSize: 16,
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
    placeholderText: {
      color: theme === 'light' ? '#888' : '#aaa',
    },
    calendarIcon: {
      marginLeft: 8,
    },
    dropdownContainer: {
      marginBottom: 16,
    },
    dropdownButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderColor: theme === 'light' ? '#ccc' : '#555',
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: theme === 'light' ? '#F4F4F5' : '#3C3C3E',
      elevation: 2,
    },
    dropdownList: {
      borderColor: theme === 'light' ? '#ccc' : '#555',
      borderWidth: 1,
      borderRadius: 8,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
      marginTop: 5,
      elevation: 3,
    },
    dropdownItem: {
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    dropdownText: {
      fontSize: 16,
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
    continueButton: {
      backgroundColor: '#333',
      borderRadius: 25,
      paddingVertical: 15,
      alignItems: 'center',
      marginVertical: 20,
      elevation: 3,
    },
    continueButtonText: {
      fontSize: 16,
      color: '#fff',
      fontWeight: 'bold',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
    },
  });

export default SetProfile;