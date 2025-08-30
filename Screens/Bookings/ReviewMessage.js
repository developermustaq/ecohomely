import React, { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import CustomText from '../../CustomText';
import { useTranslation } from '../../context/TranslationContext'; 
import { ThemeContext } from '../../theme/ThemeContext';

const ReviewMessage = ({ message, t: translationProp }) => { 
  const { t: contextT } = useTranslation(); 
  const { theme } = useContext(ThemeContext) || { theme: 'light' }; 
  
  const t = translationProp || contextT;

  if (!message) return null;
  
  return (
    <View 
      style={styles.reviewMessageContainer}
      accessibilityLabel={`${t('successMessage') || 'Success message'}: ${message}`} 
      accessibilityRole="alert"  role for announcements
    >
      <FontAwesome 
        name="check" 
        size={12} 
        color="#fff" 
        style={styles.checkIcon}
        accessibilityLabel={t('successIcon') || 'Success icon'} 
      />
      <CustomText style={styles.reviewMessageText}>{message}</CustomText>
    </View>
  );
};

const styles = StyleSheet.create({
    reviewMessageContainer: {
        flexDirection: 'row',    
        position: 'absolute',
        bottom: 90,
        left: 20,
        right: 20,
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#E7F8E9',
        zIndex: 1, 
      },
      checkIcon: {
        backgroundColor:"green",
        padding:3,
        borderRadius:10,
        margin: 5,               
      },
      reviewMessageText: {
        fontSize: 16,
        color: '#2D6A4F',
        textAlign: 'center', 
        margin:1,
      },
});

export default ReviewMessage;