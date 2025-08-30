import React, { useState, useContext } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '../../../CustomText';
import { ThemeContext } from '../../../theme/ThemeContext'; 
import { useTranslation } from '../../../context/TranslationContext'; 

const SortModal = ({ visible, onClose, applySort }) => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 
  const styles = getStyles(theme);
  const [selectedSortOption, setSelectedSortOption] = useState('Nearby'); 

  const sortOptions = [
    { key: 'Nearby', label: t('nearby') || 'Nearby' },
    { key: 'Popular', label: t('popular') || 'Popular' },
    { key: 'Rating', label: t('rating') || 'Rating' }
  ];

  const handleApplySort = () => {
    applySort(selectedSortOption);
    onClose(); 
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      accessibilityViewIsModal={true} 
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.headerContainer}>
            <CustomText style={styles.modalTitle}>{t('sortBy') || 'Sort By'}</CustomText>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.closeButton}
              accessibilityLabel={t('close') || 'Close'} 
              accessibilityRole="button"
            >
              <Icon name="close" size={22} color={theme === 'light' ? '#000' : '#e5e5e7'} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.radioButtonContainer}>
            {sortOptions.map((option) => (
              <TouchableOpacity 
                key={option.key}
                onPress={() => setSelectedSortOption(option.key)} 
                style={styles.radioButton}
                accessibilityLabel={`${t('sortBy') || 'Sort by'} ${option.label}`} 
                accessibilityRole="radio"
                accessibilityState={{ checked: selectedSortOption === option.key }}  state
              >
                <CustomText style={styles.radioText}>{option.label}</CustomText>
                <Icon
                  name={selectedSortOption === option.key ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={theme === 'light' ? '#1AD5B3' : '#aaa'}
                />
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity 
            style={styles.applyButton} 
            onPress={handleApplySort}
            accessibilityLabel={t('applySorting') || 'Apply sorting'} 
            accessibilityRole="button"
          >
            <CustomText style={styles.applyButtonText}>{t('apply') || 'Apply'}</CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.7)',
    },
    modalContent: {
      width: 300,
      padding: 20,
      backgroundColor: theme === 'light' ? '#fff' : '#2C2C2E',
      borderRadius: 10,
      alignItems: 'center',
      shadowColor: theme === 'light' ? '#000' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 2,
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      marginBottom: 20,
    },
    closeButton: {
      position: 'absolute',
      top: 0,
      right: 0,
      padding: 5,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
    radioButtonContainer: {
      width: '100%',
      alignItems: 'center',
    },
    radioButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
      width: '80%',
    },
    radioText: {
      fontSize: 18,
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
    applyButton: {
      marginTop: 20,
      backgroundColor: theme === 'light' ? '#000' : '#fff',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 10,
      width: '80%',
      alignItems: 'center',
      elevation: 3,
    },
    applyButtonText: {
      color: theme === 'light' ? '#fff' : '#000',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

export default SortModal;
