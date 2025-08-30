import React, { useContext } from 'react';
import { View, StyleSheet, StatusBar, FlatList, ActivityIndicator, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ServiceCard from '../components/ServiceCard';
import Header from '../components/Header';
import LoadingPlaceholder from '../components/LoadingPlaceholder';
import useServices from '../hooks/useServices';
import useFavorites from '../hooks/useFavorites';
import useCity from '../hooks/useCity';
import { toggleFavorite, handleCallNow } from '../Services/serviceActions';
import CustomText from '../CustomText';
import { ThemeContext } from '../theme/ThemeContext'; 
import { useTranslation } from '../context/TranslationContext'; 

function Services() {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 
  const { city, cityLoading } = useCity();
  const { services, displayedServices, page, hasMore, loading, loadMoreServices } = useServices(city, cityLoading);
  const { favorites, setFavorites } = useFavorites();
  const styles = getStyles(theme);

  const handleServicePress = (id) => {
    navigation.navigate('ViewService', { serviceId: id });
  };

  const handleChat = (serviceId) => {
    navigation.navigate('Chat', { otherUserId: serviceId });
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator 
          size="small" 
          color={theme === 'light' ? '#000' : '#fff'}
          accessibilityLabel={t('loadingMoreServices') || 'Loading more services'} 
        />
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.noServicesContainer}>
      <CustomText style={styles.noServicesText}>
        {t('noServicesFoundAtLocation') || 'No services found at this location'}
      </CustomText>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={theme === 'light' ? '#fff' : '#1A1A1A'}
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
      />
      {loading || cityLoading ? (
        <LoadingPlaceholder />
      ) : (
        <FlatList
          data={displayedServices}
          renderItem={({ item }) => (
            <ServiceCard
              service={item}
              isFavorited={favorites.includes(item.id)}
              onToggleFavorite={() => toggleFavorite(item.id, favorites, setFavorites)}
              onCallNow={() => handleCallNow(item.phoneNumber, item.id)}
              onChat={() => handleChat(item.id)}
              onPress={() => handleServicePress(item.id)}
              t={t} 
            />
          )}
          keyExtractor={(item) => item.id}
          onEndReached={loadMoreServices}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            <Header 
              onBack={() => navigation.goBack()} 
              t={t} 
            />
          }
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyComponent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContainer}
          accessibilityLabel={t('servicesListView') || 'Services list view'} 
        />
      )}
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
      paddingTop: 40,
    },
    flatListContainer: {
      flexGrow: 1,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
    },
    noServicesContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 50,
    },
    noServicesText: {
      fontSize: 18,
      color: theme === 'light' ? '#555' : '#aaa',
      textAlign: 'center', 
      paddingHorizontal: 20, 
    },
    footerLoader: {
      marginVertical: 20,
      alignItems: 'center',
    },
  });

export default Services;
