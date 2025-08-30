import React, { useContext } from 'react';
import { View, StyleSheet, FlatList, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ServiceCard from '../../components/ServiceCard';
import FavoritesHeader from './FavoritesHeader';
import useFavoriteServices from '../../hooks/useFavoriteServices';
import useFavorites from '../../hooks/useFavorites';
import { toggleFavorite, handleCallNow } from '../../Services/serviceActions';
import CustomText from '../../CustomText';
import { ThemeContext } from '../../theme/ThemeContext';
import { useTranslation } from '../../context/TranslationContext'; 

const THEME_COLORS = {
  light: {
    background: '#fff',
    text: '#000',
    icon: '#000',
    buttonBackground: '#f0f0f0',
    secondaryText: '#888',
  },
  dark: {
    background: '#1A1A1A',
    text: '#fff',
    icon: '#fff',
    buttonBackground: '#333',
    secondaryText: '#aaa',
  },
};

function Favorites() {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 
  const { favorites, setFavorites } = useFavorites();
  const { servicemen, loading } = useFavoriteServices(favorites);
  const styles = getStyles(theme);

  const handleServicePress = (id) => {
    navigation.navigate('ViewService', { serviceId: id });
  };

  const handleChat = (serviceId) => {
    navigation.navigate('Chat', { otherUserId: serviceId });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderFooter = () => {
    if (loading) {
      return (
        <View style={styles.noFavoritesText}>
          <CustomText style={styles.noFavorites}>{t('loadingFavorites') || 'Loading favorites...'}</CustomText>
        </View>
      );
    }
    if (!loading && servicemen.length === 0) {
      return (
        <View style={styles.noFavoritesText}>
          <CustomText style={styles.noFavorites}>{t('noFavoritesFound') || 'No favorites found.'}</CustomText>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={THEME_COLORS[theme].background}
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
      />
      <FlatList
        data={servicemen}
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
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={<FavoritesHeader onBack={handleBack} t={t} />} 
        ListFooterComponent={renderFooter()}
        contentContainerStyle={styles.flatListContainer}
        showsVerticalScrollIndicator={false}
        accessibilityLabel={t('favoritesList') || 'Favorites list'} 
      />
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: THEME_COLORS[theme].background,
    },
    flatListContainer: {
      flexGrow: 1,
      padding: 10,
      paddingBottom: 150,
      marginTop: 40,
    },
    noFavoritesText: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 500, 
    },
    noFavorites: {
      textAlign: 'center',
      fontSize: 16,
      color: THEME_COLORS[theme].secondaryText,
    },
  });

export default Favorites;
