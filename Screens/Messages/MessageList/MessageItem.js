import React, { useContext } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Linking, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ThemeContext } from '../../../theme/ThemeContext'; 
import { useTranslation } from '../../../context/TranslationContext'; 

const MessageItem = React.memo(({ item, userUid, onGetLocation }) => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 
  const styles = getStyles(theme);
  const isUserMessage = item.sender === userUid;
  const isBookingMessage = item.type === 'booked';

  const parseText = (text) => {
    if (!text) return null;

    const patterns = {
      email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
      phone: /\b\d{10,}\b/,
      url: /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9.-]+\.[A-Z]{2,}(?:\/\S*)?\b/i,
    };

    const combinedPattern = new RegExp(
      `(${patterns.email.source}|${patterns.phone.source}|${patterns.url.source})`,
      'gi'
    );

    return text.split(combinedPattern).map((part, index) => {
      if (patterns.email.test(part)) {
        return (
          <Text 
            key={index} 
            style={styles.linkText} 
            onPress={() => {
              try {
                Linking.openURL(`mailto:${part}`);
              } catch (error) {
                Alert.alert(
                  t('error') || 'Error',
                  t('unableToOpenEmail') || 'Unable to open email application'
                );
              }
            }}
            accessibilityLabel={`${t('emailLink') || 'Email link'}: ${part}`} 
            accessibilityRole="link"
          >
            {part}
          </Text>
        );
      } else if (patterns.phone.test(part)) {
        return (
          <Text 
            key={index} 
            style={styles.linkText} 
            onPress={() => {
              try {
                Linking.openURL(`tel:${part}`);
              } catch (error) {
                Alert.alert(
                  t('error') || 'Error',
                  t('unableToMakeCall') || 'Unable to make phone call'
                );
              }
            }}
            accessibilityLabel={`${t('phoneLink') || 'Phone link'}: ${part}`} 
            accessibilityRole="link"
          >
            {part}
          </Text>
        );
      } else if (patterns.url.test(part)) {
        return (
          <Text 
            key={index} 
            style={styles.linkText} 
            onPress={() => {
              try {
                Linking.openURL(part.startsWith('http') ? part : `https://${part}`);
              } catch (error) {
                Alert.alert(
                  t('error') || 'Error',
                  t('unableToOpenUrl') || 'Unable to open web link'
                );
              }
            }}
            accessibilityLabel={`${t('webLink') || 'Web link'}: ${part}`} 
            accessibilityRole="link"
          >
            {part}
          </Text>
        );
      } else {
        return <Text key={index}>{part}</Text>;
      }
    });
  };

  const handleLocationPress = () => {
    if (onGetLocation && item.bookingId) {
      onGetLocation(item.bookingId);
    } else {
      Alert.alert(
        t('error') || 'Error',
        t('locationNotAvailable') || 'Location information is not available'
      );
    }
  };

  return (
    <View style={styles.messageContainerWrapper}>
      {isBookingMessage ? (
        <View style={styles.bookingMessage}>
          <Text style={styles.bookingText}>
            {t('successfullyBooked') || 'Successfully Booked.'}
          </Text>
          <TouchableOpacity 
            style={styles.locationButton} 
            onPress={handleLocationPress}
            accessibilityLabel={t('getLocation') || 'Get Location'} 
            accessibilityRole="button"
          >
            <Icon name="map" size={20} color="#fff" />
            <Text style={styles.locationButtonText}>
              {t('getLocation') || 'Get Location'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.messageContainer,
            isUserMessage ? styles.userMessage : styles.otherMessage,
          ]}
          accessibilityLabel={`${isUserMessage ? t('yourMessage') || 'Your message' : t('theirMessage') || 'Their message'}: ${item.text}`} 
          accessibilityRole="text"
        >
          <Text style={styles.messageText}>{parseText(item.text)}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

const getStyles = (theme) =>
  StyleSheet.create({
    messageContainerWrapper: {
      marginVertical: 2,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
    },
    messageContainer: {
      paddingVertical: 5,
      paddingHorizontal: 10,
      marginVertical: 3,
      borderRadius: 15,
      maxWidth: '80%',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    userMessage: {
      alignSelf: 'flex-end',
      backgroundColor: theme === 'light' ? '#f5f5f7' : '#555',
      borderBottomRightRadius: 0,
      elevation: 3,
      marginRight: 8,
    },
    otherMessage: {
      alignSelf: 'flex-start',
      backgroundColor: theme === 'light' ? '#e5e5e7' : '#3C3C3E',
      borderBottomLeftRadius: 0,
      elevation: 3,
      marginLeft: 8,
    },
    messageText: {
      fontSize: 15,
      fontWeight: '400',
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
    linkText: {
      color: theme === 'light' ? '#0066cc' : '#4da8ff',
      textDecorationLine: 'underline',
    },
    bookingMessage: {
      alignSelf: 'flex-end',
      backgroundColor: theme === 'light' ? '#E3F7F1' : '#E3F7F1',
      padding: 8,
      borderRadius: 12,
      borderBottomRightRadius: 0,
      maxWidth: '80%',
      marginRight: 8,
    },
    bookingText: {
      color: theme === 'light' ? '#00695C' : '#00695C',
      fontSize: 16,
      fontWeight: '400',
      marginBottom: 4,
    },
    locationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#00695C',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 18,
      alignSelf: 'flex-start',
      elevation: 3,
    },
    locationButtonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '400',
      marginLeft: 4,
    },
  });

export default MessageItem;
