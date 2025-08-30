import React, { useState, useEffect, useRef, useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, StatusBar, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/Ionicons';
import Voice from '@react-native-voice/voice';
import { useNavigation } from '@react-navigation/native';
import CustomText from '../../CustomText'; 
import { ThemeContext } from '../../theme/ThemeContext'; 
import { useTranslation } from '../../context/TranslationContext'; 

export default function SpeechScreen() {
  const { theme } = useContext(ThemeContext); 
  const { t } = useTranslation(); 
  const styles = getStyles(theme); 
  const navigation = useNavigation();
  const [started, setStarted] = useState(false);
  const [results, setResults] = useState([]);
  const timeoutRef = useRef(null); 

  const ring1Anim = useRef(new Animated.Value(0)).current;
  const ring2Anim = useRef(new Animated.Value(0)).current;
  const ring3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;

    startSpeechToText();

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (started) {
      startRingAnimation();
      timeoutRef.current = setTimeout(() => {
        stopSpeechToText(); 
      }, 4000); 
    } else {
      stopRingAnimation();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [started]);

  useEffect(() => {
    if (results.length > 0) {
      navigation.replace('Results', { query: results[0] });
    }
  }, [results, navigation]);

  const startRingAnimation = () => {
    Animated.loop(
      Animated.stagger(600, [
        Animated.timing(ring1Anim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(ring2Anim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(ring3Anim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopRingAnimation = () => {
    ring1Anim.setValue(0);
    ring2Anim.setValue(0);
    ring3Anim.setValue(0);
  };

  const startSpeechToText = async () => {
    try {
      await Voice.start('en-NZ'); 
      setStarted(true);
    } catch (e) {
      console.error(e);
      Alert.alert(
        t('error') || 'Error',
        t('speechRecognitionStartError') || 'Failed to start speech recognition. Please try again.'
      );
    }
  };

  const stopSpeechToText = async () => {
    try {
      await Voice.stop();
      setStarted(false);
    } catch (e) {
      console.error(e);
      Alert.alert(
        t('error') || 'Error',
        t('speechRecognitionStopError') || 'Failed to stop speech recognition.'
      );
    }
  };

  const onSpeechResults = (result) => {
    const capitalizedResults = result.value?.map((res) => res.charAt(0).toUpperCase() + res.slice(1)) || [];
    setResults(capitalizedResults);
  };

  const onSpeechError = (error) => {
    console.log(error);
    Alert.alert(
      t('speechRecognitionError') || 'Speech Recognition Error',
      t('speechRecognitionErrorMessage') || 'An error occurred during speech recognition. Please try again.'
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={theme === 'light' ? '#fff' : '#1A1A1A'}
        translucent={true}
      />
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()} 
          activeOpacity={1}
          accessibilityLabel={t('goBack') || 'Go back'} 
          accessibilityRole="button"
        >
          <View style={styles.backIconContainer}>
            <Icon name="arrow-back" size={24} color="#000" />
          </View>
        </TouchableOpacity>
        <CustomText style={styles.title}>{t('voiceSearch') || 'Voice Search'}</CustomText>
        <View style={styles.placeholder} />
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.transcriptionBox}>
          {results.length > 0 ? (
            results.map((result, index) => (
              <Text 
                key={index} 
                style={styles.transcriptionText}
                accessibilityLabel={`${t('searchQuery') || 'Search query'}: ${result}`} 
              >
                {result}
              </Text>
            ))
          ) : (
            <Text 
              style={styles.transcriptionText}
              accessibilityLabel={started ? t('listening') || 'Listening' : t('speakSomething') || 'Speak Something'} 
            >
              {started ? t('listening') + '...' || 'Listening...' : t('speakSomething') || 'Speak Something'}
            </Text>
          )}
        </View>

        <View style={styles.micButtonWrapper}>
          <Animated.View
            style={[
              styles.ring,
              {
                transform: [{ scale: ring1Anim }],
                opacity: ring1Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 0], 
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ring,
              {
                transform: [{ scale: ring2Anim }],
                opacity: ring2Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 0],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ring,
              {
                transform: [{ scale: ring3Anim }],
                opacity: ring3Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 0],
                }),
              },
            ]}
          />

          <TouchableOpacity
            style={[styles.floatingMicButton, started ? styles.micButtonActive : null]}
            onPress={started ? stopSpeechToText : startSpeechToText}
            accessibilityLabel={
              started 
                ? t('stopListening') || 'Stop listening'
                : t('startListening') || 'Start listening'
            } 
            accessibilityRole="button"
            accessibilityState={{ 
              expanded: started,
              busy: started 
            }}  state
          >
            <MaterialIcons name="mic" size={40} color="white" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A', 
      marginTop: 10,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      paddingHorizontal: 20,
      paddingTop: 40,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
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
      elevation: 4,
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
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    transcriptionBox: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      width: '100%',
    },
    transcriptionText: {
      fontSize: 18,
      color: theme === 'light' ? '#333' : '#e5e5e7', 
      textAlign: 'center',
    },
    micButtonWrapper: {
      position: 'absolute',
      bottom: 70,
      justifyContent: 'center',
      alignItems: 'center',
    },
    floatingMicButton: {
      backgroundColor: theme === 'light' ? '#000' : '#2C2C2E', 
      borderRadius: 50,
      padding: 25,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme === 'light' ? '#000' : '#000', 
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 5,
    },
    micButtonActive: {
      backgroundColor: theme === 'light' ? '#34A853' : '#2E7D32', 
    },
    ring: {
      position: 'absolute',
      width: 150,
      height: 150,
      borderRadius: 75,
      borderWidth: 4,
      borderColor: theme === 'light' ? '#4285F4' : '#2962FF', 
    },
  });
