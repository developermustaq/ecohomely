import React, { useState, useEffect, useContext } from 'react';
import {
  View, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Alert,
  TextInput, Pressable, StatusBar, FlatList, Text,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { db } from '../../utils/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import 'react-native-get-random-values';
import CustomText from '../../CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../../theme/ThemeContext';
import { useTranslation } from '../../context/TranslationContext';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBPLaShGKneZBd5NQBXoDsjoryw7ekDKfc';

const VALID_CITY_NAMES = [
  'visakhapatnam',
  'visakhapatanam',
  'vizag',
  'visakhapatam',
  'vishakapatnam',
];

const normalizeCityName = (cityStr) => {
  const lower = cityStr.toLowerCase();
  if (VALID_CITY_NAMES.some(v => lower.includes(v))) return 'Visakhapatnam';
  return cityStr;
};

const AddLocation = () => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const styles = getStyles(theme);
  const navigation = useNavigation();

  const [region, setRegion] = useState({
    latitude: 16.0,
    longitude: 80.0,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [locationName, setLocationName] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [markerVisible, setMarkerVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('location');
        if (stored) {
          const { city, address, latitude, longitude } = JSON.parse(stored);
          setLocationName(city);
          setLocationDetails(address);
          setRegion(r => ({ ...r, latitude, longitude }));
          validateCity(city);
        }
      } catch (err) {
        console.error('Error retrieving location:', err);
      } finally {
        setInitialized(true);
      }
    })();
  }, []);

  const fetchPredictions = async (input) => {
    if (!input || input.length < 2) return setPredictions([]);

    if (!GOOGLE_MAPS_API_KEY) {
      Alert.alert('Error', 'Google Maps API key is missing'); return;
    }

    setIsSearching(true);
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_API_KEY}&components=country:in&language=en`;

    try {
      const json = await (await fetch(url)).json();
      if (json.status === 'OK') setPredictions(json.predictions);
      else setPredictions([]);
    } catch (e) {
      console.error('Autocomplete error:', e);
      Alert.alert(t('error') || 'Error', t('networkError') || 'Network error');
    } finally {
      setIsSearching(false);
    }
  };

  const getPlaceDetails = async (placeId) => {
    if (!GOOGLE_MAPS_API_KEY) { Alert.alert('Error', 'API key missing'); return; }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}&fields=address_components,formatted_address,geometry`;
    try {
      const json = await (await fetch(url)).json();
      if (json.status !== 'OK') throw new Error(json.status);

      const { formatted_address, address_components, geometry } = json.result;
      const { lat, lng } = geometry.location;

      const cityComp = address_components.find(c => c.types.includes('locality')) || {};
      const city = cityComp.long_name || '';

      setLocationName(city);
      setLocationDetails(formatted_address);
      setRegion(r => ({ ...r, latitude: lat, longitude: lng }));
      setMarkerVisible(true);
      setModalVisible(false);
      setSearchText('');
      setPredictions([]);
      validateCity(city);
    } catch (e) {
      console.error('Place details error:', e);
      Alert.alert(t('error') || 'Error', 'Failed to get place details');
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('locationPermissionDenied') || 'Permission Denied');
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({});
      setRegion(r => ({ ...r, latitude: coords.latitude, longitude: coords.longitude }));
      setMarkerVisible(true);
      reverseGeocode(coords.latitude, coords.longitude);
    } catch (e) {
      console.error(e);
      Alert.alert(t('error') || 'Error', t('locationFetchError') || 'Unable to fetch location');
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = async (lat, lng) => {
    if (!GOOGLE_MAPS_API_KEY) { Alert.alert('Error', 'API key missing'); return; }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
    try {
      const json = await (await fetch(url)).json();
      if (json.status !== 'OK') throw new Error(json.status);

      const first = json.results[0];
      const cityComp = first.address_components.find(c => c.types.includes('locality')) || {};
      const city = cityComp.long_name || '';

      setLocationName(city);
      setLocationDetails(first.formatted_address);
      validateCity(city);
    } catch (e) {
      console.error('Reverse geocode error:', e);
      Alert.alert(t('error') || 'Error', t('addressFetchError') || 'Could not fetch address');
    }
  };

  const validateCity = (cityStr) => {
    const valid = VALID_CITY_NAMES.includes(cityStr.toLowerCase());
    setIsSaveDisabled(!valid);
    if (!valid) {
      Alert.alert(t('expandingSoon') || 'Expanding Soon', t('expandingSoonMessage') || 'We currently serve Visakhapatnam only.');
    }
  };

  const onMapPress = ({ nativeEvent }) => {
    const { latitude, longitude } = nativeEvent.coordinate;
    setRegion(r => ({ ...r, latitude, longitude }));
    setMarkerVisible(true);
    reverseGeocode(latitude, longitude);
  };

  const handleSave = async () => {
    if (!locationName.trim() || !locationDetails.trim()) {
      Alert.alert(t('validationError') || 'Validation Error', t('locationDetailsRequired') || 'Location and details are required.'); return;
    }

    const locationData = {
      city: normalizeCityName(locationName),
      address: locationDetails,
      latitude: region.latitude,
      longitude: region.longitude,
    };

    try {
      await AsyncStorage.setItem('location', JSON.stringify(locationData));
      const uid = await AsyncStorage.getItem('uid');
      if (uid) await updateDoc(doc(db, 'users', uid), locationData);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (e) {
      console.error(e);
      Alert.alert(t('error') || 'Error', t('locationSaveError') || 'Could not save location');
    }
  };

  if (!initialized) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme === 'light' ? '#000' : '#e5e5e7'} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} translucent />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <CustomText style={styles.title}>{t('addLocation') || 'Add Location'}</CustomText>
        <View style={{ width: 24 }} />
      </View>

      <MapView style={styles.map} region={region} onPress={onMapPress} showsUserLocation>
        {markerVisible && <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} />}
      </MapView>

      <TouchableOpacity style={styles.locationIcon} onPress={getCurrentLocation}>
        {loading ? <ActivityIndicator size="small" /> : <MaterialIcons name="my-location" size={22} />}
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => { setModalVisible(false); setSearchText(''); setPredictions([]); }}>
        <View style={styles.modalContainer}>
          <View style={styles.searchHeader}>
            <TouchableOpacity onPress={() => { setModalVisible(false); setSearchText(''); setPredictions([]); }} style={styles.modalCloseButton}>
              <Icon name="arrow-back" size={24} color={theme === 'light' ? '#000' : '#e5e5e7'} />
            </TouchableOpacity>
            <CustomText style={styles.searchTitle}>{t('searchPlaces') || 'Search Places'}</CustomText>
          </View>

          <View style={styles.searchInputContainer}>
            <Icon name="search" size={20} color={theme === 'light' ? '#666' : '#aaa'} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('searchPlaces') || 'Search for places'}
              placeholderTextColor={theme === 'light' ? '#888' : '#aaa'}
              value={searchText}
              onChangeText={(text) => { setSearchText(text); fetchPredictions(text); }}
              autoFocus
              returnKeyType="search"
            />
            {isSearching && <ActivityIndicator size="small" />}
          </View>

          <FlatList
            data={predictions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.predictionItem} onPress={() => getPlaceDetails(item.place_id)}>
                <Icon name="location-outline" size={18} color={theme === 'light' ? '#666' : '#aaa'} />
                <View style={styles.predictionText}>
                  <Text style={styles.primaryText}>{item.structured_formatting.main_text}</Text>
                  <Text style={styles.secondaryText}>{item.structured_formatting.secondary_text}</Text>
                </View>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>

      <View style={styles.form}>
        <Pressable onPress={() => setModalVisible(true)}>
          <TextInput
            style={styles.textInput}
            placeholder={t('yourLocation') || 'Your Location'}
            placeholderTextColor={theme === 'light' ? '#888' : '#aaa'}
            value={locationDetails}
            editable={false}
          />
        </Pressable>

        <TouchableOpacity
          style={[
            styles.saveButton,
            isSaveDisabled && { backgroundColor: theme === 'light' ? '#ccc' : '#555' },
          ]}
          onPress={handleSave}
          disabled={isSaveDisabled}
        >
          <CustomText style={styles.saveButtonText}>{t('save') || 'Save'}</CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
    marginTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
  },
  backButton: {
    padding: 8,
    borderRadius: 30,
    backgroundColor: '#fff',
    elevation: 4,
  },
  title: {
    fontSize: 22,
    flex: 1,
    textAlign: 'center',
    color: theme === 'light' ? '#000' : '#e5e5e7',
  },
  placeholder: { width: 24 },
  map: {
    width: '100%',
    height: '70%',
  },
  locationIcon: {
    position: 'absolute',
    top: 90,
    right: 10,
    backgroundColor: theme === 'light' ? '#fff' : '#3C3C3E',
    padding: 10,
    borderRadius: 10,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme === 'light' ? '#e0e0e0' : '#333',
  },
  modalCloseButton: { 
    padding: 8,
    marginRight: 12,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme === 'light' ? '#000' : '#e5e5e7',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme === 'light' ? '#f5f5f5' : '#2c2c2c',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme === 'light' ? '#e0e0e0' : '#444',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme === 'light' ? '#000' : '#e5e5e7',
  },
  predictionsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme === 'light' ? '#f0f0f0' : '#2a2a2a',
  },
  predictionText: {
    flex: 1,
    marginLeft: 12,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme === 'light' ? '#000' : '#e5e5e7',
    marginBottom: 2,
  },
  secondaryText: {
    fontSize: 14,
    color: theme === 'light' ? '#666' : '#aaa',
  },
  form: {
    padding: 20,
    backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  textInput: {
    height: 50,
    borderWidth: 1,
    borderColor: theme === 'light' ? '#ccc' : '#555',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: theme === 'light' ? '#F4F4F5' : '#3C3C3E',
    color: theme === 'light' ? '#000' : '#e5e5e7',
  },
  saveButton: {
    backgroundColor: '#333',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
  },
  saveButtonText: { 
    color: '#fff', 
    fontSize: 18 
  },
});

export default AddLocation;
