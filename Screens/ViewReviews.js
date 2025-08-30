import React, { useEffect, useState, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { db } from '../utils/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import CustomText from '../CustomText';
import { ThemeContext } from '../theme/ThemeContext'; 
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
    progressBarBackground: '#eee',
    progressBarFill: '#0474ED',
    filterButtonBackground: '#E9EAEB',
    filterButtonSelected: '#000',
  },
  dark: {
    background: '#1A1A1A',
    textPrimary: '#fff',
    textSecondary: '#aaa',
    buttonPrimary: '#06D6A0',
    buttonSecondary: '#FF9770',
    buttonTertiary: '#333',
    buttonText: '#000',
    iconPrimary: '#fff',
    iconSecondary: '#FFD700',
    border: '#fff',
    modalBackground: '#333',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    error: '#ff6666',
    success: '#00C497',
    progressBarBackground: '#444',
    progressBarFill: '#0474ED',
    filterButtonBackground: '#333',
    filterButtonSelected: '#fff',
  },
};

const ReviewScreen = ({ route, navigation }) => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 
  const { serviceId } = route.params;
  const [servicemanData, setServicemanData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState(null);

  const filterButtons = useMemo(() => [
    { label: t('all') || 'All', value: null },
    { label: t('positive') || 'Positive', value: 'positive' },
    { label: t('negative') || 'Negative', value: 'negative' },
    { label: `5 ★`, value: 5 },
    { label: `4 ★`, value: 4 },
    { label: `3 ★`, value: 3 },
    { label: `2 ★`, value: 2 },
    { label: `1 ★`, value: 1 },
  ], [t]);

  const styles = useMemo(() => getStyles(theme), [theme]);

  useEffect(() => {
    const fetchServicemanData = async () => {
      if (!serviceId) {
        console.error('serviceId is undefined');
        return;
      }

      try {
        const docRef = doc(db, 'servicemen', serviceId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setServicemanData(docSnap.data());
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching serviceman data: ', error);
      }
    };

    const fetchReviews = async () => {
      if (!serviceId) return;

      try {
        const reviewsRef = collection(db, 'reviews');
        const q = query(reviewsRef, where('sid', '==', serviceId));
        const querySnapshot = await getDocs(q);
        const fetchedReviews = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const reviewsWithUserData = await Promise.all(
          fetchedReviews.map(async (review) => {
            const user = await fetchUserData(review.uid);
            return { ...review, user };
          })
        );

        setReviews(reviewsWithUserData);
      } catch (error) {
        console.error('Error fetching reviews: ', error);
      }
    };

    fetchServicemanData();
    fetchReviews();
  }, [serviceId]);

  const fetchUserData = async (uid) => {
    if (!uid) return null;

    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return userSnap.data();
      } else {
        console.log('No such user!');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user data: ', error);
      return null;
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FontAwesome
        key={index}
        name="star"
        size={16}
        color={index < rating ? themes[theme].iconSecondary : themes[theme].textSecondary}
        style={styles.star}
      />
    ));
  };

  const renderReview = ({ item }) => (
    <View style={styles.reviewContainer}>
      <View style={styles.userContainer}>
        <Image
          source={{
            uri: item.user?.image
              ? `data:image/jpeg;base64,${item.user.image}`
              : 'https://th.bing.com/th/id/OIP.Cl56H6WgxJ8npVqyhefTdQAAAA?rs=1&pid=ImgDetMain',
          }}
          style={styles.userImage}
          accessibilityLabel={`${item.user?.name || t('anonymous') || 'Anonymous'} ${t('profileImage') || 'profile image'}`} 
        />
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <CustomText style={styles.userName}>
              {item.user?.name ? item.user.name.split(' ')[0] : t('anonymous') || 'Anonymous'}
            </CustomText>
            <View 
              style={styles.ratingContainer}
              accessibilityLabel={`${t('rating') || 'Rating'}: ${item.rating} ${t('outOfFiveStars') || 'out of 5 stars'}`} 
            >
              {renderStars(item.rating)}
            </View>
          </View>
          <CustomText style={styles.date}>
            {item.createdAt?.toDate().toLocaleDateString() || t('dateNotAvailable') || 'Date not available'}
          </CustomText>
        </View>
      </View>

      <CustomText style={styles.comment}>
        {item.review || t('noReviewText') || 'No review text available'}
      </CustomText>
      <View style={styles.mediaContainer}>
        {(item.media || []).map((mediaItem, index) => (
          <TouchableOpacity
            key={index}
            onPress={() =>
              navigation.navigate('FullMedia', {
                mediaUrl: mediaItem.url,
                mediaType: mediaItem.type,
                profileImage: item.user?.image,
                review: item.review,
                rating: item.rating,
                date: item.createdAt?.toDate().toLocaleDateString(),
                name: item.user?.name || t('anonymous') || 'Anonymous',
              })
            }
            accessibilityLabel={`${t('viewMedia') || 'View media'} ${index + 1}: ${mediaItem.type === 'image' ? t('image') || 'image' : t('video') || 'video'}`} 
            accessibilityRole="button"
          >
            <View style={styles.mediaWrapper}>
              <Image
                source={{ uri: mediaItem.url }}
                style={styles.reviewMedia}
                resizeMode={mediaItem.type === 'image' ? 'cover' : 'contain'}
                accessibilityLabel={`${mediaItem.type === 'image' ? t('reviewImage') || 'Review image' : t('reviewVideo') || 'Review video'} ${index + 1}`} 
              />
              {mediaItem.type === 'video' && (
                <Ionicons
                  name="play-circle"
                  size={24}
                  color={themes[theme].iconPrimary}
                  style={styles.playIcon}
                  accessibilityLabel={t('playButton') || 'Play button'} 
                />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const applyFilter = () => {
    if (selectedFilter === null) {
      return reviews;
    } else if (selectedFilter === 'positive') {
      return reviews.filter((review) => review.rating >= 4);
    } else if (selectedFilter === 'negative') {
      return reviews.filter((review) => review.rating <= 3);
    } else {
      return reviews.filter((review) => review.rating === selectedFilter);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={themes[theme].background}
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
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
            <Ionicons name="arrow-back" size={24} color='#000' />
          </View>
        </TouchableOpacity>
        <CustomText style={styles.title}>{t('reviews') || 'Reviews'}</CustomText>
        <View style={styles.placeholder} />
      </View>

      {servicemanData && (
        <>
          <View style={styles.leftColumn}>
            <CustomText style={styles.profileName}>
              {servicemanData.name || t('unknownServiceProvider') || 'Unknown Service Provider'}
            </CustomText>
          </View>

          <View style={styles.ratingSection}>
            <View style={styles.ratingInfo}>
              <CustomText 
                style={styles.ratingValue}
                accessibilityLabel={`${t('averageRating') || 'Average rating'}: ${servicemanData.avgRating || 0} ${t('outOfFive') || 'out of 5'}`} 
              >
                {servicemanData.avgRating || 0}
              </CustomText>
              <CustomText 
                style={styles.totalReviews}
                accessibilityLabel={`${servicemanData.reviewCount || 0} ${t('totalReviews') || 'total reviews'}`} 
              >
                ({servicemanData.reviewCount || 0} {t('reviewsText') || 'Reviews'})
              </CustomText>
            </View>
            <View style={styles.progressBars}>
              {[5, 4, 3, 2, 1].map((star) => {
                const starCount = servicemanData[`${star}StarCount`] || 0;
                const reviewCount = servicemanData.reviewCount || 0;
                const percentage = reviewCount ? (starCount / reviewCount) * 100 : 0;

                return (
                  <View 
                    key={star} 
                    style={styles.progressBarContainer}
                    accessibilityLabel={`${star} ${t('star') || 'star'}: ${starCount} ${t('reviews') || 'reviews'}, ${Math.round(percentage)}${t('percent') || 'percent'}`} 
                  >
                    <CustomText style={styles.progressText}>{star}</CustomText>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${percentage}%`, backgroundColor: themes[theme].progressBarFill },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </>
      )}

      <View style={styles.filterScrollContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          accessibilityLabel={t('reviewFilters') || 'Review filters'} 
        >
          {filterButtons.map((button, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.filterButton,
                selectedFilter === button.value && {
                  backgroundColor: themes[theme].filterButtonSelected,
                },
              ]}
              onPress={() => setSelectedFilter(button.value)}
              accessibilityLabel={`${t('filterBy') || 'Filter by'} ${button.label}`} 
              accessibilityRole="button"
              accessibilityState={{ selected: selectedFilter === button.value }}  state
            >
              <CustomText
                style={[
                  styles.filterText,
                  selectedFilter === button.value && { color: themes[theme].buttonText },
                ]}
              >
                {button.label}
              </CustomText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        data={applyFilter()}
        keyExtractor={(item) => item.id}
        renderItem={renderReview}
        style={styles.reviewList}
        accessibilityLabel={t('reviewsList') || 'Reviews list'} 
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CustomText style={styles.emptyText}>
              {t('noReviewsFound') || 'No reviews found'}
            </CustomText>
          </View>
        } 
      />
    </View>
  );
};

const getStyles = (theme) => {
  const colors = themes[theme] || themes.light;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 10,
      marginTop: 40,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      paddingHorizontal: 10,
      backgroundColor: colors.background,
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
      elevation: 5,
    },
    title: {
      fontSize: 24,
      color: colors.textPrimary,
      flex: 1,
      textAlign: 'center',
    },
    placeholder: {
      width: 40,
    },
    leftColumn: {
      alignItems: 'center',
    },
    profileName: {
      fontSize: 24,
      color: colors.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
    },
    ratingSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 20,
    },
    ratingInfo: {
      alignItems: 'center',
    },
    ratingValue: {
      fontSize: 40,
      color: colors.textPrimary,
    },
    totalReviews: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    progressBars: {
      flex: 1,
      marginLeft: 20,
    },
    progressBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 2,
    },
    progressText: {
      width: 20,
      color: colors.textPrimary,
      textAlign: 'right',
    },
    progressBar: {
      flex: 1,
      height: 10,
      backgroundColor: colors.progressBarBackground,
      borderRadius: 5,
      marginLeft: 5,
    },
    progressFill: {
      height: '100%',
      borderRadius: 5,
    },
    reviewContainer: {
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 10,
    },
    userContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    userImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      color: colors.textPrimary,
    },
    date: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    comment: {
      fontSize: 14,
      color: colors.textPrimary,
      marginVertical: 4,
    },
    mediaContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
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
    filterScrollContainer: {
      height: 40,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 5,
      marginVertical: 10,
    },
    filterButton: {
      height: 30,
      paddingHorizontal: 10,
      justifyContent: 'center',
      borderRadius: 8,
      backgroundColor: colors.filterButtonBackground,
      marginHorizontal: 5,
    },
    filterText: {
      color: colors.textPrimary,
    },
    star: {
      margin: 1,
    },
    ratingContainer: {
      flexDirection: 'row',
      marginVertical: 4,
    },
    userNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
    },
    reviewList: {
      marginBottom: 10,
    },
    emptyContainer: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 50,
  backgroundColor: colors.background,   
},
emptyText: {
  fontSize: 16,
  color: colors.textSecondary,          
  textAlign: 'center',
},
  });
};

export default ReviewScreen;