import React, { useState, useContext } from 'react';
import { View, TextInput, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { ThemeContext } from '../../theme/ThemeContext'; 
import { useTranslation } from '../../context/TranslationContext'; 

const ChatInput = ({ onSend, message, setMessage }) => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 
  const styles = getStyles(theme);
  const [inputHeight, setInputHeight] = useState(45); 

  const handleSend = () => {
    if (message.trim()) { 
      if (onSend) onSend();
      setMessage('');
      setInputHeight(45);
    }
  };

  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, { height: inputHeight }]}
          placeholder={t('sendMessage') || 'Send Message'}
          placeholderTextColor={theme === 'light' ? '#888' : '#aaa'}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          onContentSizeChange={(e) => {
            const newHeight = e.nativeEvent.contentSize.height;
            setInputHeight(newHeight < 110 ? newHeight : 110);
          }}
          accessibilityLabel={t('messageInput') || 'Message input'} 
          accessibilityRole="text"
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
      </View>
      <TouchableOpacity 
        onPress={handleSend} 
        style={[
          styles.sendButton,
          { opacity: message.trim() ? 1 : 0.5 } 
        ]}
        activeOpacity={0.8}
        accessibilityLabel={t('sendMessage') || 'Send message'} 
        accessibilityRole="button"
        accessibilityState={{ disabled: !message.trim() }}  state
        disabled={!message.trim()} 
      >
        <LinearGradient
          colors={theme === 'light' ? ['#777', '#000'] : ['#fff','#ccc']} 
          style={styles.gradient}
        >
          <FeatherIcon 
            name="send" 
            size={25} 
            color={theme === 'light' ? '#fff' : '#555'} 
          />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    inputContainer: {
      flexDirection: 'row',
      padding: 10,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
      alignItems: 'center',
      paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    },
    inputWrapper: {
      flex: 1,
      position: 'relative',
    },
    input: {
      borderWidth: 1,
      borderColor: theme === 'light' ? '#ccc' : '#555',
      borderRadius: 25,
      padding: 12,
      backgroundColor: theme === 'light' ? '#F4F4F5' : '#3C3C3E',
      textAlignVertical: 'top',
      fontSize: 16,
      color: theme === 'light' ? '#000' : '#e5e5e7',
    },
    sendButton: {
      marginLeft: 5,
      borderRadius: 25,
      overflow: 'hidden',
      elevation: 3,
    },
    gradient: {
      padding: 10,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      width: 45,
      height: 45,
    },
  });

export default ChatInput;
