import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDocs, query, collection, where } from 'firebase/firestore';
import { db, storage } from '../utils/firebase';
import CustomText from '../CustomText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { ThemeContext } from '../theme/ThemeContext'; 
import { useTranslation } from '../context/TranslationContext'; 

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

const WriteReviewPage = () => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 
  const route = useRoute();
  const { booking } = route.params;
  const navigation = useNavigation();

  const [review, setReview] = useState('');
  const [rating, setRating] = useState(0);
  const [media, setMedia] = useState([]); 
  const [loading, setLoading] = useState(false);

  const styles = useMemo(() => getStyles(theme), [theme]);

  useEffect(() => {
    console.log('Booking ID:', booking.bookingId);
    console.log('SID:', booking.sid);
    console.log('UID:', booking.uid);
  }, [booking]);

  const handleRatingPress = (index) => {
    setRating(index + 1);
  };

  const pickMedia = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert(
          t('permissionRequired') || 'Permission Required',
          t('mediaLibraryPermissionRequired') || 'Permission to access media library is required!'
        );
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, 
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled) {
        const selectedMedia = result.assets;

        const processedMedia = await Promise.all(
          selectedMedia.map(async (item) => {
            if (item.type === 'image') {
              const compressed = await ImageManipulator.manipulateAsync(
                item.uri,
                [{ resize: { width: 800 } }],
                { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
              );
              return { uri: compressed.uri, type: 'image' };
            }
            return { uri: item.uri, type: 'video' }; 
          })
        );

        setMedia([...media, ...processedMedia]);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert(
        t('error') || 'Error',
        t('mediaSelectionError') || 'Error selecting media. Please try again.'
      );
    }
  };

  const removeMedia = (index) => {
    const updatedMedia = [...media];
    updatedMedia.splice(index, 1);
    setMedia(updatedMedia);
  };

  const handlePostReview = async () => {
    if (!review || rating === 0) {
      Alert.alert(
        t('validationError') || 'Validation Error',
        t('provideReviewAndRating') || 'Please provide both a review and rating.'
      );
      return;
    }
    
    setLoading(true);
    try {
      if (media.length > 10) {
        Alert.alert(
          t('mediaLimitExceeded') || 'Media Limit Exceeded',
          t('maxTenMediaFiles') || 'You can only upload up to 10 media files.'
        );
        setLoading(false);
        return;
      }

      const uploadedMediaUrls = await Promise.all(
        media.map(async (item) => {
          const response = await fetch(item.uri);
          const blob = await response.blob();

          const fileExtension = item.type === 'image' ? 'jpg' : 'mp4'; 
          const storageRef = ref(storage, `reviews/${booking.bookingId}/${Date.now()}.${fileExtension}`);
          const snapshot = await uploadBytes(storageRef, blob);
          const downloadURL = await getDownloadURL(snapshot.ref);
          return { url: downloadURL, type: item.type };
        })
      );

      const reviewData = {
        bookingId: booking.bookingId,
        sid: booking.sid,
        uid: booking.uid,
        rating: rating,
        review: review,
        media: uploadedMediaUrls, 
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'reviews', booking.bookingId), reviewData);

      const reviewsSnapshot = await getDocs(
        query(collection(db, 'reviews'), where('sid', '==', booking.sid))
      );

      let totalRating = 0;
      let reviewCount = 0;
      let fiveStarCount = 0;
      let fourStarCount = 0;
      let threeStarCount = 0;
      let twoStarCount = 0;
      let oneStarCount = 0;
      let positiveReviewCount = 0;
      let negativeReviewCount = 0;

      reviewsSnapshot.forEach((doc) => {
        const reviewRating = doc.data().rating;
        totalRating += reviewRating;
        reviewCount++;

        if (reviewRating === 5) {
          fiveStarCount++;
          positiveReviewCount++;
        } else if (reviewRating === 4) {
          fourStarCount++;
          positiveReviewCount++;
        } else if (reviewRating === 3) {
          threeStarCount++;
          positiveReviewCount++;
        } else if (reviewRating === 2) {
          twoStarCount++;
          negativeReviewCount++;
        } else if (reviewRating === 1) {
          oneStarCount++;
          negativeReviewCount++;
        }
      });

      const avgRating = totalRating / reviewCount;

      await setDoc(
        doc(db, 'servicemen', booking.sid),
        {
          avgRating: parseFloat(avgRating.toFixed(1)),
          reviewCount: reviewCount,
          '5StarCount': fiveStarCount,
          '4StarCount': fourStarCount,
          '3StarCount': threeStarCount,
          '2StarCount': twoStarCount,
          '1StarCount': oneStarCount,
          positiveReviewCount: positiveReviewCount,
          negativeReviewCount: negativeReviewCount,
        },
        { merge: true }
      );

      await AsyncStorage.setItem('reviewMessage', t('reviewPostedSuccessfully') || 'Review Posted Successfully');
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error submitting review: ', error);
      Alert.alert(
        t('error') || 'Error',
        t('reviewSubmissionError') || 'There was an error submitting the review.'
      );
    } finally {
      setLoading(false);
    }
  };

  const serviceman = booking.serviceman || {};
  const bookedOn = booking.BookedOn
    ? format(booking.BookedOn.toDate(), 'd/M/yyyy')
    : t('unknownDate') || 'Unknown date';

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} overScrollMode="never">
      <StatusBar
        backgroundColor={themes[theme].background}
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        translucent={true}
      />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('goBack') || 'Go back'} 
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color='#000' />
        </TouchableOpacity>
        <CustomText style={styles.headerText}>{t('writeReview') || 'Write Review'}</CustomText>
      </View>
      <View style={styles.card}>
        <View style={styles.profileSection}>
          <Image 
            source={{ uri: serviceman.image }} 
            style={styles.profileImage}
            accessibilityLabel={`${serviceman.name || t('unknownServiceman') || 'Unknown Serviceman'} ${t('profileImage') || 'profile image'}`} 
          />
          <View style={styles.profileInfo}>
            <CustomText style={styles.name}>
              {serviceman.name || t('unknownServiceman') || 'Unknown Serviceman'}
            </CustomText>
            <CustomText style={styles.location}>
              <Ionicons name="location-outline" size={14} color={themes[theme].textSecondary} />{' '}
              {serviceman.address || t('unknownLocation') || 'Unknown Location'}
            </CustomText>
            <CustomText style={styles.bookingDate}>
              <Ionicons name="calendar-outline" size={15} color={themes[theme].textSecondary} /> 
              {t('bookedOn') || 'Booked on'} {bookedOn}
            </CustomText>
            <CustomText style={styles.ratingText}>{t('yourRating') || 'Your Rating'}:</CustomText>
            <View style={styles.rating}>
              <View style={styles.stars}>
                {Array(5)
                  .fill()
                  .map((_, index) => (
                    <TouchableOpacity 
                      key={index} 
                      onPress={() => handleRatingPress(index)}
                      accessibilityLabel={`${t('rateStar') || 'Rate'} ${index + 1} ${t('stars') || 'stars'}`} 
                      accessibilityRole="button"
                      accessibilityState={{ selected: index < rating }}  state
                    >
                      <FontAwesome
                        name="star"
                        size={24}
                        color={index < rating ? themes[theme].iconSecondary : themes[theme].textSecondary}
                        style={styles.star}
                      />
                    </TouchableOpacity>
                  ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.reviewSection}>
          <CustomText style={styles.reviewLabel}>{t('review') || 'Review'}:</CustomText>
          <TextInput
            style={styles.reviewInput}
            multiline
            numberOfLines={4}
            placeholder={t('writeYourReview') || 'Write your review...'}
            placeholderTextColor={themes[theme].textSecondary}
            value={review}
            onChangeText={(text) => setReview(text)}
            accessibilityLabel={t('reviewInput') || 'Review input'} 
            accessibilityRole="text"
          />
        </View>

        <View style={styles.mediaContainer}>
          {media.map((item, index) => (
            <View key={index} style={styles.mediaWrapper}>
              <Image
                source={{ uri: item.uri }}
                style={styles.media}
                resizeMode={item.type === 'image' ? 'cover' : 'contain'}
                accessibilityLabel={`${item.type === 'image' ? t('image') || 'Image' : t('video') || 'Video'} ${index + 1}`} 
              />
              {item.type === 'video' && (
                <Ionicons
                  name="play-circle"
                  size={24}
                  color={themes[theme].iconPrimary}
                  style={styles.playIcon}
                  accessibilityLabel={t('videoIndicator') || 'Video indicator'} 
                />
              )}
              <TouchableOpacity 
                style={styles.removeButton} 
                onPress={() => removeMedia(index)}
                accessibilityLabel={`${t('remove') || 'Remove'} ${item.type === 'image' ? t('image') || 'image' : t('video') || 'video'} ${index + 1}`} 
                accessibilityRole="button"
              >
                <Ionicons name="close-circle" size={24} color={themes[theme].iconPrimary} />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={media.length > 0 ? styles.addMediaButtonWithMedia : styles.addMediaButton}
            onPress={pickMedia}
            accessibilityLabel={t('addPhotosVideos') || 'Add Photos/Videos'} 
            accessibilityRole="button"
          >
            <Ionicons name="add-circle-outline" size={36} color={themes[theme].iconPrimary} />
            {media.length === 0 && (
              <CustomText style={styles.addMediaText}>
                {t('addPhotosVideos') || 'Add Photos/Videos'}
              </CustomText>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.postReviewButton, { opacity: loading ? 0.6 : 1 }]}
          onPress={handlePostReview}
          disabled={loading}
          accessibilityLabel={loading ? t('posting') || 'Posting review' : t('postReview') || 'Post review'} 
          accessibilityRole="button"
          accessibilityState={{ disabled: loading }}  state
        >
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator size="small" color={themes[theme].buttonText} style={{ marginRight: 8 }} />
              <CustomText style={styles.postReviewText}>
                {t('posting') || 'Posting...'}
              </CustomText>
            </View>
          ) : (
            <CustomText style={styles.postReviewText}>
              {t('postReview') || 'Post Review'}
            </CustomText>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const getStyles = (theme) => {
  const colors = themes[theme] || themes.light;
  return StyleSheet.create({
    container: {
      flexGrow: 1,
      padding: 10,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 40,
      paddingHorizontal: 10,
      marginTop: 50,
    },
    backButton: {
      position: 'absolute',
      left: 10,
      zIndex: 1,
      backgroundColor: '#fff',
      borderRadius: 20,
      padding: 8,
      elevation: 5,
    },
    headerText: {
      fontSize: 20,
      color: colors.textPrimary,
      flex: 1,
      textAlign: 'center',
    },
    card: {
      backgroundColor: colors.modalBackground,
      borderRadius: 10,
      padding: 8,
      elevation: 3,
      shadowColor: colors.textPrimary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    profileSection: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    profileImage: {
      width: 120,
      height: 140,
      borderRadius: 10,
      marginRight: 10,
    },
    profileInfo: {
      flex: 1,
    },
    name: {
      fontSize: 18,
      color: colors.textPrimary,
      marginBottom: 5,
    },
    location: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 5,
    },
    bookingDate: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 10,
    },
    rating: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ratingText: {
      fontSize: 16,
      color: colors.textPrimary,
      marginRight: 5,
    },
    stars: {
      flexDirection: 'row',
    },
    star: {
      margin: 5,
    },
    reviewSection: {
      marginBottom: 20,
    },
    reviewLabel: {
      fontSize: 16,
      color: colors.textPrimary,
      marginBottom: 5,
    },
    reviewInput: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 10,
      padding: 10,
      backgroundColor: colors.inputBackground,
      color: colors.textPrimary,
      textAlignVertical: 'top',
    },
    mediaContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginBottom: 20,
      backgroundColor: colors.photoButtonBackground,
      borderRadius: 10,
    },
    mediaWrapper: {
      position: 'relative',
      marginRight: 10,
      marginBottom: 10,
      paddingLeft: 15,
    },
    media: {
      width: 60,
      height: 60,
      borderRadius: 10,
    },
    playIcon: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -12 }, { translateY: -12 }],
      opacity: 0.8,
    },
    removeButton: {
      position: 'absolute',
      top: -10,
      right: -10,
    },
    addMediaButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 50,
      borderRadius: 10,
      backgroundColor: colors.photoButtonBackground,
    },
    addMediaButtonWithMedia: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      paddingVertical: 10,
      paddingHorizontal: 15,
      marginLeft: 10,
      borderWidth: 1,
      borderColor: colors.photoButtonBorder,
      borderStyle: 'dashed',
      borderRadius: 10,
      backgroundColor: colors.photoButtonBackground,
    },
    addMediaText: {
      fontSize: 16,
      color: colors.buttonTertiary,
      marginLeft: 10,
    },
    postReviewButton: {
      backgroundColor: colors.buttonTertiary,
      borderRadius: 50,
      paddingVertical: 15,
      alignItems: 'center',
    },
    postReviewText: {
      color: colors.buttonText,
      fontSize: 18,
    },
  });
};

export default WriteReviewPage;