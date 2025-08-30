import React, { useState, useEffect, useContext } from 'react';
import { View, TextInput, StyleSheet, ActivityIndicator, TouchableOpacity, StatusBar, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../utils/firebase'; 
import CustomText from '../../CustomText';
import { ThemeContext } from '../../theme/ThemeContext'; 
import { useTranslation } from '../../context/TranslationContext'; 

const SearchScreen = () => {
  const { theme } = useContext(ThemeContext); 
  const { t } = useTranslation(); 
  const styles = getStyles(theme); 
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const capitalizeWords = (text) => {
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const fetchSuggestions = async (queryText) => {
    const capitalizedQuery = capitalizeWords(queryText);
    if (capitalizedQuery.length === 0) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const servicemenRef = collection(db, 'servicemen');
      const q = query(
        servicemenRef,
        where('profession', '>=', capitalizedQuery),
        where('profession', '<=', capitalizedQuery + '\uf8ff')
      );
      const querySnapshot = await getDocs(q);

      console.log('Fetched Documents:', querySnapshot.docs.map(doc => doc.data())); 

      const professions = querySnapshot.docs
        .map(doc => doc.data().profession)
        .filter(Boolean); 

      const uniqueSuggestions = [...new Set(professions)];
      setSuggestions(uniqueSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions from Firestore:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions(searchText);
  }, [searchText]);

  const handleSearch = (query) => {
    const capitalizedQuery = capitalizeWords(query);
    if (capitalizedQuery.trim().length === 0) return;
    navigation.navigate('Results', { query: capitalizedQuery });
  };

  const handleTextChange = (text) => {
    setSearchText(capitalizeWords(text));
  };

  const clearSearchText = () => {
    setSearchText('');
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={theme === 'light' ? '#fff' : '#1A1A1A'}
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        translucent={true}
      />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()} 
          activeOpacity={1}
          accessibilityLabel={t('goBack') || 'Go back'}  with translation
          accessibilityRole="button"
        >
          <View style={styles.backIconContainer}>
            <Icon name="arrow-back" size={24} color='#000'/>
          </View>
        </TouchableOpacity>
        <CustomText style={styles.title}>{t('search') || 'Search'}</CustomText>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchBarContainer}>
        <View style={styles.searchContainer}>
          <Image
            source={require('../../assets/InstaSearch.png')}
            style={[
              styles.InstaSearch,
              { tintColor: theme === 'light' ? '#888' : '#aaa' }, 
            ]}
          />
          <TextInput
            style={styles.searchBar}
            placeholder={t('search') || 'Search'}
            placeholderTextColor={theme === 'light' ? '#888' : '#aaa'}
            value={searchText}
            onChangeText={handleTextChange}
            onSubmitEditing={() => handleSearch(searchText)}
            autoFocus={true}
            accessibilityLabel={t('searchInput') || 'Search input'} 
            accessibilityRole="text"
          />
          {searchText.length > 0 ? (
            <TouchableOpacity 
              onPress={clearSearchText}
              accessibilityLabel={t('clearSearch') || 'Clear search'} 
              accessibilityRole="button"
            >
              <Icon
                name="clear"
                size={24}
                color={theme === 'light' ? '#888' : '#aaa'}
                style={styles.clearIconRight}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={() => handleSearch(searchText)}
              accessibilityLabel={t('startSearch') || 'Start search'} 
              accessibilityRole="button"
            >
              <Image
                source={require('../../assets/GoSearch.png')}
                style={[
                  styles.GoSearch,
                  { tintColor: theme === 'light' ? '#888' : '#aaa' },
                ]}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme === 'light' ? '#000' : '#e5e5e7'}
          accessibilityLabel={t('loading') || 'Loading'} 
        />
      ) : (
        <View>
          {searchText.length > 0 && suggestions.length > 0 ? (
            <>
              <CustomText style={styles.heading}>{t('suggestions') || 'Suggestions'}</CustomText>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity 
                  key={index} 
                  onPress={() => handleSearch(suggestion)}
                  accessibilityLabel={`${t('searchFor') || 'Search for'} ${suggestion}`} 
                  accessibilityRole="button"
                >
                  <View style={styles.suggestionItemContainer}>
                    <Icon
                      name="search"
                      size={20}
                      color={theme === 'light' ? '#888' : '#aaa'}
                      style={styles.searchIcon}
                    />
                    <CustomText style={styles.suggestionItem}>{suggestion}</CustomText>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          ) : searchText.length > 0 && suggestions.length === 0 ? (
            <CustomText style={styles.noResultsText}>
              {t('noResultsFound') || 'No results found'}
            </CustomText>
          ) : null}
        </View>
      )}
    </View>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A', 
      marginTop: 30,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      paddingHorizontal: 16,
      paddingTop: 25,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
    },
    GoSearch: {
      width: 28,
      height: 28,
    },
    InstaSearch: {
      width: 20,
      height: 20,
    },
    backButton: {
      marginRight: 10,
    },
    backIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#fff', 
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
    },
    title: {
      fontSize: 24,
      flex: 1,
      textAlign: 'center',
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
    placeholder: {
      width: 40,
    },
    searchBarContainer: {
      paddingHorizontal: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'light' ? '#F4F4F5' : '#2C2C2E', 
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    searchBar: {
      flex: 1,
      height: 40,
      paddingHorizontal: 8,
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
    clearIconRight: {
      padding: 5,
    },
    heading: {
      fontSize: 18,
      marginVertical: 20,
      marginLeft: 16,
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
    suggestionItemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    searchIcon: {
      marginRight: 8,
      marginLeft: 25,
    },
    suggestionItem: {
      fontSize: 16,
      paddingVertical: 5,
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
    noResultsText: {
      fontSize: 18,
      fontStyle: 'italic',
      color: theme === 'light' ? '#888' : '#aaa',
      textAlign: 'center',
      marginTop: 20,
    },
  });

export default SearchScreen;
