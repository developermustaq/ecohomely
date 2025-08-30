import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

const useAppState = () => {
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [hasAttemptedRegistration, setHasAttemptedRegistration] = useState(false);

  useEffect(() => {
    const updateStatus = async (isActive) => {
      try {
        const userId = await AsyncStorage.getItem('uid');
        if (!userId) return;

        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
          active: isActive,
          lastSeen: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    };

    const registerForPushNotificationsAsync = async () => {
      if (hasAttemptedRegistration || !Device.isDevice) {
        return;
      }

      try {
        setHasAttemptedRegistration(true);
        
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        setPermissionStatus(finalStatus);
        
        if (finalStatus !== 'granted') {
          console.log('Push notification permission denied - continuing without notifications');
          await AsyncStorage.setItem('pushNotificationPermissionDenied', 'true');
          return;
        }

        const projectId = '91eec2d0-c9d4-4a3c-aad9-c21ffd501e3e';
        const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('Push Token:', pushToken);

        const userId = await AsyncStorage.getItem('uid');
        if (userId) {
          const userDocRef = doc(db, 'users', userId);
          await updateDoc(userDocRef, {
            expoPushToken: pushToken,
          });
          console.log('Push notifications registered successfully');
        }
      } catch (error) {
        console.error('Error registering for push notifications:', error);
        setPermissionStatus('error');
      }
    };

    const checkIfShouldAttemptNotifications = async () => {
      const permissionDenied = await AsyncStorage.getItem('pushNotificationPermissionDenied');
      if (permissionDenied === 'true') {
        setHasAttemptedRegistration(true);
        setPermissionStatus('denied');
        return false;
      }
      return true;
    };

    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === 'active') {
        updateStatus(true);
        
        const shouldAttempt = await checkIfShouldAttemptNotifications();
        if (shouldAttempt && !hasAttemptedRegistration) {
          await registerForPushNotificationsAsync();
        }
      } else {
        updateStatus(false);
      }
    };

    checkIfShouldAttemptNotifications().then(shouldAttempt => {
      if (shouldAttempt && AppState.currentState === 'active') {
        registerForPushNotificationsAsync();
      }
    });

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      updateStatus(false);
    };
  }, [hasAttemptedRegistration]);

  return { permissionStatus };
};

export default useAppState;
