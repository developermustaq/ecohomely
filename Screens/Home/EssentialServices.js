import React, { useContext } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import ServiceCard from '../../components/ServiceCard';
import LoadingPlaceholder from '../../components/LoadingPlaceholder';
import useServices from '../../hooks/useServices';
import useFavorites from '../../hooks/useFavorites';
import useCity from '../../hooks/useCity';
import { toggleFavorite, handleCallNow } from '../../Services/serviceActions';
import CustomText from '../../CustomText';
import { ThemeContext } from '../../theme/ThemeContext';
import { useTranslation } from '../../context/TranslationContext';

function EssentialServices({ t: translationProp }) {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const { t: contextT } = useTranslation();
  
  const t = translationProp || contextT;
  
  const { city, cityLoading } = useCity();
  const { services, loading } = useServices(city, cityLoading, 15);
  const { favorites, setFavorites } = useFavorites();
  const styles = getStyles(theme);

  const handleServicePress = (id) => {
    navigation.navigate('ViewService', { serviceId: id });
  };

  const handleChat = (serviceId) => {
    navigation.navigate('Chat', { otherUserId: serviceId });
  };

  const EssentialServicesHeader = ({ onViewAll }) => (
    <View style={styles.header}>
      <CustomText style={styles.title}>{t('essentialServices') || 'Essential Services'}</CustomText>
      <TouchableOpacity 
        style={styles.viewAllButton} 
        onPress={onViewAll}
        accessibilityLabel={t('viewAllServices') || 'View all services'}
        accessibilityRole="button"
      >
        <CustomText style={styles.viewAllText}>{t('viewAll') || 'View All'}</CustomText>
        <Icon
          name="chevron-forward-outline"
          size={18}
          color={theme === 'light' ? '#000' : '#e5e5e7'}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <EssentialServicesHeader onViewAll={() => navigation.navigate('Services')} />
      {loading || cityLoading ? (
        <LoadingPlaceholder />
      ) : services.length === 0 ? (
        <View style={styles.noServicesContainer}>
          <CustomText style={styles.noServicesText}>
            {t('noServicesFoundAtLocation') || 'No services found at this location'}
          </CustomText>
        </View>
      ) : (
        <View style={styles.servicesContainer}>
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              isFavorited={favorites.includes(service.id)}
              onToggleFavorite={() => toggleFavorite(service.id, favorites, setFavorites)}
              onCallNow={() => handleCallNow(service.phoneNumber, service.id)}
              onChat={() => handleChat(service.id)}
              onPress={() => handleServicePress(service.id)}
              t={t}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      marginTop: 10,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
    },
    servicesContainer: {
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
    },
    noServicesContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 50,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
    },
    noServicesText: {
      fontSize: 18,
      color: theme === 'light' ? '#555' : '#aaa',
      textAlign: 'center',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
      paddingHorizontal: 10,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 5,
      borderRadius: 5,
    },
    viewAllText: {
      fontSize: 16,
      color: theme === 'light' ? '#007AFF' : '#0a84ff',
      marginRight: 5,
    },
  });

export default EssentialServices;
