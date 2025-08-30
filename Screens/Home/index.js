import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, StatusBar, Image, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import EssentialServices from './EssentialServices';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomText from '../../CustomText';
import { ThemeContext } from '../../theme/ThemeContext';
import { useTranslation } from '../../context/TranslationContext';

const SafeImage = ({ source, style, accessibilityLabel, fallbackIcon, theme }) => {
  const [imageError, setImageError] = useState(false);
  
  if (imageError || !source) {
    return (
      <Icon 
        name={fallbackIcon || 'image-outline'} 
        size={30} 
        color={theme === 'light' ? '#007AFF' : '#0a84ff'} 
      />
    );
  }

  return (
    <Image 
      source={source} 
      style={style}
      accessibilityLabel={accessibilityLabel}
      onError={() => setImageError(true)}
    />
  );
};

function MainScreen() {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const [locationName, setLocationName] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  const styles = getStyles(theme);

  const services = [
    { name: t('electrician') || 'Electrician', value: 'Electrician', icon: 'construct-outline', image: require('../../assets/electrician.png') },
    { name: t('acRepair') || 'AC Repair', value: 'AC Repair', image: require('../../assets/ac_repair.png') },
    { name: t('painter') || 'Painter', value: 'Painter', image: require('../../assets/paint-roller.png') },
    { name: t('shifting') || 'Shifting', value: 'Shifting', image: require('../../assets/delivery.png') },
    { name: t('plumber') || 'Plumber', value: 'Plumber', image: require('../../assets/plumber.png') },
    { name: t('carpenter') || 'Carpenter', value: 'Carpenter', image: require('../../assets/carpenter.png') },
    { name: t('tvRepair') || 'TV Repair', value: 'TV Repair', image: require('../../assets/tel.png') },
    { name: t('laundry') || 'Laundry', value: 'Laundry', image: require('../../assets/laundry.png') },
    { name: t('mensSalon') || 'Men\'s Salon', value: 'Men\'s Salon', image: require('../../assets/barbershop.png') },
    { name: t('womensSalon') || 'Women\'s Salon', value: 'Women\'s Salon', image: require('../../assets/hair-cutting.png') },
    { name: t('cleaning') || 'Cleaning', value: 'Cleaning', image: require('../../assets/cleaning.png') },
    { name: t('more') || 'More', value: 'More', image: require('../../assets/more.png') },
  ];

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const storedLocation = await AsyncStorage.getItem('location');
        if (storedLocation) {
          const { city, address } = JSON.parse(storedLocation);
          setLocationName(city || t('yourLocation') || 'Your Location');
          setLocationDetails(address || t('selectYourLocation') || 'Select Your Location');
          console.log('Original Location Details:', address);
        } else {
          navigation.replace('AddLocation');
        }
      } catch (error) {
        console.error('Error retrieving location:', error);
        navigation.replace('AddLocation');
      }
    };

    fetchLocation();
  }, [navigation, t]);

  const handleSearchPress = () => {
    navigation.navigate('Search');
  };

  const handleServicePress = (serviceName, serviceValue) => {
    if (serviceValue === 'More') {
      navigation.navigate('Category');
    } else {
      navigation.navigate('Results', { query: serviceValue });
    }
  };

  const truncatedDetails = locationDetails.length > 32 
    ? `${locationDetails.slice(0, 32)}...` 
    : locationDetails;

  console.log('Truncated Location Details:', truncatedDetails);

  const renderServiceItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.serviceItem}
      activeOpacity={1}
      onPress={() => handleServicePress(item.name, item.value)}
      accessibilityLabel={`${t('selectService') || 'Select service'}: ${item.name}`}
      accessibilityRole="button"
      accessibilityHint={
        item.value === 'More' 
          ? t('tapToViewMoreServices') || 'Tap to view more services'
          : `${t('tapToSearchFor') || 'Tap to search for'} ${item.name}`
      }
    >
      <View style={styles.serviceIconContainer}>
        <SafeImage 
          source={item.image} 
          style={styles.serviceImage}
          accessibilityLabel={`${item.name} ${t('icon') || 'icon'}`}
          fallbackIcon={item.icon}
          theme={theme}
        />
      </View>
      <CustomText style={styles.serviceText}>{item.name}</CustomText>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.locationContainer}
          onPress={() => navigation.navigate('AddLocation')}
          accessibilityLabel={`${t('changeLocation') || 'Change location'}: ${locationName}, ${truncatedDetails}`}
          accessibilityRole="button"
          accessibilityHint={t('tapToChangeLocation') || 'Tap to change your location'}
        >
          <Icon name="location-outline" size={30} color={theme === 'light' ? '#000000' : '#e5e5e7'} style={styles.locationIcon} />
          <View style={styles.locationTextContainer}>
            <CustomText style={styles.mainLocationText}>
              {locationName || t('yourLocation') || 'Your Location'}
            </CustomText>
            <CustomText
              style={styles.locationButtonText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {truncatedDetails || t('selectYourLocation') || 'Select Your Location'}
            </CustomText>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.searchContainer} 
        onPress={handleSearchPress}
        accessibilityLabel={t('searchServices') || 'Search services'}
        accessibilityRole="button"
        accessibilityHint={t('tapToSearchServices') || 'Tap to search for services'}
      >
        <Icon
          name="search-outline"
          size={28}
          color={theme === 'light' ? '#000' : '#e5e5e7'}
          style={styles.searchIcon}
        />
        <CustomText style={styles.searchInput}>{t('search') || 'Search'}</CustomText>
        <TouchableOpacity 
          style={styles.microphoneContainer} 
          onPress={() => navigation.navigate('Voice')}
          accessibilityLabel={t('voiceSearch') || 'Voice search'}
          accessibilityRole="button"
          accessibilityHint={t('tapForVoiceSearch') || 'Tap to use voice search'}
        >
          <Icon name="mic" size={30} color={theme === 'light' ? '#000' : '#e5e5e7'} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => (
    <EssentialServices t={t} />
  );

  return (
    <>
      <StatusBar
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={theme === 'light' ? '#fff' : '#1A1A1A'}
        translucent={true}
      />
      <FlatList
        data={services}
        renderItem={renderServiceItem}
        numColumns={4}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        accessibilityLabel={t('mainScreenView') || 'Main screen view'}
        columnWrapperStyle={styles.serviceRow}
      />
    </>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      padding: 5,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
      paddingBottom: 100,
    },
    headerContainer: {
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
      paddingHorizontal: 16,
      borderBottomWidth: 0,
      borderBottomColor: theme === 'light' ? '#fff' : '#1A1A1A',
      marginTop: 30,
      marginBottom: 10,
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: 8,
    },
    locationIcon: {
      marginRight: 8,
    },
    locationTextContainer: {
      flex: 1,
      maxWidth: '90%',
    },
    mainLocationText: {
      fontSize: 16,
      color: theme === 'light' ? '#000000' : '#e5e5e7',
    },
    locationButtonText: {
      fontSize: 12,
      color: theme === 'light' ? '#000000' : '#aaa',
    },
    searchContainer: {
      height: 50,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'light' ? '#F4F4F5' : '#2C2C2E',
      borderRadius: 8,
      paddingHorizontal: 8,
      marginHorizontal: 5,
      marginBottom: 16,
    },
    searchInput: {
      fontSize: 16,
      flex: 1,
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
    searchIcon: {
      marginRight: 8,
    },
    microphoneContainer: {
      paddingVertical: 10,
      marginLeft: 10,
    },
    serviceRow: {
      justifyContent: 'space-between',
      paddingHorizontal: 5,
    },
    serviceItem: {
      width: '22%',
      alignItems: 'center',
      marginBottom: 16,
    },
    serviceIconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme === 'light' ? '#fff' : '#2C2C2E',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      shadowColor: theme === 'light' ? '#000' : '#fff',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 1,
    },
    serviceImage: {
      width: 40,
      height: 40,
    },
    serviceText: {
      textAlign: 'center',
      fontSize: 14,
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
  });

export default MainScreen;
