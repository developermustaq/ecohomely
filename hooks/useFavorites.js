import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../utils/firebase';

function useFavorites() {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const uid = await AsyncStorage.getItem('uid');
        if (!uid) return;

        const userDocRef = doc(db, 'users', uid);
        const unsubscribe = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setFavorites(doc.data().favorites || []);
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching favorites:', error);
      }
    };

    fetchFavorites();
  }, []);

  return { favorites, setFavorites };
}

export default useFavorites;