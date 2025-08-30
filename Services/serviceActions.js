import { doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import { db } from '../utils/firebase';

export const toggleFavorite = async (id, favorites, setFavorites) => {
  const uid = await AsyncStorage.getItem('uid');
  if (!uid) return;

  const userDocRef = doc(db, 'users', uid);
  const isFavorited = favorites.includes(id);

  try {
    await updateDoc(userDocRef, {
      favorites: isFavorited ? arrayRemove(id) : arrayUnion(id),
    });
  } catch (error) {
    console.error('Error updating favorites:', error);
  }
};

export const handleCallNow = async (phoneNumber, serviceId) => {
  try {
    const serviceDocRef = doc(db, 'servicemen', serviceId);
    await updateDoc(serviceDocRef, {
      callNowCount: increment(1),
    });
    Linking.openURL(`tel:${phoneNumber}`);
  } catch (error) {
    console.error('Error updating callNowCount:', error);
    Linking.openURL(`tel:${phoneNumber}`);
  }
};