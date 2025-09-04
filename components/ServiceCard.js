import React, { useContext } from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '../CustomText';
import { ThemeContext } from '../theme/ThemeContext'; 

function ServiceCard({ service, isFavorited, onToggleFavorite, onCallNow, onChat, onPress, t }) {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  return (
    <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={1}>
      <Image source={{ uri: service.image }} style={styles.image} />
      <View style={styles.info}>
        <View style={styles.headerInfo}>
          <View style={styles.nameContainer}>
            <CustomText style={styles.name}>{service.profession}</CustomText>
            <View style={[styles.statusIndicator, { backgroundColor: service.isOnline ? '#4CAF50' : '#9E9E9E' }]}>
              <CustomText style={styles.statusText}>
                {service.isOnline ? (t?.('online') || 'Online') : (t?.('offline') || 'Offline')}
              </CustomText>
            </View>
          </View>
          <TouchableOpacity onPress={onToggleFavorite} style={styles.favoriteButton}>
            <Icon
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorited ? '#FF0000' : theme === 'light' ? '#888' : '#aaa'}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.ratingContainer}>
          <Icon name="star" size={14} color="#FFD700" />
          <CustomText style={styles.rating}>
            {service.avgRating ? service.avgRating.toFixed(1) : '0'}
          </CustomText>
        </View>
        <View style={styles.locationContainer}>
          <Icon
            name="location-outline"
            size={14}
            color={theme === 'light' ? '#555' : '#aaa'}
          />
          <CustomText style={styles.address}>{service.address}</CustomText>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.callButton} onPress={onCallNow}>
            <Icon
              name="call-outline"
              size={18}
              color="#fff"
              style={styles.buttonIcon}
            />
            <CustomText style={styles.buttonText}>Call Now</CustomText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chatButton} onPress={onChat}>
            <Image
              source={require('../assets/chatbuttonicon.png')}
              style={styles.buttonImage}
              resizeMode="contain"
            />
            <CustomText style={styles.buttonText}>Chat</CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: theme === 'light' ? '#fff' : '#2C2C2E',
      borderRadius: 10,
      padding: 10,
      marginBottom: 15,
      marginHorizontal: 8,
      shadowColor: theme === 'light' ? '#000' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 2,
    },
    image: {
      width: 150,
      height: 170,
      borderRadius: 10,
      marginRight: 10,
      backgroundColor: theme === 'light' ? '#e5e5e7' : '#3C3C3E',
    },
    info: {
      flex: 1,
      justifyContent: 'space-between',
    },
    headerInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 5,
    },
    nameContainer: {
      flex: 1,
      marginRight: 10,
    },
    name: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme === 'light' ? '#000' : '#e5e5e7',
      marginBottom: 4,
    },
    statusIndicator: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      minWidth: 60,
      alignItems: 'center',
    },
    statusText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#fff',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    favoriteButton: {
      padding: 5,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
    },
    rating: {
      fontSize: 14,
      color: theme === 'light' ? '#555' : '#aaa',
      marginLeft: 5,
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    address: {
      fontSize: 14,
      color: theme === 'light' ? '#555' : '#aaa',
      marginLeft: 5,
    },
    actions: {
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    callButton: {
      backgroundColor: '#1AD5B3',
      borderRadius: 50,
      paddingVertical: 8,
      paddingHorizontal: 15,
      marginBottom: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 3,
    },
    chatButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FF9770',
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 50,
      elevation: 3,
    },
    buttonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
      marginLeft: 5,
    },
    buttonIcon: {
      marginRight: 5,
    },
    buttonImage: {
      width: 18,
      height: 18,
      marginRight: 5,
      tintColor: '#fff', 
    },
  });

export default ServiceCard;