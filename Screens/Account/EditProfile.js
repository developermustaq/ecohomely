import React, { useState, useEffect, useContext } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import * as ImageManipulator from 'expo-image-manipulator';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import CustomText from '../../CustomText';
import { ThemeContext } from '../../theme/ThemeContext'; 
import { useTranslation } from '../../context/TranslationContext'; 

const CustomDropdown = ({ value, onValueChange, options, theme, t }) => { 
  const [isOpen, setIsOpen] = useState(false);
  const styles = getStyles(theme);

  const handleSelect = (option) => {
    onValueChange(option.value);
    setIsOpen(false);
  };

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity onPress={() => setIsOpen(!isOpen)} style={styles.dropdownButton}>
        <Text style={styles.dropdownText}>
          {value || t('selectGender') || 'Select Gender'}
        </Text>
        <Icon
          name={isOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={24}
          color={theme === 'light' ? '#999' : '#aaa'}
        />
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.dropdownList}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleSelect(option)}
              style={styles.dropdownItem}
            >
              <CustomText style={styles.dropdownItemText}>{option.label}</CustomText>
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

const EditProfile = () => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 
  const [profilePicture, setProfilePicture] = useState(null);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

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
            const { name, email, phone, address, dob, gender } = userData;
            setName(name || '');
            setEmail(email || '');
            setPhoneNumber(phone || '');
            setAddress(address || '');
            setDateOfBirth(dob ? new Date(dob) : new Date());
            setGender(gender || '');
            const validDOB = new Date(dob);
            if (isNaN(validDOB)) {
              setDateOfBirth(new Date());
            } else {
              setDateOfBirth(validDOB);
            }
          } else {
            console.error('No such document in Firestore!');
          }
        } else {
          console.error('Document ID not found in AsyncStorage');
        }
      } catch (error) {
        console.error('Error fetching user data from Firestore:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const retrieveProfilePicture = async () => {
      try {
        const storeduid = await AsyncStorage.getItem('uid');
        if (!storeduid) {
          throw new Error('Document ID (uid) not found in AsyncStorage');
        }
        const userDocRef = doc(db, 'users', storeduid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.image) {
            setProfilePicture(userData.image);
          } else {
            console.log('No profile picture found in Firestore');
          }
        } else {
          console.log('User document not found');
          Alert.alert(
            t('error') || 'Error', 
            t('userDocumentNotFound') || 'User document not found in Firestore'
          );
        }
      } catch (error) {
        console.error('Error retrieving profile picture from Firestore:', error);
        Alert.alert(
          t('error') || 'Error', 
          t('failedToRetrieveProfilePicture') || 'Failed to retrieve profile picture from Firestore'
        );
      }
    };
    retrieveProfilePicture();
  }, [t]);

  const updateProfile = async () => {
    try {
      const storeduid = await AsyncStorage.getItem('uid');
      if (storeduid) {
        const userDocRef = doc(db, 'users', storeduid);
        await updateDoc(userDocRef, {
          name,
          address,
          dob: dateOfBirth.toISOString().split('T')[0],
          gender,
        });
        console.log('Profile updated successfully in Firestore');
      } else {
        console.error('Document ID not found in AsyncStorage');
      }
    } catch (error) {
      console.error('Error updating profile in Firestore:', error);
    }
  };

  const handleProfilePictureChange = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
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
          reader.onloadend = async () => {
            const base64String = reader.result.split(',')[1];
            await sendToServer(base64String);
            const message = t('profilePictureUpdated') || 'Profile Picture Updated';
            await AsyncStorage.setItem('message', message);
            navigation.goBack();
          };
          reader.readAsDataURL(blob);
        } catch (error) {
          console.error('Error saving profile picture to AsyncStorage:', error);
          Alert.alert(
            t('error') || 'Error', 
            t('failedToSaveProfilePicture') || 'Failed to save profile picture to AsyncStorage'
          );
        }
      } else {
        console.error('Selected image URI is null or undefined');
        Alert.alert(
          t('error') || 'Error', 
          t('selectedImageUriNull') || 'Selected image URI is null or undefined'
        );
      }
    } else {
      console.error('User cancelled image selection');
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
    }
  };

  const handleContinue = async () => {
    await updateProfile();
    const successMessage = t('profileDetailsUpdated') || 'Profile Details Updated';
    await AsyncStorage.setItem('message', successMessage);
    navigation.goBack();

  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    } else {
      setDateOfBirth(new Date());
    }
  };

  const styles = getStyles(theme);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={theme === 'light' ? '#007AFF' : '#66B2FF'}
        />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
    >
      <StatusBar
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={theme === 'light' ? '#fff' : '#1A1A1A'}
        translucent={true}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={1}
            accessibilityLabel={t('goBack') || 'Go back'} 
            accessibilityRole="button"
          >
            <View style={styles.backIconContainer}>
              <Icon
                name="arrow-back"
                size={24}
                color='#000'
              />
            </View>
          </TouchableOpacity>
          <CustomText style={styles.title}>{t('editProfile') || 'Edit Profile'}</CustomText>
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
                uri: profilePicture
                  ? `data:image/jpeg;base64,${profilePicture}`
                  : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRqItMEHRi0-glvCU-WK_IttS5ehFZCG5qrQ&s',
              }}
              style={styles.profilePicture}
            />
            <View style={styles.editIconContainer}>
              <Icon name="edit" size={24} color="#fff" style={styles.editIcon} />
            </View>
          </TouchableOpacity>
        </View>

        <CustomText style={styles.label}>{t('name') || 'NAME'}</CustomText>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('name') || 'Name'}
            value={name}
            onChangeText={setName}
            placeholderTextColor={theme === 'light' ? '#999' : '#999'}
            returnKeyType="next"
          />
        </View>

        <CustomText style={styles.label}>{t('mobileNumber') || 'MOBILE NUMBER'}</CustomText>
        <View style={styles.inputContainer}>
          <CustomText style={styles.flag}>🇮🇳 </CustomText>
          <Text style={styles.span}>(+91) </Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            placeholder={t('phoneNumber') || 'Phone Number'}
            value={phoneNumber}
            placeholderTextColor={theme === 'light' ? '#999' : '#999'}
            keyboardType="phone-pad"
            returnKeyType="next"
            editable={false}
          />
        </View>

        <CustomText style={styles.label}>{t('email') || 'EMAIL'}</CustomText>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            placeholder={t('email') || 'Email'}
            value={email}
            placeholderTextColor={theme === 'light' ? '#999' : '#aaa'}
            keyboardType="email-address"
            returnKeyType="next"
            editable={false}
          />
          <Icon
            name="email"
            size={24}
            color={theme === 'light' ? '#999' : '#aaa'}
            style={styles.inputIcon}
          />
        </View>

        <CustomText style={styles.label}>{t('dateOfBirth') || 'DATE OF BIRTH'}</CustomText>
        <View style={styles.dateContainer}>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}
            accessibilityLabel={t('selectDateOfBirth') || 'Select date of birth'} 
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.dateText,
                { color: dateOfBirth ? (theme === 'light' ? '#000' : '#000') : theme === 'light' ? '#999' : '#999' },
              ]}
            >
              {dateOfBirth ? dateOfBirth.toDateString() : t('dateOfBirth') || 'Date of Birth'}
            </Text>
            <Icon
              name="calendar-today"
              size={24}
              color={theme === 'light' ? '#999' : '#aaa'}
              style={styles.dateIcon}
            />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dateOfBirth}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </View>

        <CustomText style={styles.label}>{t('gender') || 'GENDER'}</CustomText>
        <View style={styles.inputContainer}>
          <CustomDropdown
            value={gender}
            onValueChange={setGender}
            options={genderOptions} 
            theme={theme}
            t={t} 
          />
        </View>

        <CustomText style={styles.label}>{t('location') || 'LOCATION'}</CustomText>
        <TouchableOpacity
          style={styles.textareaContainer}
          onPress={() => navigation.navigate('AddLocation')}
          activeOpacity={1}
          accessibilityLabel={t('selectLocation') || 'Select location'} 
          accessibilityRole="button"
        >
          <TextInput
            style={styles.textarea}
            placeholder={t('enterYourAddress') || 'Enter your address'}
            value={address}
            onChangeText={setAddress}
            placeholderTextColor={theme === 'light' ? '#999' : '#999'}
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
            editable={false}
          />
          <Icon
            name="location-on"
            size={24}
            color={theme === 'light' ? '#999' : '#aaa'}
            style={styles.textareaIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.continueButton} 
          onPress={handleContinue}
          accessibilityLabel={t('update') || 'Update'} 
          accessibilityRole="button"
        >
          <CustomText style={styles.continueButtonText}>{t('update') || 'Update'}</CustomText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};


