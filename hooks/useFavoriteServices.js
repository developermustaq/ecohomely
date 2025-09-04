import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../utils/firebase';

function useFavoriteServices(favoriteIds) {
  const [servicemen, setServicemen] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavoriteServices = async () => {
      try {
        const uid = await AsyncStorage.getItem('uid');
        if (!uid) {
          setLoading(false);
          return;
        }

        if (favoriteIds.length === 0) {
          setServicemen([]);
          setLoading(false);
          return;
        }

        const servicemenQuery = query(
          collection(db, 'servicemen'),
          where('__name__', 'in', favoriteIds)
        );
        const unsubscribe = onSnapshot(servicemenQuery, (snapshot) => {
          const servicemenList = snapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name,
            profession: doc.data().profession,
            phoneNumber: doc.data().phone,
            avgRating: doc.data().avgRating,
            address: doc.data().address,
            description: doc.data().description,
            impressions: doc.data().impressions,
            image: doc.data().image || '',
            isOnline: doc.data().isOnline || false,
          }));
          setServicemen(servicemenList);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching favorite services:', error);
        setLoading(false);
      }
    };

    fetchFavoriteServices();
  }, [favoriteIds]);

  return { servicemen, loading };
}

export default useFavoriteServices;