import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar, Alert } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { db } from '../../utils/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import CustomText from '../../CustomText';
import { ThemeContext } from '../../theme/ThemeContext'; 
import { useTranslation } from '../../context/TranslationContext'; 
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const PermissionScreen = () => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 
  const styles = getStyles(theme);
  const [locationPermission, setLocationPermission] = useState(null);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [formattedAddress, setFormattedAddress] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    const checkLocationInFirestore = async () => {
      setLoading(true);
      try {
        const userId = await AsyncStorage.getItem('uid');
        if (!userId) {
          setErrorMsg(t('userIdNotFound') || 'User ID not found.');
          setLoading(false);
          return;
        }

        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.city && userData.address && userData.latitude && userData.longitude) {
            const locationData = {
              city: userData.city,
              address: userData.address,
              latitude: userData.latitude,
              longitude: userData.longitude,
            };
            await AsyncStorage.setItem('location', JSON.stringify(locationData));
            navigation.replace('Home');
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        setErrorMsg(t('firestoreFetchError') || 'Error fetching data from Firestore.');
        console.error('Firestore Check Error:', error);
      }
      setLoading(false);
    };
    checkLocationInFirestore();
  }, [navigation, t]);

  const handleAllowLocationAccess = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg(t('permissionDenied') || 'Permission denied.');
        Alert.alert(
          t('permissionDenied') || 'Permission Denied',
          t('enableLocationPermissions') || 'Please enable location permissions in settings.'
        );
        setLoading(false);
        return;
      }

      setLocationPermission('precise');

      let preciseLocation = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        preciseLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        }).catch(() => null);
        
        if (preciseLocation) break;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      if (!preciseLocation) {
        Alert.alert(
          t('locationUnavailable') || 'Location Unavailable',
          t('locationUnavailableMessage') || 'Current location is unavailable. Please check if location services are enabled.'
        );
        setLoading(false);
        return;
      }

      setLocation(preciseLocation);
      setLatitude(preciseLocation.coords.latitude);
      setLongitude(preciseLocation.coords.longitude);

      await fetchAddress(preciseLocation.coords.latitude, preciseLocation.coords.longitude);
    } catch (error) {
      setErrorMsg(t('permissionError') || 'An error occurred while requesting permissions.');
      console.error('Permission Error:', error);
      Alert.alert(
        t('error') || 'Error',
        t('unableToAccessLocation') || 'Unable to access location. Please try again.'
      );
      setLoading(false);
    }
  };

  const fetchAddress = async (lat, lng) => {
    const apiKey = 'AIzaSyBPLaShGKneZBd5NQBXoDsjoryw7ekDKfc'; 
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        const firstResult = data.results[0];
        const fullAddress = firstResult.formatted_address;

        let cityName = '';
        for (let component of firstResult.address_components) {
          if (component.types.includes('locality')) {
            cityName = component.long_name;
            break;
          }
        }

        if (cityName.toLowerCase() !== 'visakhapatnam') {
          Alert.alert(
            t('expandingSoon') || 'Expanding Soon',
            t('expandingSoonMessage') || 'We are currently available in Visakhapatnam only. We are expanding soon.'
          );
          setLoading(false);
          return;
        }

        setCity(cityName);
        setFormattedAddress(fullAddress);

        const locationData = {
          city: cityName,
          address: fullAddress,
          latitude: lat,
          longitude: lng,
        };

        await AsyncStorage.setItem('location', JSON.stringify(locationData));
        console.log('City:', cityName);
        console.log('Full Address:', fullAddress);
        console.log('Coordinates:', lat, lng);

        await updateAddressInFirestore(cityName, fullAddress, lat, lng);
        navigation.replace('Home');
      } else {
        console.error('Geocoding API request failed with status:', data.status);
        Alert.alert(
          t('error') || 'Error',
          t('geocodingError') || 'Failed to fetch address details.'
        );
      }
    } catch (error) {
      console.error('Error fetching geocode data:', error);
      Alert.alert(
        t('error') || 'Error',
        t('networkError') || 'Network error occurred while fetching address.'
      );
    }
    setLoading(false);
  };

  const updateAddressInFirestore = async (city, address, latitude, longitude) => {
    try {
      const userId = await AsyncStorage.getItem('uid');
      if (!userId) return;
  
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        city,
        address,
        latitude,
        longitude,
      });
  
      console.log('Address, city, and coordinates updated in Firestore');
    } catch (error) {
      console.error('Error updating Firestore:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={theme === 'light' ? '#fff' : '#1A1A1A'}
        translucent={true}
      />
      <View style={styles.middle}>
        <MaterialIcons name="my-location" size={120} color={theme === 'light' ? '#000' : '#e5e5e7'} />
        {city && (
          <CustomText style={styles.address}>
            <CustomText style={styles.label}>{t('city') || 'City'}: </CustomText>{city}
          </CustomText>
        )}
        {formattedAddress && (
          <CustomText style={styles.address}>
            <CustomText style={styles.label}>{t('fullAddress') || 'Full Address'}: </CustomText>{formattedAddress}
          </CustomText>
        )}
      </View>
      <View style={styles.footer}>
        <CustomText style={styles.infoText}>
          {t('whereDoYouWantService') || 'Where do you want your service?'}
        </CustomText>
        <TouchableOpacity
          style={[styles.buttonBase, styles.primaryButton]}
          onPress={handleAllowLocationAccess}
          disabled={loading}
          accessibilityLabel={t('atMyCurrentLocation') || 'At my current location'} 
          accessibilityRole="button"
          accessibilityState={{ disabled: loading }}  state
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme === 'light' ? '#fff' : '#000'} />
          ) : (
            <CustomText style={styles.buttonText}>
              {t('atMyCurrentLocation') || 'At my current location'}
            </CustomText>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonBase, styles.buttonSecondary]}
          onPress={() => navigation.navigate('AddLocation')}
          accessibilityLabel={t('enterLocationManually') || "I'll enter my location manually"} 
          accessibilityRole="button"
        >
          <CustomText style={styles.buttonTextSecondary}>
            {t('enterLocationManually') || "I'll enter my location manually"}
          </CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
      marginTop: 30,
    },
    middle: {
      flex: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    footer: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginBottom: 30,
    },
    address: {
      fontSize: 16,
      color: theme === 'light' ? '#000' : '#e5e5e7',
      marginBottom: 20,
      textAlign: 'center',
    },
    label: {
      fontWeight: 'bold',
      color: theme === 'light' ? '#888' : '#aaa',
    },
    infoText: {
      marginBottom: 10,
      fontSize: 16,
      color: theme === 'light' ? '#000' : '#e5e5e7',
      textAlign: 'center',
    },
    buttonBase: {
      paddingVertical: 15,
      paddingHorizontal: 50,
      borderRadius: 50,
      alignItems: 'center',
      width: '100%',
      marginBottom: 20,
      elevation: 5,
    },
    primaryButton: {
      backgroundColor: theme === 'light' ? '#333' : '#fff',
    },
    buttonSecondary: {
      backgroundColor: theme === 'light' ? '#fff' : '#333',
    },
    buttonText: {
      color: theme === 'light' ? '#fff' : '#333',
      fontSize: 16,
    },
    buttonTextSecondary: {
      color: theme === 'light' ? '#000' : '#e5e5e7',
      fontSize: 16,
    },
  });

export default PermissionScreen;
