import React, { useState, useEffect, useContext } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomText from '../../../CustomText';
import { ThemeContext } from '../../../theme/ThemeContext'; 
import { useTranslation } from '../../../context/TranslationContext'; 

const FilterModal = ({ visible, onClose, applyFilter }) => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 
  const styles = getStyles(theme);
  const [isAvailableNow, setIsAvailableNow] = useState(false);
  const [tempIsAvailableNow, setTempIsAvailableNow] = useState(false);

  useEffect(() => {
    const getFilterData = async () => {
      try {
        const availableNowValue = await AsyncStorage.getItem('isAvailableNow');
        const storedValue = availableNowValue !== null ? JSON.parse(availableNowValue) : false;
        setIsAvailableNow(storedValue);
        setTempIsAvailableNow(storedValue); 
        await AsyncStorage.removeItem('showVerifiedOnly');
      } catch (e) {
        console.log('Failed to load filter data from storage');
      }
    };
    if (visible) {
      getFilterData(); 
    }
  }, [visible]);

  const handleToggleAvailableNow = (value) => {
    setTempIsAvailableNow(value);
  };

  const handleApplyFilter = () => {
    const filterData = {
      isAvailableNow: tempIsAvailableNow,
    };
    setIsAvailableNow(tempIsAvailableNow);
    AsyncStorage.setItem('isAvailableNow', JSON.stringify(tempIsAvailableNow)).catch((e) =>
      console.log('Failed to save filter data to storage')
    );
    applyFilter(filterData);
    onClose();
  };

  const handleClose = () => {
    setTempIsAvailableNow(isAvailableNow); 
    onClose();
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
      accessibilityViewIsModal={true} 
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.headerContainer}>
            <CustomText style={styles.modalTitle}>{t('filter') || 'Filter'}</CustomText>
            <TouchableOpacity 
              onPress={handleClose} 
              style={styles.closeButton}
              accessibilityLabel={t('close') || 'Close'} 
              accessibilityRole="button"
            >
              <Icon name="close" size={22} color={theme === 'light' ? '#000' : '#e5e5e7'} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterOptionContainer}>
            <CustomText style={styles.filterText}>
              {t('availableNow') || 'Available Now'}
            </CustomText>
            <Switch
              value={tempIsAvailableNow}
              onValueChange={handleToggleAvailableNow}
              trackColor={{ false: theme === 'light' ? '#767577' : '#555', true: '#1AD5B3' }}
              thumbColor={theme === 'light' ? '#f4f3f4' : '#aaa'}
              accessibilityLabel={`${t('availableNow') || 'Available Now'} ${tempIsAvailableNow ? t('enabled') || 'enabled' : t('disabled') || 'disabled'}`} 
              accessibilityRole="switch"
              accessibilityState={{ checked: tempIsAvailableNow }}  state
            />
          </View>
          
          <TouchableOpacity 
            style={styles.applyButton} 
            onPress={handleApplyFilter}
            accessibilityLabel={t('applyFilters') || 'Apply filters'} 
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
    filterOptionContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      marginBottom: 15,
    },
    filterText: {
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

export default FilterModal;
