import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Image, ImageBackground, TouchableOpacity, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome'; 
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from '../context/TranslationContext'; 
import { ThemeContext } from '../theme/ThemeContext'; 

const ReviewCard = ({ route }) => {
  const { photo, profileImage, review, rating, date, name } = route.params;
  const navigation = useNavigation();
  const { t } = useTranslation(); 
  const { theme } = useContext(ThemeContext) || { theme: 'dark' }; 
  const [showFullReview, setShowFullReview] = useState(false);

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FontAwesome
        key={index}
        name={'star'} 
        style={styles.star}
        color={index < rating ? "#FFC107" : "#B0B0B0"}
      />
    ));
  };

  const defaultProfileImage = 'https://via.placeholder.com/50'; 

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content"
        backgroundColor="#000" 
        translucent={true}
      />
      <ImageBackground
        source={{ uri: photo }}
        style={styles.backgroundImage}
        imageStyle={styles.imageStyle}
        accessibilityLabel={t('reviewPhoto') || 'Review photo'} 
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backIcon} 
              onPress={() => navigation.goBack()}
              accessibilityLabel={t('goBack') || 'Go back'} 
              accessibilityRole="button"
            >
              <Icon name="arrow-back" size={30} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.reviewHeader}>
              <Image
                source={{
                  uri: profileImage && profileImage.startsWith('data:image/')
                    ? profileImage
                    : `data:image/jpeg;base64,${profileImage}` || defaultProfileImage, 
                }}
                style={styles.profileImage}
                accessibilityLabel={`${name || t('reviewer') || 'Reviewer'} ${t('profileImage') || 'profile image'}`} 
              />
              <View style={styles.profileInfo}>
                <Text style={styles.name}>{name || t('anonymousReviewer') || 'Anonymous Reviewer'}</Text>
                <Text style={styles.date}>{date || t('unknownDate') || 'Unknown date'}</Text>
              </View>
              <View 
                style={styles.ratingContainer}
                accessibilityLabel={`${t('rating') || 'Rating'}: ${rating || 0} ${t('outOfFiveStars') || 'out of 5 stars'}`} 
                accessibilityRole="text"
              >
                {renderStars(rating)}
              </View>
            </View>

            <Text
              style={styles.reviewText}
              numberOfLines={showFullReview ? 0 : 2} 
              key={showFullReview ? 'full' : 'short'} 
              accessibilityLabel={`${t('reviewText') || 'Review text'}: ${review}`} 
            >
              {review || t('noReviewText') || 'No review text available'}
            </Text>

            {(review && review.length > 100) && (
              <TouchableOpacity 
                onPress={() => setShowFullReview(!showFullReview)}
                accessibilityLabel={
                  showFullReview 
                    ? t('showLessReview') || 'Show less review' 
                    : t('showMoreReview') || 'Show more review'
                } 
                accessibilityRole="button"
              >
                <Text style={styles.readMore}>
                  {showFullReview 
                    ? t('showLess') || 'Show Less' 
                    : t('readMore') || 'Read More'
                  }
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    height: '100%',
  },
  imageStyle: {
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    justifyContent: 'flex-end',
  },
  header: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#000',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  backIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 1)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFD700',
    marginRight: 10,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 18,
  },
  date: {
    color: '#ddd',
    fontSize: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 16,
    marginRight: 5,
  },
  reviewText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 10,
  },
  readMore: {
    color: '#FFD700',
    fontSize: 16,
    textAlign: 'right',
  },
});

export default ReviewCard;
