import React, { useContext, useMemo } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import CustomText from '../../CustomText';
import { ThemeContext } from '../../theme/ThemeContext'; 
import { useTranslation } from '../../context/TranslationContext'; 

const themes = {
  light: {
    background: '#fff',
    textPrimary: '#000',
    textSecondary: '#555',
    buttonPrimary: '#06D6A0',
    buttonSecondary: '#FF9770',
    buttonTertiary: '#007BFF',
    buttonText: '#fff',
    iconPrimary: '#000',
    iconSecondary: '#FFD700',
    border: '#000',
    modalBackground: '#fff',
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    error: 'red',
    success: '#00C497',
    inputBackground: '#F5F5F5',
    inputBorder: '#ddd',
    photoButtonBackground: '#F5F5F5',
    photoButtonBorder: '#ddd',
  },
  dark: {
    background: '#1A1A1A',
    textPrimary: '#fff',
    textSecondary: '#aaa',
    buttonPrimary: '#06D6A0',
    buttonSecondary: '#FF9770',
    buttonTertiary: '#007BFF',
    buttonText: '#fff',
    iconPrimary: '#fff',
    iconSecondary: '#FFD700',
    border: '#fff',
    modalBackground: '#333',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    error: '#ff6666',
    success: '#00C497',
    inputBackground: '#444',
    inputBorder: '#666',
    photoButtonBackground: '#444',
    photoButtonBorder: '#666',
  },
};

