import React, { useContext } from 'react';
import { View, TouchableOpacity, StyleSheet, Linking, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import CustomText from '../../CustomText';
import { ThemeContext } from '../../theme/ThemeContext'; 
import { useTranslation } from '../../context/TranslationContext'; 

const ContactPage = () => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 

  const handleCall = () => {
    const phoneNumber = 'tel:+1234567890'; 
    Linking.openURL(phoneNumber).catch(err => console.error('Error opening dialer:', err));
  };

  const handleEmail = () => {
    const email = 'mailto:contact@example.com';
    Linking.openURL(email).catch(err => console.error('Error opening email app:', err));
  };

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={theme === 'light' ? '#ffffff' : '#1A1A1A'}
        translucent={true}
      />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('goBack') || 'Go back'} 
          accessibilityRole="button"
        >
          <Icon
            name="arrow-back-outline"
            size={24}
            color="#000"
          />
        </TouchableOpacity>
        <CustomText style={styles.title}>{t('contactTitle') || 'Contact'}</CustomText> 
        <View style={styles.placeholder} />
      </View>

      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <TouchableOpacity 
            style={styles.cardContent} 
            onPress={handleCall}
            accessibilityLabel={t('callUs') || 'Call Us'} 
            accessibilityRole="button"
          >
            <Icon
              name="call-outline"
              size={24}
              color={theme === 'light' ? '#000' : '#fff'}
            />
            <CustomText style={styles.cardText}>{t('callUs') || 'Call Us'}</CustomText> 
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <TouchableOpacity 
            style={styles.cardContent} 
            onPress={handleEmail}
            accessibilityLabel={t('emailUs') || 'Email Us'} 
            accessibilityRole="button"
          >
            <Icon
              name="mail-outline"
              size={24}
              color={theme === 'light' ? '#000' : '#fff'}
            />
            <CustomText style={styles.cardText}>{t('emailUs') || 'Email Us'}</CustomText> 
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'light' ? '#ffffff' : '#1A1A1A',
      marginTop: 30,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      backgroundColor: theme === 'light' ? '#ffffff' : '#1A1A1A',
    },
    backButton: {
      padding: 8,
      elevation: 5,
      borderRadius: 30,
      backgroundColor: '#fff',
    },
    title: {
      fontSize: 24,
      flex: 1,
      textAlign: 'center',
      color: theme === 'light' ? '#000' : '#fff',
    },
    placeholder: {
      width: 24,
    },
    cardContainer: {
      paddingHorizontal: 20,
      paddingVertical: 30,
    },
    card: {
      backgroundColor: theme === 'light' ? '#ffffff' : '#333333',
      borderRadius: 10,
      marginBottom: 20,
      elevation: 5,
    },
    cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
    },
    cardText: {
      color: theme === 'light' ? '#000' : '#fff',
      fontSize: 18,
      marginLeft: 10,
    },
  });

export default ContactPage;
