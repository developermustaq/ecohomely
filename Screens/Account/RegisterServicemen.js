import React, { useState, useEffect, useContext } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import CustomText from '../../CustomText';
import { ThemeContext } from '../../theme/ThemeContext'; 

const CustomDropdown = ({ label, value, onValueChange, options, theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const styles = getStyles(theme);

  const handleSelect = (option) => {
    onValueChange(option.value);
    setIsOpen(false);
  };

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity onPress={() => setIsOpen(!isOpen)} style={styles.dropdownButton}>
        <Text style={styles.dropdownText}>{value || `Select ${label}`}</Text>
        <Icon name={isOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={24} color={theme === 'light' ? '#888' : '#aaa'} />
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.dropdownList}>
          <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 200 }}>
            {options.map((option, index) => (
              <TouchableOpacity key={index} onPress={() => handleSelect(option)} style={styles.dropdownItem}>
                <Text style={styles.dropdownText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const ServicemenRegistration = () => {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);
  const [profilePicture, setProfilePicture] = useState(null);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [profession, setProfession] = useState('');

  const navigation = useNavigation();

  useEffect(() => {
    const checkExistingUser = async () => {
      try {
        const uid = await AsyncStorage.getItem('uid');
        if (uid) {
          const servicemenCollectionRef = collection(db, 'servicemen');
          const q = query(servicemenCollectionRef, where('uid', '==', uid));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            navigation.replace('Done');
            return;
          }
        } else {
          console.error('Document ID not found in AsyncStorage');
        }
      } catch (error) {
        console.error('Error checking existing user in servicemen collection:', error);
      }
      fetchUserData();
    };

    const fetchUserData = async () => {
      try {
        const uid = await AsyncStorage.getItem('uid');
        if (uid) {
          const userDocRef = doc(db, 'users', uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const { name, email, phone, address, dob, gender, profession, image } = userData;

            setName(name || '');
            setEmail(email || '');
            setPhoneNumber(phone || '');
            setAddress(address || '');
            setGender(gender || '');
            setProfession(profession || '');
            if (image) {
              setProfilePicture(image);
            }

            const validDOB = new Date(dob);
            if (!isNaN(validDOB)) {
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

    checkExistingUser();
  }, [navigation]);

  const updateProfile = async () => {
    try {
      const storeduid = await AsyncStorage.getItem('uid');
      console.log('User ID:', storeduid);

      let city = '', latitude = '', longitude = '', fullAddress = '';

      const locationString = await AsyncStorage.getItem('location');
      if (locationString) {
        const locationData = JSON.parse(locationString);
        city = locationData.city || '';
        latitude = locationData.latitude || '';
        longitude = locationData.longitude || '';
        fullAddress = locationData.address || '';
      } else {
        console.error('No location data found in AsyncStorage');
      }

      if (storeduid) {
        const servicemenCollectionRef = collection(db, 'servicemen');

        const profileData = {
          uid: storeduid,
          name: name || null,
          phone: phoneNumber || null,
          email: email || null,
          image: 'https://static.vecteezy.com/system/resources/previews/021/536/022/non_2x/avatar-user-paper-style-icon-grey-color-background-paper-style-icon-vector.jpg',
          address: city || null,
          location: fullAddress || null,
          latitude: latitude || null,
          longitude: longitude || null,
          dob: dateOfBirth.toISOString().split('T')[0],
          gender: gender || null,
          profession: profession || null,
          avgRating: 0,
          createdAt: new Date(),
        };

        console.log('Updating profile with:', profileData);

        await addDoc(servicemenCollectionRef, profileData);
        console.log('New serviceman record added successfully to Firestore');
      } else {
        console.error('User ID not found in AsyncStorage');
      }
    } catch (error) {
      console.error('Error adding new serviceman record to Firestore:', error);
      throw error;
    }
  };

  const handleContinue = async () => {
    if (!name) {
      Alert.alert('Error', 'Please enter your name.');
      return;
    }
    if (!phoneNumber) {
      Alert.alert('Error', 'Phone number is required.');
      return;
    }
    if (!email) {
      Alert.alert('Error', 'Please enter your email.');
      return;
    }
    if (!gender) {
      Alert.alert('Error', 'Please select your gender.');
      return;
    }
    if (!profession) {
      Alert.alert('Error', 'Please select a profession.');
      return;
    }

    try {
      await updateProfile();
      navigation.navigate('Done');
    } catch (error) {
      Alert.alert('Error', 'Failed to register. Please try again.');
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme === 'light' ? '#000' : '#e5e5e7'} />
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
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={1}>
            <View style={styles.backIconContainer}>
              <Icon name="arrow-back" size={24} color='#000' />
            </View>
          </TouchableOpacity>
          <CustomText style={styles.title}>Register as Servicemen</CustomText>
          <View style={styles.placeholder} />
        </View>

        <CustomText style={styles.label}>NAME</CustomText>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
            placeholderTextColor={theme === 'light' ? '#888' : '#aaa'}
            returnKeyType="next"
          />
        </View>

        <CustomText style={styles.label}>MOBILE NUMBER</CustomText>
        <View style={styles.inputContainer}>
          <CustomText style={styles.flag}>🇮🇳 </CustomText>
          <Text style={styles.span}>(+91) </Text>
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholderTextColor={theme === 'light' ? '#888' : '#aaa'}
            keyboardType="phone-pad"
            returnKeyType="next"
            editable={false}
          />
        </View>

        <CustomText style={styles.label}>EMAIL</CustomText>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor={theme === 'light' ? '#888' : '#aaa'}
            keyboardType="email-address"
            returnKeyType="next"
            editable={false}
          />
          <Icon name="email" size={24} color={theme === 'light' ? '#888' : '#aaa'} style={styles.inputIcon} />
        </View>

        <CustomText style={styles.label}>DATE OF BIRTH</CustomText>
        <View style={styles.dateContainer}>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
            <Text style={[styles.dateText, { color: dateOfBirth ? (theme === 'light' ? '#000' : '#e5e5e7') : (theme === 'light' ? '#888' : '#aaa') }]}>
              {dateOfBirth ? dateOfBirth.toDateString() : 'Date of Birth'}
            </Text>
            <Icon name="calendar-today" size={24} color={theme === 'light' ? '#888' : '#aaa'} style={styles.inputIcon} />
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

        <CustomText style={styles.label}>GENDER</CustomText>
        <View style={styles.inputContainer}>
          <CustomDropdown
            label="Gender"
            value={gender}
            onValueChange={setGender}
            options={[
              { label: 'Male', value: 'Male' },
              { label: 'Female', value: 'Female' },
              { label: 'Other', value: 'Other' },
            ]}
            theme={theme}
          />
        </View>

        <CustomText style={styles.label}>LOCATION</CustomText>
        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => navigation.navigate('AddLocation')}
        >
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={address}
            onChangeText={setAddress}
            placeholderTextColor={theme === 'light' ? '#888' : '#aaa'}
            returnKeyType="next"
            editable={false}
          />
          <Icon name="location-on" size={24} color={theme === 'light' ? '#888' : '#aaa'} style={styles.inputIcon} />
        </TouchableOpacity>

        <CustomText style={styles.label}>PROFESSION</CustomText>
        <View style={styles.inputContainer}>
          <CustomDropdown
            label="Profession"
            value={profession}
            onValueChange={setProfession}
            options={[
              { label: 'Electrician', value: 'Electrician' },
              { label: 'AC Repair', value: 'AC Repair' },
              { label: 'Painter', value: 'Painter' },
              { label: 'Shifting', value: 'Shifting' },
              { label: 'Plumber', value: 'Plumber' },
              { label: 'Carpenter', value: 'Carpenter' },
              { label: 'TV Repair', value: 'TV Repair' },
              { label: 'Laundry', value: 'Laundry' },
              { label: "Men's Salon", value: "Men's Salon" },
              { label: "Women's Salon", value: "Women's Salon" },
              { label: 'Cleaning', value: 'Cleaning' },
              { label: 'Tutors (Dance, Music, Academic, Yoga)', value: 'Tutors' },
              { label: 'Photography', value: 'Photography' },
              { label: 'Drivers', value: 'Drivers' },
              { label: 'Smart Home Services (CCTV, Wifi)', value: 'Smart Home' },
              { label: 'Car Wash at Home', value: 'Car Wash' },
              { label: 'Water Can Delivery', value: 'Water Delivery' },
              { label: 'Interior Designers', value: 'Interior Designers' },
              { label: 'Beauty & Wellness', value: 'Beauty Wellness' },
              { label: 'RO Water Purifier Services', value: 'RO Water Purifier' },
              { label: 'Appliance Repair (TV, Washing Machine, Refrigerator)', value: 'Appliance Repair' },
            ]}
            theme={theme}
          />
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <CustomText style={styles.continueButtonText}>Register</CustomText>
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
      marginTop: 40,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 15,
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
      fontSize: 18,
      flex: 1,
      textAlign: 'center',
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
    placeholder: {
      width: 40,
    },
    label: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme === 'light' ? '#000' : '#e5e5e7',
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
      backgroundColor: theme === 'light' ? '#F4F4F5' : '#3C3C3E',
    },
    flag: {
      fontSize: 22,
    },
    span: {
      fontSize: 16,
      color: theme === 'light' ? '#888' : '#aaa',
    },
    input: {
      flex: 1,
      height: 48,
      fontSize: 16,
      paddingVertical: 0,
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
    inputIcon: {
      marginLeft: 8,
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderColor: theme === 'light' ? '#ccc' : '#555',
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginBottom: 16,
      backgroundColor: theme === 'light' ? '#F4F4F5' : '#3C3C3E',
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
    dropdownContainer: {
      position: 'relative',
      flex: 1,
    },
    dropdownButton: {
      height: 48,
      justifyContent: 'space-between',
      alignItems: 'center',
      flexDirection: 'row',
    },
    dropdownText: {
      flex: 1,
      fontSize: 16,
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
    dropdownList: {
      borderColor: theme === 'light' ? '#ccc' : '#555',
      borderWidth: 1,
      borderRadius: 8,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
      marginTop: 4,
    },
    dropdownItem: {
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    continueButton: {
      backgroundColor: '#333',
      paddingVertical: 16,
      borderRadius: 30,
      marginVertical: 24,
      elevation: 3,
      shadowColor: theme === 'light' ? '#000' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3.84,
    },
    continueButtonText: {
      color: '#fff',
      textAlign: 'center',
      fontSize: 16,
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

export default ServicemenRegistration;