const BookingCard = ({
  booking,
  favorites,
  toggleFavorite,
  handleWriteReview,
  handleCall,
  formatDate,
}) => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 
  const { serviceman, hasReview, reviewRating, BookedOn } = booking;

  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <View style={styles.card}>
      <View style={styles.profileSection}>
        <Image 
          source={{ uri: serviceman.image }} 
          style={styles.profileImage}
          accessibilityLabel={`${serviceman.name || t('serviceProvider') || 'Service Provider'} ${t('profileImage') || 'profile image'}`} 
        />
                  <View style={styles.profileInfo}>
            <View style={styles.headerSection}>
              <View style={styles.nameContainer}>
                <CustomText style={styles.name}>
                  {serviceman.name || t('serviceProvider') || 'Service Provider'}
                </CustomText>
                <View style={[styles.statusIndicator, { backgroundColor: serviceman.isOnline ? '#4CAF50' : '#9E9E9E' }]}>
                  <CustomText style={styles.statusText}>
                    {serviceman.isOnline ? (t?.('online') || 'Online') : (t?.('offline') || 'Offline')}
                  </CustomText>
                </View>
              </View>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => toggleFavorite(serviceman.id)}
              accessibilityLabel={
                favorites.includes(serviceman.id)
                  ? `${t('removeFromFavorites') || 'Remove from favorites'} ${serviceman.name || t('serviceProvider') || 'service provider'}`
                  : `${t('addToFavorites') || 'Add to favorites'} ${serviceman.name || t('serviceProvider') || 'service provider'}`
              } 
              accessibilityRole="button"
              accessibilityState={{ selected: favorites.includes(serviceman.id) }}  state
            >
              <Ionicons
                name={favorites.includes(serviceman.id) ? 'heart' : 'heart-outline'}
                size={24}
                color={favorites.includes(serviceman.id) ? '#FF0000' : themes[theme].iconPrimary}
              />
            </TouchableOpacity>
          </View>

          <View 
            style={styles.ratingRow}
            accessibilityLabel={`${t('rating') || 'Rating'}: ${serviceman.avgRating?.toFixed(1) || '0'} ${t('outOfFive') || 'out of 5'}`} 
          >
            <Ionicons name="star" size={18} color={themes[theme].iconSecondary} />
            <CustomText style={styles.ratingText}>
              {serviceman.avgRating?.toFixed(1) || '0'}
            </CustomText>
          </View>

          <View style={styles.locationContainer}>
            <Ionicons
              name="location-outline"
              size={15}
              color={themes[theme].textSecondary}
              style={styles.icon}
            />
            <CustomText 
              style={styles.location}
              accessibilityLabel={`${t('location') || 'Location'}: ${serviceman.address || t('unknownLocation') || 'Unknown Location'}`} 
            >
              {serviceman.address || t('unknownLocation') || 'Unknown Location'}
            </CustomText>
          </View>

          <View style={styles.bookingDateContainer}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={themes[theme].textSecondary}
              style={styles.icon}
            />
            <CustomText 
              style={styles.bookingDate}
              accessibilityLabel={`${t('bookedOn') || 'Booked on'} ${formatDate(BookedOn)}`} 
            >
              {t('bookedOn') || 'Booked on'} {formatDate(BookedOn)}
            </CustomText>
          </View>

          <TouchableOpacity
            style={styles.callButton}
            onPress={() => handleCall(serviceman.phone)}
            accessibilityLabel={`${t('callNow') || 'Call Now'} ${serviceman.name || t('serviceProvider') || 'service provider'}`} 
            accessibilityRole="button"
          >
            <View style={styles.callButtonContent}>
              <Image
                source={require('../../assets/callbuttonicon.png')}
                style={[styles.callIcon, { tintColor: themes[theme].buttonText }]}
              />
              <CustomText style={styles.callButtonText}>{t('callNow') || 'Call Now'}</CustomText>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <CustomText 
        style={styles.reviewGivenText}
        accessibilityLabel={hasReview ? t('yourRating') || 'Your rating' : t('rateTheServiceNow') || 'Rate the service now'} 
      >
        {hasReview ? t('yourRating') || 'Your rating' : t('rateTheServiceNow') || 'Rate the service now'}
      </CustomText>

      <View 
        style={styles.rating}
        accessibilityLabel={`${t('currentRating') || 'Current rating'}: ${reviewRating || 0} ${t('outOfFiveStars') || 'out of 5 stars'}`} 
        accessibilityRole="text"
      >
        {Array(5)
          .fill()
          .map((_, index) => (
            <FontAwesome
              key={index}
              name="star"
              size={30}
              color={index < (reviewRating || 0) ? themes[theme].iconSecondary : themes[theme].textSecondary}
              style={styles.starIcon}
            />
          ))}
      </View>

      <TouchableOpacity
        style={styles.writeReviewButton}
        onPress={() => handleWriteReview(booking)}
        accessibilityLabel={
          hasReview 
            ? `${t('editReview') || 'Edit Review'} ${t('for') || 'for'} ${serviceman.name || t('serviceProvider') || 'service provider'}`
            : `${t('writeReview') || 'Write Review'} ${t('for') || 'for'} ${serviceman.name || t('serviceProvider') || 'service provider'}`
        } 
        accessibilityRole="button"
      >
        <CustomText style={styles.writeReviewText}>
          {hasReview ? t('editReview') || 'Edit Review' : t('writeReview') || 'Write Review'}
        </CustomText>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (theme) => {
  const colors = themes[theme] || themes.light;
  return StyleSheet.create({
    card: {
      backgroundColor: colors.modalBackground,
      borderRadius: 10,
      padding: 10,
      elevation: 3,
      marginBottom: 20,
    },
    profileSection: {
      flexDirection: 'row',
      marginBottom: 10,
    },
    profileImage: {
      width: 120,
      height: 150,
      borderRadius: 10,
      marginRight: 10,
    },
    profileInfo: {
      flex: 1,
    },
    headerSection: {
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
      fontSize: 18,
      color: colors.textPrimary,
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
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
    },
    ratingText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 5,
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
    },
    location: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    bookingDateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
    },
    bookingDate: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft:2,
    },
    callButton: {
      backgroundColor: colors.buttonPrimary,
      borderRadius: 50,
      paddingVertical: 10,
      alignItems: 'center',
    },
    callButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    callIcon: {
      width: 18,
      height: 18,
      marginRight: 5,
    },
    callButtonText: {
      color: colors.buttonText,
      fontSize: 16,
    },
    reviewGivenText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 10,
    },
    rating: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 10,
    },
    starIcon: {
      marginRight: 5,
    },
    writeReviewButton: {
      alignItems: 'center',
    },
    writeReviewText: {
      fontSize: 16,
      color: colors.buttonTertiary,
      textAlign: 'center',
    },
  });
};

export default BookingCard;
