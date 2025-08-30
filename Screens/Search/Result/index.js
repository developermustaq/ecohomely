import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, ActivityIndicator, Linking, Image, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../../utils/firebase';
import { useNavigation, useRoute } from '@react-navigation/native';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc, query as firebaseQuery, where, increment } from 'firebase/firestore';
import ResultUi from './Card';
import Sort from './Sort';
import Filter from './Filter';
import CustomText from '../../../CustomText';
import { ThemeContext } from '../../../theme/ThemeContext';
import { useTranslation } from '../../../context/TranslationContext'; 

const Result = () => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 
  const styles = getStyles(theme);
  const navigation = useNavigation();
  const route = useRoute();
  const [query, setQuery] = useState(route.params.query || "");
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [storedFilterOptions, setStoredFilterOptions] = useState({
    isAvailableNow: false,
  });

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const storedIsAvailableNow = await AsyncStorage.getItem('isAvailableNow');
        setStoredFilterOptions({
          isAvailableNow: storedIsAvailableNow !== null ? JSON.parse(storedIsAvailableNow) : false,
        });
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };

    loadFilterOptions();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const userId = await AsyncStorage.getItem('uid');
        if (!userId) return;

        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setFavorites(userDocSnap.data().favorites || []);
        }

        const locationData = await AsyncStorage.getItem('location');
        let userLat = null, userLon = null, city = '';
        if (locationData) {
          const { latitude, longitude, city: storedCity } = JSON.parse(locationData);
          userLat = latitude;
          userLon = longitude;
          city = storedCity || '';
        }

        const servicemenCollection = collection(db, 'servicemen');
        const q = firebaseQuery(
          servicemenCollection,
          where('address', '==', city),
          where('profession', '==', query),
          where('Approved', '==', true)
        );

        const querySnapshot = await getDocs(q);

        const fetchedResults = await Promise.all(querySnapshot.docs.map(async (doc) => {
          const servicemanData = { id: doc.id, ...doc.data() };

          const bookingsCollectionRef = collection(db, 'servicemen', doc.id, 'bookings');
          const bookingsSnapshot = await getDocs(bookingsCollectionRef);
          servicemanData.bookingCount = bookingsSnapshot.size;

          const { latitude: servicemanLat, longitude: servicemanLon } = servicemanData;

          if (userLat !== null && userLon !== null && servicemanLat && servicemanLon) {
            servicemanData.distance = calculateDistance(userLat, userLon, servicemanLat, servicemanLon);
          } else {
            servicemanData.distance = null;
          }

          return servicemanData;
        }));

        let filteredResults = [...fetchedResults];

        if (storedFilterOptions.isAvailableNow) {
          const currentTime = new Date();
          const currentHours = currentTime.getHours();
          const currentMinutes = currentTime.getMinutes();

          filteredResults = filteredResults.filter(result => {
            const availabilityStart = result.availabilityStart?.toDate();
            const availabilityEnd = result.availabilityEnd?.toDate();

            if (availabilityStart && availabilityEnd) {
              const startHours = availabilityStart.getHours();
              const startMinutes = availabilityStart.getMinutes();
              const endHours = availabilityEnd.getHours();
              const endMinutes = availabilityEnd.getMinutes();

              const startTotalMinutes = startHours * 60 + startMinutes;
              const endTotalMinutes = endHours * 60 + endMinutes;
              const currentTotalMinutes = currentHours * 60 + currentMinutes;

              return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes;
            }
            return false;
          });
        }

        const sortedByDistance = filteredResults.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));

        setResults(sortedByDistance);
        setFilteredResults(sortedByDistance);
      } catch (error) {
        console.error('Error fetching documents: ', error);
        Alert.alert(
          t('error') || 'Error',
          t('errorFetchingResults') || 'Error fetching search results. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const toRad = (angle) => (Math.PI * angle) / 180;
      const R = 6371;

      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return (R * c).toFixed(2);
    };

    fetchData();
  }, [query, storedFilterOptions, t]);

  const toggleFavorite = async (servicemanId) => {
    try {
      const userId = await AsyncStorage.getItem('uid');
      if (!userId) return;

      const isFavorited = favorites.includes(servicemanId);
      const userDocRef = doc(db, 'users', userId);

      if (isFavorited) {
        await updateDoc(userDocRef, { favorites: arrayRemove(servicemanId) });
        setFavorites(favorites.filter(id => id !== servicemanId));
      } else {
        await updateDoc(userDocRef, { favorites: arrayUnion(servicemanId) });
        setFavorites([...favorites, servicemanId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert(
        t('error') || 'Error',
        t('favoriteUpdateError') || 'Failed to update favorite. Please try again.'
      );
    }
  };

  const applySort = (sortOption) => {
    let sortedResults = [...results];

    if (sortOption === 'Popular') {
      sortedResults = sortedResults.sort((a, b) => (b.bookingCount || 0) - (a.bookingCount || 0));
    } else if (sortOption === 'Rating') {
      sortedResults = sortedResults.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    } else if (sortOption === 'Nearby') {
      sortedResults = sortedResults.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    setFilteredResults(sortedResults);
  };

  const applyFilter = async (filterOptions) => {
    try {
      await AsyncStorage.setItem('isAvailableNow', JSON.stringify(filterOptions.isAvailableNow));
      setStoredFilterOptions({ isAvailableNow: filterOptions.isAvailableNow });
    } catch (error) {
      console.error('Failed to save filter options:', error);
      Alert.alert(
        t('error') || 'Error',
        t('filterSaveError') || 'Failed to save filter options. Please try again.'
      );
    } finally {
      setFilterModalVisible(false);
    }
  };

  const handleItemClick = (servicemanId) => {
    navigation.navigate('ViewService', { serviceId: servicemanId });
  };

  const handleCallNow = async (phoneNumber, serviceId) => {
    try {
      const serviceDocRef = doc(db, 'servicemen', serviceId);
      await updateDoc(serviceDocRef, {
        callNowCount: increment(1),
      });
      await Linking.openURL(`tel:${phoneNumber}`);
    } catch (error) {
      console.error('Error updating callNowCount:', error);
      try {
        await Linking.openURL(`tel:${phoneNumber}`);
      } catch (linkingError) {
        Alert.alert(
          t('error') || 'Error',
          t('unableToMakeCall') || 'Unable to make phone call'
        );
      }
    }
  };

  const handleChat = (id) => {
    navigation.navigate('Chat', { otherUserId: id });
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator 
          size="large" 
          color={theme === 'light' ? '#000' : '#e5e5e7'} 
          accessibilityLabel={t('loading') || 'Loading'} 
        />
      </View>
    );
  }

  return (
    <>
      <StatusBar 
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'} 
        backgroundColor={theme === 'light' ? '#fff' : '#1A1A1A'} 
        translucent={true} 
      />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()} 
          activeOpacity={1}
          accessibilityLabel={t('goBack') || 'Go back'} 
          accessibilityRole="button"
        >
          <View style={styles.backIconContainer}>
            <Icon name="arrow-back" size={24} color={theme === 'light' ? '#000' : '#000'} />
          </View>
        </TouchableOpacity>
        <CustomText style={styles.title}>{t('search') || 'Search'}</CustomText>
        <View style={styles.placeholder} />
      </View>

      <TouchableOpacity 
        style={styles.searchWrapper}
        accessibilityLabel={t('searchForService') || 'Search for a service'} 
        accessibilityRole="button"
      >
        <TouchableOpacity 
          style={styles.searchContainer} 
          onPress={() => navigation.navigate('Search')}
        >
          <Image
            source={require('../../../assets/InstaSearch.png')}
            style={styles.InstaSearch}
          />
          <TextInput
            style={styles.searchBar}
            placeholder={t('searchForService') || 'Search for a service'}
            placeholderTextColor={theme === 'light' ? '#888' : '#aaa'}
            value={query}
            onChangeText={setQuery}
            editable={false}
          />
        </TouchableOpacity>
      </TouchableOpacity>

      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={styles.sortButton} 
          onPress={() => setSortModalVisible(true)}
          accessibilityLabel={t('sortResults') || 'Sort results'} 
          accessibilityRole="button"
        >
          <Icon name="swap-vertical-outline" size={18} color={theme === 'light' ? '#000' : '#e5e5e7'} />
          <CustomText style={styles.sortButtonText}>{t('sort') || 'Sort'}</CustomText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={() => setFilterModalVisible(true)}
          accessibilityLabel={t('filterResults') || 'Filter results'} 
          accessibilityRole="button"
        >
          <Icon name="filter-outline" size={18} color={theme === 'light' ? '#000' : '#e5e5e7'} />
          <CustomText style={styles.filterButtonText}>{t('filter') || 'Filter'}</CustomText>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        {filteredResults.length > 0 ? (
          filteredResults.map((result) => (
            <ResultUi
              key={result.id}
              result={result}
              isFavorited={favorites.includes(result.id)}
              onFavoriteToggle={toggleFavorite}
              onItemClick={handleItemClick}
              onCallNow={handleCallNow}
              onChat={handleChat}
              t={t} 
            />
          ))
        ) : (
          <CustomText style={styles.resultText}>
            {t('noResultsFound') || 'No results found.'}
          </CustomText>
        )}
      </ScrollView>

      <Sort
        visible={sortModalVisible}
        onClose={() => setSortModalVisible(false)}
        applySort={applySort}
        t={t} 
      />

      <Filter
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        applyFilter={applyFilter}
        t={t} 
      />
    </>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 6,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
    },
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
    },
    InstaSearch: {
      width: 20,
      height: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 20,
      paddingTop: 25,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
      marginTop: 30,
    },
    backButton: {
      marginRight: 10,
    },
    backIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme === 'light' ? '#fff' : '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      flex: 1,
      textAlign: 'center',
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
    placeholder: {
      width: 40,
    },
    searchWrapper: {
      paddingHorizontal: 20,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderColor: theme === 'light' ? '#ccc' : '#555',
      borderWidth: 1,
      borderRadius: 10,
      paddingLeft: 10,
      padding: 5,
      backgroundColor: theme === 'light' ? '#F4F4F5' : '#3C3C3E',
    },
    searchBar: {
      height: 40,
      fontSize: 16,
      padding: 8,
      flex: 1,
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 8,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
    },
    sortButton: {
      width: '48%',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 30,
      borderRadius: 10,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
      borderColor: theme === 'light' ? '#000' : '#aaa',
      borderWidth: 1,
      elevation: 3,
    },
    sortButtonText: {
      fontSize: 16,
      marginLeft: 8,
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
    filterButton: {
      width: '48%',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 30,
      borderRadius: 10,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
      borderColor: theme === 'light' ? '#000' : '#aaa',
      borderWidth: 1,
      elevation: 3,
    },
    filterButtonText: {
      fontSize: 16,
      marginLeft: 8,
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
    resultText: {
      padding: 20,
      fontSize: 16,
      textAlign: 'center',
      color: theme === 'light' ? '#888' : '#aaa',
    },
  });

export default Result;
