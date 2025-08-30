import React, { useState, useEffect, useContext } from 'react';
import { KeyboardAvoidingView, Platform, ActivityIndicator, Linking, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { db } from '../../utils/firebase';
import { collection, addDoc, doc, onSnapshot, serverTimestamp, orderBy, query, where, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { ThemeContext } from '../../theme/ThemeContext'; 
import { useTranslation } from '../../context/TranslationContext'; 

const ChatScreen = () => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(); 
  const styles = getStyles(theme);
  const navigation = useNavigation();
  const route = useRoute();
  const { otherUserId } = route.params;

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [userUid, setUserUid] = useState(null);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [servicePerson, setServicePerson] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const uid = await AsyncStorage.getItem('uid');
        if (uid) {
          setUserUid(uid);
        }
      } catch (error) {
        console.log('Error fetching UID from AsyncStorage', error);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchServicePersonData = async () => {
      try {
        if (!otherUserId) return;

        const servicemanRef = doc(db, 'servicemen', otherUserId);
        const servicemanSnap = await getDoc(servicemanRef);

        if (servicemanSnap.exists()) {
          setServicePerson(servicemanSnap.data());
        }
      } catch (error) {
        console.log('Error fetching servicemen data:', error);
      }
    };
    fetchServicePersonData();
  }, [otherUserId]);

  useEffect(() => {
    if (!userUid || !otherUserId) return;

    const messagesRef = collection(db, 'messages');
    const messagesQuery = query(
      messagesRef,
      where('participants', 'array-contains', userUid),
      orderBy('timestamp')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(msg => msg.participants.includes(otherUserId));

      setMessages(messagesData);
      setInitialLoading(false);
    });

    return unsubscribe;
  }, [userUid, otherUserId]);

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage.length > 0 && userUid && otherUserId) {
      const messageData = {
        text: trimmedMessage,
        sender: userUid,
        receiver: otherUserId,
        participants: [userUid, otherUserId],
        timestamp: serverTimestamp(),
      };
  
      if (replyToMessage) {
        messageData.replyTo = replyToMessage.text || null;
        messageData.replyId = replyToMessage.id;
      }
  
      try {
        await addDoc(collection(db, 'messages'), messageData);
        setMessage('');
        setReplyToMessage(null);
  
        const servicemanRef = doc(db, 'servicemen', otherUserId);
        const servicemanSnap = await getDoc(servicemanRef);
  
        if (servicemanSnap.exists()) {
          const recipientData = servicemanSnap.data();
          const expoPushToken = recipientData?.expoPushToken;
  
          if (expoPushToken) {
            await sendPushNotification(expoPushToken, messageData.text);
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
        Alert.alert(
          t('error') || 'Error',
          t('messageSendError') || 'Failed to send message. Please try again.'
        );
      }
    }
  };

  const sendPushNotification = async (expoPushToken, messageText) => {
    const notificationMessage = {
      to: expoPushToken,
      sound: 'default',
      title: t('newMessage') || 'New Message',
      body: messageText,
      data: { screen: 'Chat', otherUserId: userUid },
    };
  
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationMessage),
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  };
  
  const onGetLocation = async (bookingId) => {
    try {
      if (!bookingId) {
        Alert.alert(
          t('error') || 'Error',
          t('noBookingId') || 'No Booking ID provided'
        );
        return;
      }
  
      const bookingRef = doc(db, `users/${userUid}/Bookings`, bookingId);
      const bookingSnap = await getDoc(bookingRef);
  
      if (bookingSnap.exists()) {
        const bookingData = bookingSnap.data();
        const { Location } = bookingData;
  
        if (Location && typeof Location === 'string') {
          const encodedLocation = encodeURIComponent(Location);
  
          let mapsUrl = '';
  
          if (Platform.OS === 'android') {
            mapsUrl = `geo:0,0?q=${encodedLocation}`;
          } else {
            mapsUrl = `http://maps.apple.com/?q=${encodedLocation}`;
          }
  
          try {
            await Linking.openURL(mapsUrl);
          } catch (linkingError) {
            Alert.alert(
              t('error') || 'Error',
              t('unableToOpenMaps') || 'Unable to open maps application'
            );
          }
        } else {
          Alert.alert(
            t('locationNotAvailable') || 'Location Not Available',
            t('locationDataMissing') || 'Location data is missing or invalid'
          );
        }
      } else {
        Alert.alert(
          t('bookingNotFound') || 'Booking Not Found',
          t('noBookingFoundWithId') || 'No booking found with this ID'
        );
      }
    } catch (error) {
      console.log('Error fetching booking location:', error);
      Alert.alert(
        t('error') || 'Error',
        t('locationFetchError') || 'Error fetching booking location. Please try again.'
      );
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ChatHeader
        onBackPress={() => navigation.goBack()}
        hasSelectedMessages={selectedMessages.size > 0}
        title={servicePerson?.name || t('chat') || 'Chat'}
        imageUrl={servicePerson?.image || null}
        theme={theme} 
        t={t} 
      />

      {initialLoading ? (
        <ActivityIndicator
          size="large"
          color={theme === 'light' ? '#000' : '#e5e5e7'}
          style={styles.loadingContainer}
          accessibilityLabel={t('loading') || 'Loading'} 
        />
      ) : (
        <>
          <MessageList
            messages={messages}
            onSetReplyToMessage={setReplyToMessage}
            selectedMessages={selectedMessages}
            userUid={userUid}
            onGetLocation={onGetLocation}
            theme={theme} 
            t={t} 
          />

          <ChatInput
            onSend={handleSendMessage}
            message={message}
            setMessage={setMessage}
            theme={theme} 
            t={t} 
            replyToMessage={replyToMessage} 
            onCancelReply={() => setReplyToMessage(null)} 
          />
        </>
      )}
    </KeyboardAvoidingView>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme === 'light' ? '#fff' : '#1A1A1A',
    },
  });

export default ChatScreen;
