import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Modal,
  Linking,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { db } from '../utils/firebase';
import {
  doc,
  setDoc,
  getDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import CustomText from '../CustomText';
import { ThemeContext } from '../theme/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from '../context/TranslationContext'; 

const themes = {
  light: {
    background: '#fff',
    textPrimary: '#000',
    textSecondary: '#555',
    buttonPrimary: '#06D6A0',
    buttonSecondary: '#FF9770',
    buttonTertiary: '#000',
    buttonText: '#fff',
    iconPrimary: '#000',
    iconSecondary: '#FFD700',
    border: '#000',
    modalBackground: '#fff',
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    error: 'red',
    success: '#00C497',
  },
  dark: {
    background: '#1A1A1A',
    textPrimary: '#fff',
    textSecondary: '#aaa',
    buttonPrimary: '#06D6A0',
    buttonSecondary: '#FF9770',
    buttonTertiary: '#333',
    buttonText: '#fff',
    iconPrimary: '#fff',
    iconSecondary: '#FFD700',
    border: '#fff',
    modalBackground: '#333',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    error: '#ff6666',
    success: '#00C497',
  },
};

const buttonStyles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    marginBottom: 10,
    borderRadius: 5,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
  },
});

const CustomButton = ({ title, onPress, theme, width, borderRadius, t }) => { 
  const colors = themes[theme] || themes.light;
  let iconSource;

  const translatedTitle = 
    title === 'Call Now' ? t('callNow') || 'Call Now' :
    title === 'Chat' ? t('chat') || 'Chat' :
    title === 'Book Now' ? t('bookNow') || 'Book Now' :
    title;

  if (title === 'Call Now') {
    iconSource = require('../assets/callbuttonicon.png');
  } else if (title === 'Chat') {
    iconSource = require('../assets/chatbuttonicon.png');
  } else {
    iconSource = null;
  }

  const buttonColor =
    title === 'Call Now'
      ? colors.buttonPrimary
      : title === 'Chat'
      ? colors.buttonSecondary
      : colors.buttonTertiary;

  return (
    <TouchableOpacity
      activeOpacity={0.5}
      style={[buttonStyles.button, { backgroundColor: buttonColor, width: width || 'auto', borderRadius: borderRadius || 5 }]}
      onPress={onPress}
      accessibilityLabel={translatedTitle} 
      accessibilityRole="button"
    >
      <View style={buttonStyles.buttonContent}>
        {iconSource && (
          <Image
            source={iconSource}
            style={{ width: 18, height: 18, tintColor: colors.buttonText, marginRight: 8 }}
          />
        )}
        <CustomText style={[buttonStyles.buttonText, { color: colors.buttonText }]}>
          {translatedTitle}
        </CustomText>
      </View>
    </TouchableOpacity>
  );
};

