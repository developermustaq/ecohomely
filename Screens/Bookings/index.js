import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, StatusBar, ActivityIndicator, Linking, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { collection, doc, getDocs, getDoc, onSnapshot, query, where, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { format } from 'date-fns';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import CustomText from '../../CustomText';
import ReviewMessage from './ReviewMessage';
import BookingCard from './BookingCard';
import { toggleFavorite } from '../../Services/toggleFavorite';
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

const BookingsPage = () => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 
  const [uid, setUid] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [servicemen, setServicemen] = useState([]);
  const [noBookingsMessage, setNoBookingsMessage] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [lastVisible, setLastVisible] = useState(null);
  const [endReached, setEndReached] = useState(false);
  const [reviewListeners, setReviewListeners] = useState({});
  const itemsPerPage = 4;

  const navigation = useNavigation();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const setupReviewListener = (bookingId) => {
    const reviewRef = doc(db, 'reviews', bookingId);
    return onSnapshot(reviewRef, (doc) => {
      if (doc.exists()) {
        const reviewData = doc.data();
        setBookings((prevBookings) =>
          prevBookings.map((booking) => {
            if (booking.id === bookingId) {
              return {
                ...booking,
                hasReview: true,
                reviewRating: reviewData.rating || null,
              };
            }
            return booking;
          })
        );
      } else {
        setBookings((prevBookings) =>
          prevBookings.map((booking) => {
            if (booking.id === bookingId) {
              return {
                ...booking,
                hasReview: false,
                reviewRating: null,
              };
            }
            return booking;
          })
        );
      }
    });
  };

  const setupServicemanDataListener = (servicemanId, bookingId) => {
    const servicemanRef = doc(db, 'servicemen', servicemanId);
    return onSnapshot(servicemanRef, (doc) => {
      if (doc.exists()) {
        const servicemanData = doc.data();
        setBookings((prevBookings) =>
          prevBookings.map((booking) => {
            if (booking.id === bookingId) {
              return {
                ...booking,
                serviceman: {
                  ...booking.serviceman,
                  avgRating: servicemanData.avgRating || 0,
                  isOnline: servicemanData.isOnline || false,
                },
              };
            }
            return booking;
          })
        );
      }
    });
  };

  const setupRealtimeBookingsListener = async (storedUid) => {
    const bookingsRef = collection(db, 'users', storedUid, 'Bookings');
    const q = query(bookingsRef, orderBy('BookedOn', 'desc'), limit(1));
    return onSnapshot(q, async (snapshot) => {
      const changes = snapshot.docChanges();
      for (const change of changes) {
        if (change.type === 'added') {
          const bookingData = change.doc.data();
          const servicemanDocRef = doc(db, 'servicemen', bookingData.sid);
          const servicemanDoc = await getDoc(servicemanDocRef);
          const reviewDocRef = doc(db, 'reviews', change.doc.id);
          const reviewDoc = await getDoc(reviewDocRef);

          let hasReview = false;
          let reviewRating = null;
          if (reviewDoc.exists()) {
            hasReview = true;
            const reviewData = reviewDoc.data();
            reviewRating = reviewData.rating || null;
          }

          if (servicemanDoc.exists()) {
            const servicemanData = servicemanDoc.data();
            const avgRating = servicemanData.avgRating || 0;
            const newBooking = {
              id: change.doc.id,
              ...bookingData,
              hasReview,
              reviewRating,
              serviceman: {
                id: servicemanDoc.id,
                name: servicemanData.name,
                phone: servicemanData.phone,
                image: servicemanData.image,
                address: servicemanData.address,
                avgRating,
                isOnline: servicemanData.isOnline || false,
              },
            };

            const newListeners = {
              review: setupReviewListener(change.doc.id),
              serviceman: setupServicemanDataListener(bookingData.sid, change.doc.id),
            };

            setReviewListeners((prev) => ({
              ...prev,
              [change.doc.id]: newListeners,
            }));

            setBookings((prevBookings) => {
              const exists = prevBookings.some((booking) => booking.id === newBooking.id);
              if (!exists) {
                return [newBooking, ...prevBookings];
              }
              return prevBookings;
            });
          }
        }
      }
    });
  };

  const handleWriteReview = async (booking) => {
    try {
      await AsyncStorage.setItem('bookingId', booking.id);
      if (booking.hasReview) {
        navigation.navigate('EditReview', { booking });
      } else {
        navigation.navigate('WriteReview', { booking });
      }
    } catch (error) {
      console.error('Error storing bookingId or navigating:', error);
      Alert.alert(
        t('error') || 'Error',
        t('reviewNavigationError') || 'Failed to navigate to review page. Please try again.'
      );
    }
  };

  const fetchInitialBookings = async () => {
    try {
      const storedUid = await AsyncStorage.getItem('uid');
      if (!storedUid) return;

      setUid(storedUid);
      const bookingsRef = collection(db, 'users', storedUid, 'Bookings');
      const q = query(bookingsRef, orderBy('BookedOn', 'desc'), limit(itemsPerPage));
      const bookingsSnapshot = await getDocs(q);

      if (!bookingsSnapshot.empty) {
        const bookingList = [];
        const lastVisibleDoc = bookingsSnapshot.docs[bookingsSnapshot.docs.length - 1];
        setLastVisible(lastVisibleDoc);

        Object.values(reviewListeners).forEach((listener) => {
          if (listener.review) listener.review();
          if (listener.serviceman) listener.serviceman();
        });
        const newListeners = {};

        for (const bookingDoc of bookingsSnapshot.docs) {
          const bookingData = bookingDoc.data();
          const servicemanDocRef = doc(db, 'servicemen', bookingData.sid);
          const servicemanDoc = await getDoc(servicemanDocRef);
          const reviewDocRef = doc(db, 'reviews', bookingDoc.id);
          const reviewDoc = await getDoc(reviewDocRef);

          let hasReview = false;
          let reviewRating = null;
          if (reviewDoc.exists()) {
            hasReview = true;
            const reviewData = reviewDoc.data();
            reviewRating = reviewData.rating || null;
          }

          if (servicemanDoc.exists()) {
            const servicemanData = servicemanDoc.data();
            const avgRating = servicemanData.avgRating || 0;
            newListeners[bookingDoc.id] = {
              review: setupReviewListener(bookingDoc.id),
              serviceman: setupServicemanDataListener(bookingData.sid, bookingDoc.id),
            };
            bookingList.push({
              id: bookingDoc.id,
              ...bookingData,
              hasReview,
              reviewRating,
              serviceman: {
                id: servicemanDoc.id,
                name: servicemanData.name,
                phone: servicemanData.phone,
                image: servicemanData.image,
                address: servicemanData.address,
                avgRating,
                isOnline: servicemanData.isOnline || false,
              },
            });
          }
        }

        setReviewListeners(newListeners);
        setBookings(bookingList);
        setLoading(false);

        if (bookingsSnapshot.docs.length < itemsPerPage) {
          setEndReached(true);
        }
      } else {
        setBookings([]);
        setNoBookingsMessage(t('noBookingsYet') || 'No bookings yet');
        setLoading(false);
        setEndReached(true);
      }
    } catch (error) {
      console.error('Error fetching initial bookings:', error);
      setLoading(false);
      Alert.alert(
        t('error') || 'Error',
        t('fetchBookingsError') || 'Failed to load bookings. Please try again.'
      );
    }
  };

  const fetchMoreBookings = async () => {
    if (loadingMore || endReached) return;

    try {
      setLoadingMore(true);
      const storedUid = await AsyncStorage.getItem('uid');
      if (!storedUid || !lastVisible) {
        setLoadingMore(false);
        return;
      }

      const bookingsRef = collection(db, 'users', storedUid, 'Bookings');
      const q = query(bookingsRef, orderBy('BookedOn', 'desc'), startAfter(lastVisible), limit(itemsPerPage));
      const bookingsSnapshot = await getDocs(q);

      if (!bookingsSnapshot.empty) {
        const newBookingList = [];
        const lastVisibleDoc = bookingsSnapshot.docs[bookingsSnapshot.docs.length - 1];
        setLastVisible(lastVisibleDoc);

        const newListeners = { ...reviewListeners };

        for (const bookingDoc of bookingsSnapshot.docs) {
          const bookingData = bookingDoc.data();
          const servicemanDocRef = doc(db, 'servicemen', bookingData.sid);
          const servicemanDoc = await getDoc(servicemanDocRef);
          const reviewDocRef = doc(db, 'reviews', bookingDoc.id);
          const reviewDoc = await getDoc(reviewDocRef);

          let hasReview = false;
          let reviewRating = null;
          if (reviewDoc.exists()) {
            hasReview = true;
            const reviewData = reviewDoc.data();
            reviewRating = reviewData.rating || null;
          }

          if (servicemanDoc.exists()) {
            const servicemanData = servicemanDoc.data();
            const avgRating = servicemanData.avgRating || 0;
            newListeners[bookingDoc.id] = {
              review: setupReviewListener(bookingDoc.id),
              serviceman: setupServicemanDataListener(bookingData.sid, bookingDoc.id),
            };
            newBookingList.push({
              id: bookingDoc.id,
              ...bookingData,
              hasReview,
              reviewRating,
              serviceman: {
                id: servicemanDoc.id,
                name: servicemanData.name,
                phone: servicemanData.phone,
                image: servicemanData.image,
                address: servicemanData.address,
                avgRating,
                isOnline: servicemanData.isOnline || false,
              },
            });
          }
        }

        setReviewListeners(newListeners);
        setBookings((prevBookings) => {
          const existingIds = new Set(prevBookings.map((b) => b.id));
          const uniqueNewBookings = newBookingList.filter((b) => !existingIds.has(b.id));
          return [...prevBookings, ...uniqueNewBookings];
        });

        if (bookingsSnapshot.docs.length < itemsPerPage) {
          setEndReached(true);
        }
      } else {
        setEndReached(true);
      }

      setLoadingMore(false);
    } catch (error) {
      console.error('Error fetching more bookings:', error);
      setLoadingMore(false);
      Alert.alert(
        t('error') || 'Error',
        t('loadMoreBookingsError') || 'Failed to load more bookings. Please try again.'
      );
    }
  };

  const fetchFavoritesAndListen = async () => {
    try {
      const uid = await AsyncStorage.getItem('uid');
      if (!uid) return;

      const userDocRef = doc(db, 'users', uid);
      const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          const favoriteIds = userData.favorites || [];
          setFavorites(favoriteIds);

          if (favoriteIds.length > 0) {
            const servicemenQuery = query(collection(db, 'servicemen'), where('__name__', 'in', favoriteIds));
            const unsubscribeServicemen = onSnapshot(servicemenQuery, (snapshot) => {
              const servicemenList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                image: doc.data().image || '',
              }));
              setServicemen(servicemenList);
            });
            return () => unsubscribeServicemen();
          } else {
            setServicemen([]);
          }
        }
      });
      return () => unsubscribeUser();
    } catch (error) {
      console.error('Error setting up real-time listeners:', error);
    }
  };

  useEffect(() => {
    const setupListeners = async () => {
      const storedUid = await AsyncStorage.getItem('uid');
      if (!storedUid) return;

      setUid(storedUid);
      const realtimeUnsubscribe = await setupRealtimeBookingsListener(storedUid);
      await fetchInitialBookings();
      const favoritesUnsubscribe = await fetchFavoritesAndListen();

      return () => {
        if (realtimeUnsubscribe) realtimeUnsubscribe();
        if (favoritesUnsubscribe) favoritesUnsubscribe();
        Object.values(reviewListeners).forEach((listeners) => {
          if (listeners.review) listeners.review();
          if (listeners.serviceman) listeners.serviceman();
        });
      };
    };

    setupListeners();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const fetchReviewMessage = async () => {
        const message = await AsyncStorage.getItem('reviewMessage');
        if (message) {
          setReviewMessage(message);
        }
      };
      fetchReviewMessage();

      const timeoutId = setTimeout(async () => {
        await AsyncStorage.removeItem('reviewMessage');
        setReviewMessage('');
      }, 2000);

      return () => clearTimeout(timeoutId);
    }, [])
  );

  const formatDate = (timestamp) => {
    if (timestamp) {
      let date;
      if (typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else {
        date = new Date(timestamp);
      }
      return format(date, 'd/M/yyyy');
    }
    return t('notAvailable') || 'N/A';
  };

  const handleCall = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert(
        t('error') || 'Error',
        t('phoneNumberNotAvailable') || 'Phone number is not available.'
      );
      return;
    }

    const phoneUrl = `tel:${phoneNumber}`;
    Linking.openURL(phoneUrl).catch((err) => {
      console.error('Error opening phone app:', err);
      Alert.alert(
        t('error') || 'Error',
        t('unableToMakeCall') || 'Unable to make phone call. Please try again.'
      );
    });
  };

  const handleToggleFavorite = async (id) => {
    const success = await toggleFavorite(id, favorites, setServicemen);
    if (!success) {
      console.log('Failed to toggle favorite');
      Alert.alert(
        t('error') || 'Error',
        t('favoriteToggleError') || 'Failed to update favorite status. Please try again.'
      );
    }
  };

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 200;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      fetchMoreBookings();
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar
          backgroundColor={themes[theme].background}
          barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
          translucent={true}
        />
        <View style={styles.header}>
          <CustomText style={styles.headerText}>{t('bookings') || 'Bookings'}</CustomText>
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator 
            size="large" 
            color={themes[theme].textPrimary}
            accessibilityLabel={t('loading') || 'Loading'} 
          />
        </View>
      </View>
    );
  }

  if (!bookings.length) {
    return (
      <View style={styles.container}>
        <StatusBar
          backgroundColor={themes[theme].background}
          barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
          translucent={true}
        />
        <View style={styles.header}>
          <CustomText style={styles.headerText}>{t('bookings') || 'Bookings'}</CustomText>
        </View>
        <View style={styles.loaderContainer}>
          <CustomText style={styles.noBookingsText}>{noBookingsMessage}</CustomText>
        </View>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: themes[theme].background, height: '100%' }}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        onScroll={handleScroll}
        scrollEventThrottle={400}
        accessibilityLabel={t('bookingsListView') || 'Bookings list view'} 
      >
        <StatusBar
          backgroundColor={themes[theme].background}
          barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
          translucent={true}
        />
        <View style={styles.header}>
          <CustomText style={styles.headerText}>{t('bookings') || 'Bookings'}</CustomText>
        </View>

        {bookings.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            favorites={favorites}
            toggleFavorite={handleToggleFavorite}
            handleWriteReview={handleWriteReview}
            handleCall={handleCall}
            formatDate={formatDate}
            t={t} 
          />
        ))}

        {loadingMore && (
          <View style={styles.loadingMoreContainer}>
            <ActivityIndicator 
              size="large" 
              color={themes[theme].textPrimary}
              accessibilityLabel={t('loadingMoreBookings') || 'Loading more bookings'} 
            />
          </View>
        )}

        {!endReached && !loadingMore && (
          <TouchableOpacity 
            style={styles.loadMoreButton} 
            onPress={fetchMoreBookings}
            accessibilityLabel={t('loadMore') || 'Load More'} 
            accessibilityRole="button"
          >
            <Ionicons name="reload" size={32} color={themes[theme].iconPrimary} />
            <CustomText style={styles.loadMoreButtonText}>{t('loadMore') || 'Load More'}</CustomText>
          </TouchableOpacity>
        )}
      </ScrollView>

      <ReviewMessage message={reviewMessage} t={t} />
    </View>
  );
};
const getStyles = (theme) => {
  const colors = themes[theme] || themes.light;
  return StyleSheet.create({
    container: {
      flexGrow: 1,
      padding: 12,
      backgroundColor: colors.background,
      paddingBottom: 120,
      marginTop: 40,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
      paddingHorizontal: 10,
    },
    headerText: {
      fontSize: 24,
      color: colors.textPrimary,
      flex: 1,
      textAlign: 'center',
      marginBottom: -8,
    },
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    noBookingsText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textSecondary,
    },
    loadingMoreContainer: {
      padding: 5,
      alignItems: 'center',
    },
    loadMoreButton: {
      padding: 10,
      backgroundColor: colors.modalBackground,
      borderRadius: 5,
      alignItems: 'center',
      marginVertical: 10,
    },
    loadMoreButtonText: {
      color: colors.textPrimary,
      fontSize: 16,
    },
  });
};

export default BookingsPage;
