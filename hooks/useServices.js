import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../utils/firebase';

function useServices(city, cityLoading) {
  const [services, setServices] = useState([]);
  const [displayedServices, setDisplayedServices] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    if (!city || cityLoading) return;

    const loadCachedServices = async () => {
      try {
        const cachedData = await AsyncStorage.getItem(`services_${city}`);
        if (cachedData) {
          const allServices = JSON.parse(cachedData);
          const approvedServices = allServices.filter(service => service.Approved === true);
          setServices(approvedServices);
          setDisplayedServices(approvedServices.slice(0, ITEMS_PER_PAGE));
          setHasMore(approvedServices.length > ITEMS_PER_PAGE);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading cached services:', error);
      }
    };

    loadCachedServices();
    setLoading(true);

    const servicemenCollection = collection(db, 'servicemen');
    const q = query(
      servicemenCollection,
      where('address', '==', city),
      where('Approved', '==', true)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
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
        Approved: doc.data().Approved,
        isOnline: doc.data().isOnline || false
      }));

      setServices(servicemenList);
      setDisplayedServices(servicemenList.slice(0, ITEMS_PER_PAGE));
      setHasMore(servicemenList.length > ITEMS_PER_PAGE);
      setLoading(false);
      setPage(1);

      AsyncStorage.setItem(`services_${city}`, JSON.stringify(servicemenList));
    });

    return () => unsubscribe();
  }, [city, cityLoading]);

  const loadMoreServices = useCallback(() => {
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    const startIndex = (nextPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    const newServices = services.slice(startIndex, endIndex);
    if (newServices.length > 0) {
      setDisplayedServices((prevServices) => [...prevServices, ...newServices]);
      setPage(nextPage);
      setHasMore(endIndex < services.length);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  }, [hasMore, loadingMore, page, services]);

  return { services, displayedServices, page, hasMore, loading, loadMoreServices };
}

export default useServices;