const getStyles = (theme) =>
  StyleSheet.create({
    scrollContainer: {
      flexGrow: 1,
    },
    container: {
      flex: 1,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
      paddingHorizontal: 16,
      marginTop: 30,
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
      flex: 1,
      textAlign: 'center',
      color: theme === 'light' ? '#000' : '#fff',
    },
    placeholder: {
      width: 40,
    },
    profilePictureContainer: {
      alignItems: 'center',
      marginBottom: 24,
    },
    profilePicture: {
      width: 120,
      height: 120,
      borderRadius: 60,
    },
    editIconContainer: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: theme === 'light' ? '#000' : '#fff',
      borderRadius: 15,
      padding: 6,
    },
    editIcon: {
      color: theme === 'light' ? '#fff' : '#000',
    },
    label: {
      fontSize: 14,
      color: theme === 'light' ? '#666' : '#aaa',
      marginBottom: 8,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderColor: theme === 'light' ? '#ccc' : '#555',
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      marginBottom: 16,
      backgroundColor: theme === 'light' ? '#f9f9f7' : '#ECECEC',
    },
    disabledInput: {
      color: theme === 'light' ? '#666' : '#aaa', 
    },
    textareaContainer: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  borderColor: theme === 'light' ? '#ccc' : '#555',
  borderWidth: 1,
  borderRadius: 8,
  paddingHorizontal: 16,
  paddingVertical: 12,
  marginBottom: 16,
  backgroundColor: theme === 'light' ? '#f9f9f7' : '#ECECEC',
},
textarea: {
  flex: 1,
  fontSize: 16,
  color: '#000',
  minHeight: 80, 
  textAlignVertical: 'top', 
  paddingTop: 8,
},
textareaIcon: {
  marginLeft: 8,
  marginTop: 8, 
},
    flag: {
      fontSize: 22,
    },
    span: {
      fontSize: 16,
      color: theme === 'light' ? '#999' : '#333',
    },
    input: {
      flex: 1,
      height: 48,
      fontSize: 16,
      paddingVertical: 0,
      color:'#000',
    },
    inputIcon: {
      marginLeft: 8,
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 16,
      backgroundColor: '#f9f9f7',
      borderWidth:0.5,
      borderColor:'#999'
    },
    dateButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    dateText: {
      flex: 1,
      fontSize: 16,
    },
    dateIcon: {
      marginLeft: 8,
    },
    dropdownContainer: {
      position: 'relative',
      flex: 1,
    },
    dropdownButton: {
      height: 48,
      justifyContent: 'space-between',
      alignItems: 'center',
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme === 'light' ? '#ccc' : '#555',
    },
    dropdownText: {
      color: '#000' ,
    },
    dropdownList: {
      borderColor: theme === 'light' ? '#ccc' : '#555',
      borderRadius: 8,
      maxHeight: 150,
      overflow: 'scroll',
      backgroundColor: theme === 'light' ? '#fff' : '#ECECEC',
    },
    dropdownItem: {
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    dropdownItemText: {
      color: '#000',
    },
    continueButton: {
      backgroundColor: theme === 'light' ? '#000' : '#333',
      paddingVertical: 16,
      borderRadius: 30,
      marginVertical: 24,
    },
    continueButtonText: {
      color:'#fff',
      textAlign: 'center',
      fontSize: 16,
      elevation:4,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
    },
  });

export default EditProfile;