import React, { useContext } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '../CustomText';
import { ThemeContext } from '../theme/ThemeContext'; 

function Header({ onBack }) {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={1}>
        <View style={styles.backIconContainer}>
          <Icon
            name="arrow-back"
            size={24}
            color={theme === 'light' ? '#000' : '#000'}
          />
        </View>
      </TouchableOpacity>
      <CustomText style={styles.title}>Services</CustomText>
      <View style={styles.placeholder} />
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 40,
      marginBottom: 10,
      paddingHorizontal: 16,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
    },
    backButton: {
      margin: 10,
    },
    backIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor:'#fff',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
    },
    title: {
      fontSize: 24,
      flex: 1,
      textAlign: 'center',
      color: theme === 'light' ? '#000' : '#fff',
      marginLeft:40,
    },
    placeholder: {
      width: 40,
    },
  });

export default Header;