import React, { useContext } from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '../../../CustomText';
import { ThemeContext } from '../../../theme/ThemeContext'; 
import { useTranslation } from '../../../context/TranslationContext'; 

const ResultUi = ({ result, isFavorited, onFavoriteToggle, onItemClick, onCallNow, onChat }) => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 
  const styles = getStyles(theme);

  const displayName = result.name
    ? result.name.length > 10
      ? `${result.name.slice(0, 10)}...`
      : result.name
    : t('noName') || 'No name'; 

  return (
    <View key={result.id} style={styles.card}>
      <TouchableOpacity 
        style={styles.cardContent} 
        onPress={() => onItemClick(result.id)} 
        activeOpacity={1}
        accessibilityLabel={`${t('viewServiceProvider') || 'View service provider'} ${result.name || t('noName') || 'No name'}`} 
        accessibilityRole="button"
      >
        <Image
          source={{ uri: result.image }}
          style={styles.image}
          accessibilityLabel={`${result.name || t('noName') || 'No name'} ${t('profileImage') || 'profile image'}`} 
        />
        <View style={styles.infoContainer}>
          <View style={styles.nameContainer}>
            <CustomText style={styles.name}>{displayName}</CustomText>
            <View style={[styles.statusIndicator, { backgroundColor: result.isOnline ? '#4CAF50' : '#9E9E9E' }]}>
              <CustomText style={styles.statusText}>
                {result.isOnline ? (t?.('online') || 'Online') : (t?.('offline') || 'Offline')}
              </CustomText>
            </View>
          </View>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={16} color="#FFD700" />
            <CustomText 
              style={styles.rating}
              accessibilityLabel={`${t('rating') || 'Rating'} ${result.avgRating || 0} ${t('outOfFive') || 'out of 5'}`} 
            >
              {result.avgRating || 0}
            </CustomText>
          </View>
          {result.distance !== null && (
            <View style={styles.locationContainer}>
              <Icon name="location-outline" size={14} color={theme === 'light' ? '#555' : '#aaa'} />
              <CustomText 
                style={styles.location}
                accessibilityLabel={`${t('distance') || 'Distance'} ${result.distance} ${t('kilometersAway') || 'kilometers away'}`} 
              >
                {result.distance} {t('kmAway') || 'KM Away'}
              </CustomText>
            </View>
          )}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.callButton} 
              onPress={() => onCallNow(result.phone, result.id)}
              accessibilityLabel={`${t('callNow') || 'Call Now'} ${result.name || t('serviceProvider') || 'service provider'}`} 
              accessibilityRole="button"
            >
              <Image
                source={require('../../../assets/callbuttonicon.png')}
                style={{ width: 18, height: 18, tintColor: '#fff' }}
              />
              <CustomText style={styles.callButtonText}>{t('callNow') || 'Call Now'}</CustomText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.chatButton} 
              onPress={() => onChat(result.id)}
              accessibilityLabel={`${t('chat') || 'Chat'} ${t('with') || 'with'} ${result.name || t('serviceProvider') || 'service provider'}`} 
              accessibilityRole="button"
            >
              <Image
                source={require('../../../assets/chatbuttonicon.png')}
                style={{ width: 21, height: 21, tintColor: '#fff' }}
              />
              <CustomText style={styles.chatButtonText}>{t('chat') || 'Chat'}</CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.favoriteIcon} 
        onPress={() => onFavoriteToggle(result.id)}
        accessibilityLabel={
          isFavorited 
            ? `${t('removeFromFavorites') || 'Remove from favorites'} ${result.name || t('serviceProvider') || 'service provider'}`
            : `${t('addToFavorites') || 'Add to favorites'} ${result.name || t('serviceProvider') || 'service provider'}`
        } 
        accessibilityRole="button"
        accessibilityState={{ selected: isFavorited }}  state
      >
        <Icon
          name={isFavorited ? 'heart' : 'heart-outline'}
          size={24}
          color={isFavorited ? '#FF0000' : theme === 'light' ? '#888' : '#aaa'}
        />
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      margin: 6,
      marginHorizontal: 12,
      padding: 6,
      borderRadius: 10,
      backgroundColor: theme === 'light' ? '#fff' : '#2C2C2E',
      shadowColor: theme === 'light' ? '#000' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 2,
      position: 'relative',
    },
    cardContent: {
      flexDirection: 'row',
    },
    image: {
      width: 140,
      height: 170,
      borderRadius: 8,
      marginRight: 10,
      backgroundColor: theme === 'light' ? '#e5e5e7' : '#3C3C3E', 
    },
    infoContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    nameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginRight: 40,
    },
    name: {
      fontSize: 15,
      fontWeight: 'bold',
      color: theme === 'light' ? '#000' : '#e5e5e7',
      flex: 1,
      marginRight: 8,
    },
    statusIndicator: {
      alignSelf: 'flex-start',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      minWidth: 50,
      alignItems: 'center',
    },
    statusText: {
      fontSize: 9,
      fontWeight: '600',
      color: '#fff',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    rating: {
      fontSize: 16,
      color: theme === 'light' ? '#555' : '#aaa',
      marginLeft: 4,
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 5,
      marginBottom: 5,
    },
    location: {
      fontSize: 13,
      color: theme === 'light' ? '#555' : '#aaa',
      marginLeft: 5,
    },
    buttonContainer: {
      flexDirection: 'column',
      marginTop: 4,
    },
    callButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1AD5B3',
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 20,
      marginBottom: 10,
      justifyContent: 'center',
      elevation: 3,
    },
    callButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    chatButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FF9770',
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 20,
      justifyContent: 'center',
      elevation: 3,
    },
    chatButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    favoriteIcon: {
      position: 'absolute',
      top: 10,
      right: 10,
      padding: 5,
    },
  });

export default ResultUi;
