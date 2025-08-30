import React, { useContext } from 'react';
import {
  View,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomText from '../CustomText';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ThemeContext } from '../theme/ThemeContext';
import { useTranslation } from '../context/TranslationContext'; 

const themes = {
  light: {
    background: '#fff',
    iconPrimary: '#000',
    textPrimary: '#000',
  },
  dark: {
    background: '#1A1A1A',
    iconPrimary: '#fff',
    textPrimary: '#e5e5e7',
  },
};

const ShowAllMedia = () => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 
  const route = useRoute();
  const navigation = useNavigation();
  const { media, profileImage, name } = route.params || {};

  const screenWidth = Dimensions.get('window').width;
  const padding = 32; 
  const thumbnailWidth = (screenWidth - padding - 8) / 2;
  const thumbnailHeight = 200; 

  const handleMediaPress = (item, index) => {
    console.log('Navigating to FullMedia with:', {
      mediaUrl: item.url,
      mediaType: item.type,
      profileImage,
      name,
      index,
    });
    try {
      navigation.navigate('FullMedia', {
        mediaUrl: item.url,
        mediaType: item.type,
        profileImage,
        name,
      });
    } catch (e) {
      console.error('Navigation error:', e);
    }
  };

  const styles = StyleSheet.create({
    scrollViewContent: {
      paddingBottom: 20,
      backgroundColor: themes[theme].background,
      paddingTop: 50,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      paddingHorizontal: 16,
      backgroundColor: themes[theme].background,
    },
    backButton: {
      marginRight: 10,
    },
    backIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: themes[theme].background,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
    },
    title: {
      fontSize: 24,
      color: themes[theme].textPrimary,
      flex: 1,
      textAlign: 'center',
    },
    placeholder: {
      width: 40,
    },
    mediaContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      backgroundColor: themes[theme].background,
    },
    mediaWrapper: {
      position: 'relative',
      width: thumbnailWidth,
      height: thumbnailHeight,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#000',
      borderRadius: 10,
      backgroundColor: '#000'
    },
    thumbnail: {
      width: thumbnailWidth,
      height: thumbnailHeight,
      borderRadius: 10,
    },
    playIcon: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -12 }, { translateY: -12 }],
      opacity: 0.8,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: themes[theme].background,
    },
    errorText: {
      color: themes[theme].textPrimary,
      fontSize: 16,
      textAlign: 'center', 
      paddingHorizontal: 20, 
    },
  });

  console.log('ShowAllMedia media:', media);

  if (!media || !Array.isArray(media)) {
    return (
      <View style={[styles.scrollViewContent, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar
          backgroundColor={themes[theme].background}
          barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        />
        <CustomText style={styles.errorText}>
          {t('noMediaAvailable') || 'No media available'}
        </CustomText>
        <TouchableOpacity
          style={[styles.backButton, { marginTop: 20 }]} 
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('goBack') || 'Go back'} 
          accessibilityRole="button"
        >
          <View style={styles.backIconContainer}>
            <Ionicons name="arrow-back" size={24} color={themes[theme].iconPrimary} />
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollViewContent}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={t('mediaGallery') || 'Media gallery'} 
    >
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
          activeOpacity={0}
        >
          <View style={styles.backIconContainer}>
            <Ionicons name="arrow-back" size={24} color={themes[theme].iconPrimary} />
          </View>
        </TouchableOpacity>
        <CustomText style={styles.title}>{t('media') || 'Media'}</CustomText>
        <View style={styles.placeholder} />
      </View>
      <View style={styles.mediaContainer}>
        {media.map((item, index) => (
          <View key={index} style={styles.mediaWrapper}>
            <TouchableOpacity
              onPress={() => handleMediaPress(item, index)}
              accessibilityLabel={`${t('viewMedia') || 'View media'} ${index + 1} ${item.type === 'video' ? t('video') || 'video' : t('image') || 'image'}`} // ✅ Enhanced accessibility
              accessibilityRole="button"
              accessibilityHint={t('tapToViewFullSize') || 'Tap to view full size'}  hint
            >
              <Image
                source={{ uri: item.url }}
                style={styles.thumbnail}
                resizeMode={item.type === 'image' ? 'cover' : 'contain'}
                defaultSource={{ uri: 'https://via.placeholder.com/150' }}
                accessibilityLabel={`${item.type === 'image' ? t('image') || 'Image' : t('video') || 'Video'} ${index + 1}`} 
              />
              {item.type === 'video' && (
                <Ionicons
                  name="play-circle"
                  size={32}
                  color='#fff'
                  style={styles.playIcon}
                  accessibilityLabel={t('playButton') || 'Play button'} 
                />
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default ShowAllMedia;
