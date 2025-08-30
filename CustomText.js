// CustomText.js
import React, { useState, useEffect } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';

const CustomText = ({ style, children }) => {
  const [fontsLoaded] = useFonts({
    'Lexend-Bold': require('./assets/fonts/Lexend-SemiBold.ttf'),
  });

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      setIsReady(true);
    }
  }, [fontsLoaded]);

  return (
    <Text style={[{ fontFamily: 'Lexend-Bold' , color: '#000000', }, style]}>
      {children}
    </Text>
  );
};

export default CustomText;
