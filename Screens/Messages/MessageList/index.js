import React, { useRef, useEffect, useState, useContext } from 'react';
import { FlatList, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MessageItem from './MessageItem';
import moment from 'moment';
import { ThemeContext } from '../../../theme/ThemeContext'; 
import { useTranslation } from '../../../context/TranslationContext'; 

const MessageList = ({ messages, userUid, onGetLocation }) => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 
  const styles = getStyles(theme);
  const flatListRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const groupMessagesByDate = (messages) => {
    const groupedMessages = {};
    messages.forEach((message) => {
      const messageDate = moment(message.timestamp?.toDate()).format('YYYY-MM-DD');
      if (!groupedMessages[messageDate]) {
        groupedMessages[messageDate] = [];
      }
      groupedMessages[messageDate].push(message);
    });
    return groupedMessages;
  };

  const groupedMessages = groupMessagesByDate(messages);

  const getDateLabel = (date) => {
    const today = moment().format('YYYY-MM-DD');
    const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');

    if (date === today) return t('today') || 'Today';
    if (date === yesterday) return t('yesterday') || 'Yesterday';
    return moment(date).format('DD MMM YYYY');
  };

  // Scroll to the last message
  const scrollToLastMessage = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
      setIsAtBottom(true);
    }
  };

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    setIsAtBottom(isBottom);
  };

  useEffect(() => {
    if (messages.length > 0 && flatListRef.current && isAtBottom) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isAtBottom]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={Object.keys(groupedMessages)}
        keyExtractor={(date) => date}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll} 
        scrollEventThrottle={16} 
        renderItem={({ item: date }) => (
          <View>
            <Text 
              style={styles.dateHeader}
              accessibilityLabel={`${t('messagesFrom') || 'Messages from'} ${getDateLabel(date)}`} 
            >
              {getDateLabel(date)}
            </Text>
            
            {groupedMessages[date].map((message) => (
              <MessageItem
                key={message.id}
                item={message}
                onGetLocation={onGetLocation}
                userUid={userUid}
                t={t}
              />
            ))}
          </View>
        )}
        contentContainerStyle={styles.contentContainer}
      />

      {!isAtBottom && (
        <TouchableOpacity 
          style={styles.scrollButton} 
          onPress={scrollToLastMessage}
          accessibilityLabel={t('scrollToBottom') || 'Scroll to bottom'} 
          accessibilityRole="button"
        >
          <Icon
            name="keyboard-arrow-down"
            size={30}
            color={theme === 'light' ? '#000' : '#e5e5e7'}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
    },
    contentContainer: {
      paddingBottom: 10, 
    },
    dateHeader: {
      textAlign: 'center',
      paddingVertical: 5,
      marginVertical: 10,
      fontSize: 14,
      fontWeight: 'bold',
      color: theme === 'light' ? '#888' : '#aaa',
      backgroundColor: theme === 'light' ? '#e5e5e7' : '#3C3C3E',
      borderRadius: 15,
      alignSelf: 'center',
      paddingHorizontal: 15,
    },
    scrollButton: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      backgroundColor: theme === 'light' ? '#fff' : '#3C3C3E',
      borderRadius: 30,
      padding: 8,
      elevation: 5,
      shadowColor: theme === 'light' ? '#000' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3.84,
    },
  });

export default MessageList;
