import { doc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../utils/firebase';

export const toggleFavorite = async (id, favorites, setServicemen) => {
  try {
    const uid = await AsyncStorage.getItem('uid');
    if (!uid) {
      console.error('No user ID found');
      return false;
    }

    const userDocRef = doc(db, 'users', uid);
    const isFavorite = favorites.includes(id);

    if (isFavorite) {
      await updateDoc(userDocRef, {
        favorites: arrayRemove(id),
      });
      setServicemen(prevServicemen => 
        prevServicemen.filter(service => service.id !== id)
      );
    } else {
      await updateDoc(userDocRef, {
        favorites: arrayUnion(id),
      });
    }

    return true; 
  } catch (error) {
    console.error('Error updating favorites:', error);
    return false; 
  }
};