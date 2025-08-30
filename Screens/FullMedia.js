import React, { useContext } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Video, AVPlaybackStatus } from 'expo-av';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ThemeContext } from '../theme/ThemeContext'; 

const themes = {
  light: {
    background: '#fff',
    iconPrimary: '#000',
  },
  dark: {
    background: '#1A1A1A',
    iconPrimary: '#fff',
  },
};

export default function FullMedia() {
  const { theme } = useContext(ThemeContext);
  const route = useRoute();
  const navigation = useNavigation();
  const { mediaUrl, mediaType } = route.params;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themes[theme].background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    media: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
    video: {
      width: '100%',
      height: '100%',
    },
    backButton: {
      position: 'absolute',
      top: 50,
      left: 16,
      backgroundColor: themes[theme].background,
      borderRadius: 20,
      padding: 8,
      elevation: 5,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={themes[theme].background}
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
      />
      {mediaType === 'image' ? (
        <Image source={{ uri: mediaUrl }} style={styles.media} />
      ) : (
        <Video
          source={{ uri: mediaUrl }}
          style={styles.video}
          useNativeControls
          resizeMode="contain"
          isLooping
        />
      )}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={24} color={themes[theme].iconPrimary} />
      </TouchableOpacity>
    </View>
  );
}