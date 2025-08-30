import React, { useContext } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../../theme/ThemeContext'; 
import { useTranslation } from '../../context/TranslationContext'; 
import CustomText from '../../CustomText';

const CustomModal = ({ visible, message, onClose }) => {
  const { theme } = useContext(ThemeContext); 
  const { t } = useTranslation(); 

  const themeStyles = {
    light: {
      modalContainerBg: 'rgba(0, 0, 0, 0.5)', 
      modalContentBg: '#fff', 
      modalTextColor: '#333', 
      modalButtonBg: '#000000', 
      modalButtonTextColor: '#fff', 
    },
    dark: {
      modalContainerBg: 'rgba(255, 255, 255, 0.2)', 
      modalContentBg: '#1c1c1e', 
      modalTextColor: '#e5e5e7', 
      modalButtonBg: '#007aff', 
      modalButtonTextColor: '#fff', 
    },
  };

  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: themeStyles[theme].modalContainerBg,
    },
    modalContent: {
      width: '80%',
      backgroundColor: themeStyles[theme].modalContentBg,
      borderRadius: 10,
      padding: 20,
      alignItems: 'center',
    },
    modalText: {
      fontSize: 18,
      marginBottom: 20,
      textAlign: 'center',
      color: themeStyles[theme].modalTextColor,
    },
    modalButton: {
      backgroundColor: themeStyles[theme].modalButtonBg,
      borderRadius: 25,
      paddingVertical: 10,
      paddingHorizontal: 30,
    },
    modalButtonText: {
      color: themeStyles[theme].modalButtonTextColor,
      fontSize: 16,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal={true} 
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <CustomText style={styles.modalText}>{message}</CustomText>
          <TouchableOpacity 
            style={styles.modalButton} 
            onPress={onClose}
            accessibilityLabel={t('ok') || 'OK'} 
            accessibilityRole="button"
          >
            <CustomText style={styles.modalButtonText}>{t('ok') || 'OK'}</CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CustomModal;
