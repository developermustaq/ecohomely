import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ThemeContext } from '../../theme/ThemeContext'; 
import { useTranslation } from '../../context/TranslationContext'; 

const ChatHeader = ({ onBackPress, title, imageUrl }) => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 
  const styles = getStyles(theme);

  return (
    <View style={styles.header}>
      <TouchableOpacity 
        onPress={onBackPress} 
        style={styles.backButton}
        accessibilityLabel={t('goBack') || 'Go back'}  with translation
        accessibilityRole="button"
      >
        <Icon name="arrow-back" size={26} color={theme === 'light' ? '#000' : '#e5e5e7'} />
      </TouchableOpacity>

      {imageUrl ? (
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.profileImage}
          accessibilityLabel={`${title}${t('profileImage') ? ` ${t('profileImage')}` : "'s profile image"}`}  with translation
        />
      ) : (
        <Icon
          name="account-circle"
          size={40}
          color={theme === 'light' ? '#888' : '#aaa'}
          style={styles.defaultIcon}
          accessibilityLabel={t('defaultProfileIcon') || 'Default profile icon'}  with translation
        />
      )}

      <Text 
        style={styles.headerTitle}
        numberOfLines={1} 
        ellipsizeMode="tail" 
      >
        {title || t('chat') || 'Chat'}
      </Text>
    </View>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingTop: 50,
      paddingBottom: 10,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
      borderBottomWidth: 1,
      borderColor: theme === 'light' ? '#eee' : '#555',
    },
    backButton: {
      marginRight: 10,
      padding: 5,
    },
    profileImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
      backgroundColor: theme === 'light' ? '#e5e5e7' : '#3C3C3E', 
    },
    defaultIcon: {
      marginRight: 10,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '500',
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
  });

export default ChatHeader;
