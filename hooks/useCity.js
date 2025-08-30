import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

function useCity() {
  const [city, setCity] = useState('');
  const [cityLoading, setCityLoading] = useState(true);

  useEffect(() => {
    const fetchCity = async () => {
      setCityLoading(true);
      try {
        const locationData = await AsyncStorage.getItem('location');
        if (locationData) {
          const { city: storedCity } = JSON.parse(locationData);
          setCity(storedCity);
        }
      } catch (error) {
        console.error('Error retrieving city:', error);
      }
      setCityLoading(false);
    };

    fetchCity();
  }, []);

  return { city, cityLoading };
}

export default useCity;