export default function ServiceManDetails() {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 
  const route = useRoute();
  const navigation = useNavigation();
  const { serviceId } = route.params;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [averageRating, setAverageRating] = useState(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [todayDate, setTodayDate] = useState('');

  const styles = useMemo(() => getStyles(theme), [theme]);

  useEffect(() => {
    const formatDate = () => {
      const date = new Date();
      const options = { month: 'long', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    };

    setTodayDate(formatDate());

    const fetchData = async () => {
      try {
        if (!serviceId) {
          setError(t('noServiceIdProvided') || 'No service ID provided');
          setLoading(false);
          return;
        }

        const docRef = doc(db, 'servicemen', serviceId);
        await updateDoc(docRef, { impressions: increment(1) });
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setData(docSnap.data());

          const ratingsRef = collection(db, 'reviews');
          const q = query(ratingsRef, where('sid', '==', serviceId));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            let totalRating = 0;
            querySnapshot.forEach((doc) => {
              totalRating += parseFloat(doc.data().rating);
            });
            setAverageRating(totalRating / querySnapshot.size);
            setReviewCount(querySnapshot.size);
          } else {
            setAverageRating(0);
            setReviewCount(0);
          }

          const userId = await AsyncStorage.getItem('uid');
          if (userId) {
            const userDocRef = doc(db, 'users', userId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              setIsFavorited(userData.favorites?.includes(serviceId) || false);
              setIsBooked(userData.bookings?.includes(serviceId) || false);
            }
          }
        } else {
          setError(t('noSuchDocument') || 'No such document!');
        }
      } catch (e) {
        console.error('Error fetching document: ', e);
        setError(t('errorFetchingData') || 'Error fetching data');
      }
      setLoading(false);
    };

    fetchData();
  }, [serviceId, t]);

  const toggleFavorite = async () => {
    try {
      const userId = await AsyncStorage.getItem('uid');
      if (!userId) return;

      const newFavoriteStatus = !isFavorited;
      setIsFavorited(newFavoriteStatus);

      const userDocRef = doc(db, 'users', userId);
      if (newFavoriteStatus) {
        await updateDoc(userDocRef, { favorites: arrayUnion(serviceId) });
      } else {
        await updateDoc(userDocRef, { favorites: arrayRemove(serviceId) });
      }
    } catch (e) {
      console.error('Error toggling favorite status: ', e);
      Alert.alert(
        t('error') || 'Error',
        t('favoriteToggleError') || 'Failed to update favorite status'
      );
    }
  };

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const checkExistingBooking = async (userId, serviceId) => {
    const userBookingsRef = collection(db, 'users', userId, 'Bookings');
    const sidQuery = query(userBookingsRef, where('sid', '==', serviceId));
    const sidQuerySnapshot = await getDocs(sidQuery);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    return sidQuerySnapshot.docs.some((doc) => {
      const bookingDate = doc.data().BookingDate.toDate();
      return bookingDate >= todayStart && bookingDate <= todayEnd;
    });
  };

  const handleBookNow = async () => {
    try {
      const userId = await AsyncStorage.getItem('uid');
      if (!userId || !serviceId) return;

      const hasExistingBooking = await checkExistingBooking(userId, serviceId);
      if (hasExistingBooking) {
        setModalMessage(t('alreadyBookedToday') || 'You already have a booking for today with this service.');
        setModalVisible(true);
        return;
      }

      const bookingId = generateUUID();
      await AsyncStorage.setItem('bookingId', bookingId);

      const serviceManDocRef = doc(db, 'servicemen', serviceId);
      const serviceManDocSnap = await getDoc(serviceManDocRef);
      const servicemanLocation = serviceManDocSnap.exists() ? serviceManDocSnap.data().location : null;

      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      const userLocation = userDocSnap.exists() ? userDocSnap.data().address : null;

      if (!servicemanLocation || !userLocation) {
        throw new Error('Location data not found');
      }

      const userBookingData = {
        bookingId,
        uid: userId,
        sid: serviceId,
        BookedOn: Timestamp.now(),
        BookingDate: Timestamp.now(),
        Location: servicemanLocation,
      };

      const serviceManBookingData = {
        bookingId,
        uid: userId,
        sid: serviceId,
        BookedOn: Timestamp.now(),
        BookingDate: Timestamp.now(),
        Location: userLocation,
      };

      await setDoc(doc(db, 'users', `${userId}/Bookings/${bookingId}`), userBookingData);
      await setDoc(doc(db, 'servicemen', `${serviceId}/Bookings/${bookingId}`), serviceManBookingData);

      const messageData = {
        sender: userId,
        receiver: serviceId,
        participants: [userId, serviceId],
        timestamp: serverTimestamp(),
        type: 'booked',
        bookingId: bookingId,
      };

      await addDoc(collection(db, 'messages'), messageData);

      setIsBooked(true);
      setModalMessage(t('bookingSuccessful') || 'Booking successful!');
      setModalVisible(true);
    } catch (e) {
      console.error('Error booking service: ', e);
      setModalMessage(t('errorBookingService') || 'Error booking service');
      setModalVisible(true);
    }
  };

  const handleCallNow = async () => {
    if (data && data.phone) {
      try {
        const docRef = doc(db, 'servicemen', serviceId);
        await updateDoc(docRef, { callNowCount: increment(1) });
        await Linking.openURL(`tel:${data.phone}`);
      } catch (e) {
        console.error('Error updating callNowCount: ', e);
        try {
          await Linking.openURL(`tel:${data.phone}`);
        } catch (linkError) {
          Alert.alert(
            t('error') || 'Error',
            t('unableToMakeCall') || 'Unable to make phone call'
          );
        }
      }
    } else {
      setModalMessage(t('phoneNumberNotAvailable') || 'Phone number is not available');
      setModalVisible(true);
    }
  };

  const handleChat = () => {
    if (data && data.phone) {
      navigation.navigate('Chat', { otherUserId: serviceId });
    } else {
      setModalMessage(t('phoneNumberNotAvailable') || 'Phone number is not available');
      setModalVisible(true);
    }
  };

  const formatTimestamp = useCallback((timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return format(date, 'hh:mm a');
  }, []);

  const toggleDescription = useCallback(() => {
    setShowFullDescription((prev) => !prev);
  }, []);

  const renderDescription = useCallback(
    (text) => {
      if (!text) return null;

      const isTruncated = typeof text === 'string' && text.length > 150;
      const displayText = showFullDescription || !isTruncated ? text : `${text.slice(0, 150)}...`;

      return (
        <View>
          <CustomText style={styles.description}>{displayText}</CustomText>
          {isTruncated && (
            <TouchableOpacity 
              onPress={toggleDescription}
              accessibilityLabel={showFullDescription ? t('showLess') || 'Show less' : t('showMore') || 'Show more'} 
              accessibilityRole="button"
            >
              <CustomText style={styles.readMore}>
                {showFullDescription ? t('seeLess') || 'See Less' : t('seeMore') || 'See More'}
              </CustomText>
            </TouchableOpacity>
          )}
        </View>
      );
    },
    [showFullDescription, toggleDescription, styles, t]
  );

  if (loading) {
    return (
      <ActivityIndicator 
        style={styles.loading} 
        size="large" 
        color={themes[theme].textPrimary}
        accessibilityLabel={t('loading') || 'Loading'} 
      />
    );
  }

  if (error) {
    return <CustomText style={[styles.error, { color: themes[theme].error }]}>{error}</CustomText>;
  }

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={themes[theme].background}
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      >
        {data && (
          <>
            <View style={styles.imageContainer}>
              {data.image && (
                <Image 
                  source={{ uri: data.image }} 
                  style={styles.image}
                  accessibilityLabel={`${data.name || t('serviceProvider') || 'Service provider'} ${t('profileImage') || 'profile image'}`} 
                />
              )}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                accessibilityLabel={t('goBack') || 'Go back'} 
                accessibilityRole="button"
              >
                <Ionicons name="arrow-back" size={24} color={themes[theme].iconPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.heartButton}
                onPress={toggleFavorite}
                accessibilityLabel={
                  isFavorited 
                    ? t('removeFromFavorites') || 'Remove from favorites' 
                    : t('addToFavorites') || 'Add to favorites'
                } 
                accessibilityRole="button"
              >
                <Ionicons
                  name={isFavorited ? 'heart' : 'heart-outline'}
                  size={26}
                  color={isFavorited ? 'red' : themes[theme].textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.header}>
              <View>
                <CustomText style={styles.name}>{data.name || t('unknownServiceProvider') || 'Unknown Service Provider'}</CustomText>
                <CustomText style={styles.profession}>({data.profession || t('unknownProfession') || 'Unknown Profession'})</CustomText>
              </View>
            </View>

            <View style={styles.ratingContainer}>
              <View style={styles.ratingLeftContainer}>
                <Ionicons name="star" size={20} color={themes[theme].iconSecondary} style={styles.starIcon} />
                <CustomText 
                  style={styles.rating}
                  accessibilityLabel={`${t('rating') || 'Rating'}: ${averageRating !== null ? averageRating.toFixed(1) : t('notAvailable') || 'Not available'} ${t('outOfFive') || 'out of 5'}`} 
                >
                  {averageRating !== null ? averageRating.toFixed(1) : t('notAvailable') || 'N/A'}
                </CustomText>
                <CustomText 
                  style={styles.reviewCount}
                  accessibilityLabel={`${reviewCount} ${t('reviews') || 'reviews'}`} 
                >
                  ({reviewCount})
                </CustomText>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('ViewReviews', { serviceId })}
                accessibilityLabel={t('viewAllReviews') || 'View all reviews'} 
                accessibilityRole="button"
              >
                <CustomText style={styles.reviewLink}>{t('seeAllReviews') || 'See all reviews'}</CustomText>
              </TouchableOpacity>
            </View>

            {renderDescription(data.description)}

            <View style={styles.availabilityContainer}>
              <CustomText style={styles.availabilityLabel}>{t('availabilityTimings') || 'Availability Timings'}:</CustomText>
              {data.availabilityStart && data.availabilityEnd ? (
                <CustomText 
                  style={styles.availability}
                  accessibilityLabel={`${t('availableFrom') || 'Available from'} ${formatTimestamp(data.availabilityStart)} ${t('to') || 'to'} ${formatTimestamp(data.availabilityEnd)}`} 
                >
                  {` ${formatTimestamp(data.availabilityStart)} - ${formatTimestamp(data.availabilityEnd)}`}
                </CustomText>
              ) : (
                <CustomText style={styles.availability}>{t('notAvailable') || 'NA'}</CustomText>
              )}
            </View>

            <View style={styles.headingContainer}>
              <CustomText style={styles.photosLabel}>{t('media') || 'Media'}:</CustomText>
              {data.media && data.media.length > 5 && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('ShowAllMedia', { media: data.media })}
                  accessibilityLabel={t('showAllMedia') || 'Show all media'} 
                  accessibilityRole="button"
                >
                  <CustomText style={styles.showMoreText}>({t('showAll') || 'Show All'})</CustomText>
                </TouchableOpacity>
              )}
            </View>

            {data.media && data.media.length > 0 ? (
              <View style={styles.mediaContainer}>
                {data.media.slice(0, 5).map((item, index) => (
                  <View key={index} style={styles.mediaWrapper}>
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate('FullMedia', {
                          mediaUrl: item.url,
                          mediaType: item.type,
                          profileImage: data.image,
                          name: data.name,
                        })
                      }
                      accessibilityLabel={`${t('viewMedia') || 'View media'} ${index + 1}: ${item.type === 'image' ? t('image') || 'image' : t('video') || 'video'}`} // ✅ Enhanced accessibility
                      accessibilityRole="button"
                    >
                      <Image
                        source={{ uri: item.url }}
                        style={styles.reviewMedia}
                        resizeMode={item.type === 'image' ? 'cover' : 'contain'}
                        defaultSource={{ uri: 'https://via.placeholder.com/60' }}
                      />
                      {item.type === 'video' && (
                        <Ionicons
                          name="play-circle"
                          size={24}
                          color={themes[theme].iconPrimary}
                          style={styles.playIcon}
                          accessibilityLabel={t('playButton') || 'Play button'} 
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <CustomText style={styles.availability}>{t('noMediaAvailable') || 'No media available'}</CustomText>
            )}

            <CustomText style={styles.servicesLabel}>{t('services') || 'Services'}:</CustomText>
            {data.services && data.services.length > 0 ? (
              data.services.map((service, index) => (
                <CustomText key={index} style={styles.service}>
                  {`${index + 1}. ${service}`}
                </CustomText>
              ))
            ) : (
              <CustomText style={styles.availability}>{t('noServicesAvailable') || 'No services available'}</CustomText>
            )}

            <View style={{ height: 120 }} />
          </>
        )}

        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
          accessibilityViewIsModal={true} 
        >
          <View style={[styles.modalOverlay, { backgroundColor: themes[theme].modalOverlay }]}>
            <View style={[styles.modalContainer, { backgroundColor: themes[theme].modalBackground }]}>
              <View style={styles.modalView}>
                <TouchableOpacity
                  style={[styles.closeButton, { borderColor: themes[theme].border }]}
                  onPress={() => setModalVisible(false)}
                  accessibilityLabel={t('closeModal') || 'Close modal'} 
                  accessibilityRole="button"
                >
                  <Ionicons name="close-outline" size={24} color={themes[theme].iconPrimary} />
                </TouchableOpacity>

                <View style={styles.successIconContainer}>
                  <View style={[styles.successIcon, { borderColor: themes[theme].border }]}>
                    <Ionicons name="checkmark" size={40} color={themes[theme].iconPrimary} />
                  </View>
                </View>

                <CustomText style={styles.modalTitle}>{modalMessage}</CustomText>
                <CustomText style={[styles.modalSubTitle, { color: themes[theme].success }]}>
                  {t('bookedOn') || 'Booked on'} {todayDate}
                </CustomText>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>

      <View style={[styles.cardContainer, { backgroundColor: themes[theme].background }]}>
        <View style={styles.buttonContainer}>
          <CustomButton
            title="Call Now"
            onPress={handleCallNow}
            theme={theme}
            borderRadius={50}
            width="45%"
            t={t} 
          />
          <CustomButton
            title="Chat"
            onPress={handleChat}
            theme={theme}
            borderRadius={50}
            width="45%"
            t={t} 
          />
        </View>
        <View style={styles.bookButtonContainer}>
          <CustomButton
            title="Book Now"
            onPress={handleBookNow}
            theme={theme}
            borderRadius={50}
            width="100%"
            t={t} 
          />
        </View>
      </View>
    </View>
  );
}

