import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video } from 'expo-av';

const SplashScreen = () => {
  const navigation = useNavigation();
  const [videoFinished, setVideoFinished] = useState(false);

  useEffect(() => {
    const navigateAfterDelay = async () => {
      try {
        const uid = await AsyncStorage.getItem('uid');
        setTimeout(() => {
          navigation.replace(uid ? 'Home' : 'Welcome');
        }, 5000); 
      } catch (error) {
        console.error('Error fetching uid:', error);
      }
    };

    navigateAfterDelay();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <Video
        source={require('../assets/final.mp4')} 
        style={styles.video}
        resizeMode="cover"
        shouldPlay
        isLooping={false}
        onPlaybackStatusUpdate={(status) => {
          if (status.didJustFinish) {
            setVideoFinished(true);
          }
        }}
        onError={(error) => console.error('Video Error:', error)} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  video: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height+40,
    position: 'absolute',
  },
});

export default SplashScreen;
