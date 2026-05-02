import React, { createContext, useState, useEffect } from 'react';
import { CONFIG } from '../config/config';

export const OutbreakContext = createContext();

// Base coordinates for common cities to center the random scatter
const CITY_COORDS = {
  'Pune': { latitude: 18.5204, longitude: 73.8567 },
  'Mumbai': { latitude: 19.0760, longitude: 72.8777 },
  'Bangalore': { latitude: 12.9716, longitude: 77.5946 },
  'Delhi': { latitude: 28.7041, longitude: 77.1025 },
  'Chennai': { latitude: 13.0827, longitude: 80.2707 },
  // Default to central India (Nagpur area)
  'Default': { latitude: 20.5937, longitude: 78.9629 },
};

export const OutbreakProvider = ({ children }) => {
  const [outbreakData, setOutbreakData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emptyReason, setEmptyReason] = useState(null); // 'empty_database' | 'no_recent_data' | null
  const [serverMessage, setServerMessage] = useState('');

  // Single fetch attempt with given timeout
  const attemptFetch = async (url, timeoutMs) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  const fetchRiskData = async (city = '') => {
    try {
      setLoading(true);
      setError(null);
      setEmptyReason(null);
      setServerMessage('');
      
      const url = city 
        ? `${CONFIG.API_BASE_URL}/api/risk/calculate?city=${city}`
        : `${CONFIG.API_BASE_URL}/api/risk/calculate`;

      // Auto-retry logic for Render free-tier cold starts
      // Both backend + ML servers may be sleeping, each takes ~50s to wake
      // We try up to 3 times with delays so the user never sees "Unable to Connect"
      const MAX_RETRIES = 3;
      const TIMEOUT_MS = 90000; // 90s per attempt
      let json;
      let lastError;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`🔄 Fetch attempt ${attempt}/${MAX_RETRIES}...`);
          json = await attemptFetch(url, TIMEOUT_MS);
          break; // Success — exit loop
        } catch (err) {
          lastError = err;
          console.log(`⏳ Attempt ${attempt} failed: ${err.message}`);
          if (attempt < MAX_RETRIES) {
            // Wait before retrying (servers should be waking up)
            const delayMs = attempt === 1 ? 5000 : 3000;
            console.log(`⏳ Waiting ${delayMs / 1000}s before retry...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        }
      }

      // If all retries failed, throw the last error
      if (!json) {
        throw lastError;
      }
      
      if (json.success && Array.isArray(json.data)) {
        if (json.data.length === 0) {
          console.log("ℹ️ No outbreak data found -", json.reason || 'unknown reason');
          setOutbreakData([]);
          setEmptyReason(json.reason || null);
          setServerMessage(json.message || '');
          return;
        }

        // Use real coordinates from backend if available, otherwise fallback to city-based random
        const processedData = json.data.map((item, index) => {
          let coordinates;

          // Prefer real geocoded coordinates from backend
          if (item.lat && item.lng) {
            coordinates = {
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lng),
            };
          } else {
            // Fallback: random offset around city center (only when geocoding failed)
            const baseLocation = CITY_COORDS[item.city] || CITY_COORDS['Default'];
            const latOffset = (Math.random() - 0.5) * 0.8;
            const lngOffset = (Math.random() - 0.5) * 0.8;
            coordinates = {
              latitude: baseLocation.latitude + latOffset,
              longitude: baseLocation.longitude + lngOffset,
            };
          }

          return {
            ...item,
            id: `server-${index}-${Date.now()}`,
            coordinates,
          };
        });
        
        setOutbreakData(processedData);
      } else {
        throw new Error(json.error || 'Invalid data format returned by API');
      }
    } catch (err) {
      console.warn('API Error:', err);
      if (err.name === 'AbortError') {
        setError('Server is starting up. Please wait a moment and tap Retry.');
      } else if (err.message?.includes('Network request failed')) {
        setError('Could not reach the server. Please check your internet connection.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskData();
  }, []);

  const refreshData = async (city = '') => {
    await fetchRiskData(city);
  };


  const getHighRiskAreas = () => outbreakData.filter((d) => d.prediction.level === 'HIGH');
  const getMediumRiskAreas = () => outbreakData.filter((d) => d.prediction.level === 'MEDIUM');
  const getLowRiskAreas = () => outbreakData.filter((d) => d.prediction.level === 'LOW');
  
  const getStats = () => ({
    total: outbreakData.length,
    high: getHighRiskAreas().length,
    medium: getMediumRiskAreas().length,
    low: getLowRiskAreas().length,
  });

  return (
    <OutbreakContext.Provider value={{
      outbreakData,
      loading,
      error,
      emptyReason,
      serverMessage,
      refreshData,
      getHighRiskAreas,
      getMediumRiskAreas,
      getLowRiskAreas,
      getStats
    }}>
      {children}
    </OutbreakContext.Provider>
  );
};
