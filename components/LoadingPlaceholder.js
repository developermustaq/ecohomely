import React, { useContext } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import Header from './Header';
import { ThemeContext } from '../theme/ThemeContext'; 

function LoadingPlaceholder() {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <FlatList
        data={[1, 2, 3, 4]}
        renderItem={({ index }) => (
          <View key={index} style={[styles.card, styles.loadingCard]}>
            <View style={styles.loadingImage} />
            <View style={styles.info}>
              <View style={styles.headerInfo}>
                <View style={styles.loadingText} />
                <View style={styles.loadingHeart} />
              </View>
              <View style={styles.loadingSmallText} />
              <View style={styles.loadingSmallText} />
              <View style={styles.actions}>
                <View style={styles.loadingButton} />
                <View style={styles.loadingButton} />
              </View>
            </View>
          </View>
        )}
        keyExtractor={(_, index) => `loading-${index}`}
        ListHeaderComponent={<Header />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
    },
    loadingCard: {
      flexDirection: 'row',
      backgroundColor: theme === 'light' ? '#fff' : '#333333',
      borderRadius: 10,
      padding: 10,
      marginBottom: 15,
      elevation: 2,
      shadowColor: theme === 'light' ? '#000' : '#fff',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      alignItems: 'center',
      marginHorizontal: 8,
    },
    loadingImage: {
      width: 150,
      height: 170,
      borderRadius: 10,
      backgroundColor: theme === 'light' ? '#e0e0e0' : '#555',
    },
    loadingText: {
      width: '50%',
      height: 15,
      backgroundColor: theme === 'light' ? '#e0e0e0' : '#555',
      borderRadius: 5,
      marginTop: 8,
      marginLeft: 8,
      marginBottom: 8,
    },
    loadingSmallText: {
      width: '70%',
      height: 10,
      backgroundColor: theme === 'light' ? '#e0e0e0' : '#555',
      borderRadius: 5,
      marginTop: 6,
      marginLeft: 6,
    },
    loadingHeart: {
      width: 24,
      height: 24,
      backgroundColor: theme === 'light' ? '#e0e0e0' : '#555',
      borderRadius: 12,
    },
    loadingButton: {
      width: 160,
      height: 40,
      backgroundColor: theme === 'light' ? '#e0e0e0' : '#555',
      borderRadius: 20,
      marginLeft: 10,
      marginTop: 8,
    },
    info: {
      flex: 1,
    },
    headerInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    actions: {
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
  });

export default LoadingPlaceholder;