const getStyles = (theme) => {
  const colors = themes[theme] || themes.light;
  return StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 10,
      marginTop: 50,
    },
    scrollContent: {
      paddingBottom: 100,
    },
    loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    headingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
      marginHorizontal: 10,
    },
    photosLabel: {
      fontSize: 20,
      color: colors.textPrimary,
    },
    showMoreText: {
      color: colors.textPrimary,
      fontSize: 16,
      textDecorationLine: 'none',
    },
    mediaContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      marginHorizontal: 10,
    },
    mediaWrapper: {
      position: 'relative',
      marginRight: 8,
      marginBottom: 10,
    },
    reviewMedia: {
      width: 60,
      height: 60,
      borderRadius: 8,
    },
    playIcon: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -12 }, { translateY: -12 }],
      opacity: 0.8,
    },
    cardContainer: {
      position: 'absolute',
      bottom: 10,
      left: 10,
      right: 10,
      backgroundColor: colors.background,
      padding: 15,
      borderRadius: 10,
      elevation: 5,
    },
    image: {
      width: '100%',
      height: 250,
      marginBottom: 16,
      borderRadius: 10,
    },
    imageContainer: {
      position: 'relative',
    },
    backButton: {
      position: 'absolute',
      top: 28,
      left: 16,
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 8,
    },
    heartButton: {
      position: 'absolute',
      bottom: 40,
      right: 16,
      backgroundColor: colors.background,
      borderRadius: 30,
      padding: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    name: {
      fontSize: 20,
      color: colors.textPrimary,
      marginHorizontal: 10,
    },
    profession: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 16,
      marginHorizontal: 10,
    },
    ratingContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      marginHorizontal: 10,
    },
    ratingLeftContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    starIcon: {
      marginRight: 4,
    },
    rating: {
      fontSize: 16,
      color: colors.textPrimary,
    },
    reviewCount: {
      fontSize: 16,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    reviewLink: {
      fontSize: 16,
      color: colors.textPrimary,
      borderColor: colors.border,
      borderBottomWidth: 1,
      marginHorizontal: 5,
    },
    description: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 24,
      marginHorizontal: 10,
      textAlign: 'justify',
    },
    readMore: {
      color: colors.textPrimary,
      marginHorizontal: 10,
      textAlign: 'right',
      fontSize: 16,
    },
    servicesLabel: {
      fontSize: 18,
      color: colors.textPrimary,
      marginBottom: 8,
      marginHorizontal: 10,
    },
    service: {
      fontSize: 16,
      color: colors.textPrimary,
      marginBottom: 4,
      marginLeft: 10,
    },
    availabilityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 10,
      marginTop: 16,
      marginBottom: 8,
    },
    availability: {
      fontSize: 15,
      color: colors.textSecondary,
      marginBottom: 8,
      marginLeft:10,
    },
    availabilityLabel: {
      fontSize: 17,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    bookButtonContainer: {
      alignItems: 'center',
    },
    error: {
      color: colors.error,
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.modalOverlay,
    },
    modalContainer: {
      width: '70%',
      backgroundColor: colors.modalBackground,
      padding: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalView: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButton: {
      position: 'absolute',
      top: 0,
      left: 0,
      padding: 0,
      backgroundColor: colors.modalBackground,
      borderRadius: 50,
      borderWidth: 2,
      borderColor: colors.border,
      zIndex: 1,
    },
    successIconContainer: {
      marginTop: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    successIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      borderWidth: 3,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 20,
      color: colors.textPrimary,
      marginTop: 20,
    },
    modalSubTitle: {
      fontSize: 16,
      color: colors.success,
      marginTop: 5,
    },
  });
};