import React, { useContext } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import CustomText from '../../CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../../theme/ThemeContext';
import { useTranslation } from '../../context/TranslationContext'; 

const THEME_COLORS = {
  light: {
    background: '#fff',
    text: '#000',
    icon: '#000',
    buttonBackground: '#f0f0f0',
  },
  dark: {
    background: '#1A1A1A',
    text: '#fff',
    icon: '#fff',
    buttonBackground: '#333',
  },
};

function FavoritesHeader({ onBack, t: translationProp }) { 
  const { theme } = useContext(ThemeContext);
  const { t: contextT } = useTranslation(); 
  const styles = getStyles(theme);

  const t = translationProp || contextT;

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        activeOpacity={0.7}
        accessibilityLabel={t('goBack') || 'Go back'} 
        accessibilityRole="button"
      >
        <View style={styles.backIconContainer}>
          <Icon
            name="arrow-back"
            size={24}
            color='#000'
          />
        </View>
      </TouchableOpacity>
      <CustomText style={styles.headerText}>{t('favorites') || 'Favorites'}</CustomText>
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: THEME_COLORS[theme].background,
    },
    headerText: {
      fontSize: 24,
      flex: 1,
      textAlign: 'center',
      color: THEME_COLORS[theme].text,
    },
    backIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 5,
    },
  });

export default FavoritesHeader;
