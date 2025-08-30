import React, { useContext } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '../CustomText';
import { ThemeContext } from '../theme/ThemeContext'; 
import { useTranslation } from '../context/TranslationContext'; 

function CategoryScreen() {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext); 
  const { t } = useTranslation(); 
  const styles = getStyles(theme); 

  const services = [
    { 
      name: t('electrician') || 'Electrician', 
      value: 'Electrician', 
      icon: 'construct-outline', 
      image: require('../assets/electrician.png') 
    },
    { 
      name: t('acRepair') || 'AC Repair', 
      value: 'AC Repair', 
      image: require('../assets/ac_repair.png') 
    },
    { 
      name: t('painter') || 'Painter', 
      value: 'Painter', 
      image: require('../assets/paint-roller.png') 
    },
    { 
      name: t('shifting') || 'Shifting', 
      value: 'Shifting', 
      image: require('../assets/delivery.png') 
    },
    { 
      name: t('plumber') || 'Plumber', 
      value: 'Plumber', 
      image: require('../assets/plumber.png') 
    },
    { 
      name: t('carpenter') || 'Carpenter', 
      value: 'Carpenter', 
      image: require('../assets/carpenter.png') 
    },
    { 
      name: t('tvRepair') || 'TV Repair', 
      value: 'TV Repair', 
      image: require('../assets/tel.png') 
    },
    { 
      name: t('laundry') || 'Laundry', 
      value: 'Laundry', 
      image: require('../assets/laundry.png') 
    },
    { 
      name: t('menSalon') || "Men's Salon", 
      value: "Men's Salon", 
      image: require('../assets/barbershop.png') 
    },
    { 
      name: t('womenSalon') || "Women's Salon", 
      value: "Women's Salon", 
      image: require('../assets/hair-cutting.png') 
    },
    { 
      name: t('cleaning') || 'Cleaning', 
      value: 'Cleaning', 
      image: require('../assets/cleaning.png') 
    },
    { 
      name: t('tutors') || 'Tutors (Dance, Music, Academic, Yoga)', 
      value: 'Tutors', 
      image: require('../assets/tutor.png') 
    },
    { 
      name: t('photography') || 'Photography', 
      value: 'Photography', 
      image: require('../assets/photographer.png') 
    },
    { 
      name: t('drivers') || 'Drivers', 
      value: 'Drivers', 
      image: require('../assets/driver.png') 
    },
    { 
      name: t('smartHome') || 'Smart Home Services (CCTV, Wifi)', 
      value: 'Smart Home', 
      image: require('../assets/cam.png') 
    },
    { 
      name: t('carWash') || 'Car Wash at Home', 
      value: 'Car Wash', 
      image: require('../assets/carwash.png') 
    },
    { 
      name: t('waterDelivery') || 'Water Can Delivery', 
      value: 'Water Delivery', 
      image: require('../assets/water-bottle.png') 
    },
    { 
      name: t('interiorDesigners') || 'Interior Designers', 
      value: 'Interior Designers', 
      image: require('../assets/interior.png') 
    },
    { 
      name: t('beautyWellness') || 'Beauty & Wellness', 
      value: 'Beauty Wellness', 
      image: require('../assets/makeup.png') 
    },
    { 
      name: t('roPurifier') || 'RO Water Purifier Services', 
      value: 'RO Water Purifier', 
      image: require('../assets/purifier.png') 
    },
    { 
      name: t('applianceRepair') || 'Appliance Repair (TV, Washing Machine, Refrigerator)', 
      value: 'Appliance Repair', 
      image: require('../assets/appliance-repair.png') 
    },
  ];

  const handleItemPress = async (serviceValue) => {
    try {
      await AsyncStorage.setItem('query', serviceValue);
      navigation.navigate('Results', { query: serviceValue });
    } catch (error) {
      console.error('Error storing the service value', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={theme === 'light' ? '#fff' : '#1A1A1A'}
        translucent={true}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()} 
            activeOpacity={1}
            accessibilityLabel={t('goBack') || 'Go back'} 
            accessibilityRole="button"
          >
            <View style={styles.backIconContainer}>
              <Icon name="arrow-back" size={24} color='#000'/>
            </View>
          </TouchableOpacity>
          <CustomText style={styles.title}>{t('categories') || 'Categories'}</CustomText>
          <View style={styles.placeholder} />
        </View>

        {services.map((item, index) => (
          <TouchableOpacity 
            key={index.toString()} 
            onPress={() => handleItemPress(item.value)} 
            activeOpacity={1}
            accessibilityLabel={`${t('selectService') || 'Select service'}: ${item.name}`} 
            accessibilityRole="button"
          >
            <View style={styles.serviceItem}>
              <Image 
                source={item.image} 
                style={styles.serviceImage}
                accessibilityLabel={`${item.name} ${t('serviceIcon') || 'service icon'}`} 
              />
              <CustomText style={styles.serviceText}>{item.name}</CustomText>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
      marginTop: 10,
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
      elevation: 4,
    },
    title: {
      fontSize: 24,
      flex: 1,
      textAlign: 'center',
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
    placeholder: {
      width: 40,
    },
    scrollContent: {
      padding: 16,
      paddingTop: 20,
    },
    serviceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      marginBottom: 10,
      backgroundColor: theme === 'light' ? '#fff' : '#2C2C2E',
      borderRadius: 8,
      elevation: 4,
    },
    serviceImage: {
      width: 40,
      height: 40,
      marginLeft: 10,
      marginRight: 5,
    },
    serviceText: {
      flex: 1,
      fontSize: 16,
      textAlign: 'center',
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
  });

export default CategoryScreen;
