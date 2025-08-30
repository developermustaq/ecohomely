import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';

const NotificationHandler = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const handleNotificationResponse = (response) => {
      const data = response.notification.request.content.data;

      if (data.screen === 'Chat' && data.otherUserId) {
        navigation.navigate('Chat', { otherUserId: data.otherUserId });
      }
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    return () => {
      subscription.remove();
    };
  }, [navigation]);

  return null; 
};

export default NotificationHandler;
