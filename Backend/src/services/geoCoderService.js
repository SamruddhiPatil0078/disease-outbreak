const axios = require("axios");
const GeoCache = require("../models/GeoCache");

/**
 * Normalize state names that are stored as single words
 * e.g., "westbengal" → "West Bengal", "andhrapradesh" → "Andhra Pradesh"
 */
const STATE_NAME_MAP = {
  "westbengal": "West Bengal",
  "andhrapradesh": "Andhra Pradesh",
  "madhyapradesh": "Madhya Pradesh",
  "uttarpradesh": "Uttar Pradesh",
  "himachalpradesh": "Himachal Pradesh",
  "arunachalpradesh": "Arunachal Pradesh",
  "jammuandkashmir": "Jammu and Kashmir",
  "tamilnadu": "Tamil Nadu",
  "chhattisgarh": "Chhattisgarh",
  "uttarakhand": "Uttarakhand",
  "jharkhand": "Jharkhand",
  "telangana": "Telangana",
  "karnataka": "Karnataka",
  "maharashtra": "Maharashtra",
  "rajasthan": "Rajasthan",
  "gujarat": "Gujarat",
  "punjab": "Punjab",
  "bihar": "Bihar",
  "odisha": "Odisha",
  "kerala": "Kerala",
  "meghalaya": "Meghalaya",
  "sikkim": "Sikkim",
  "tripura": "Tripura",
  "mizoram": "Mizoram",
  "manipur": "Manipur",
  "goa": "Goa",
  "nagaland": "Nagaland",
  "assam": "Assam",
  "haryana": "Haryana",
};

const normalizeState = (raw) => {
  const key = (raw || "").toLowerCase().replace(/\s+/g, "");
  return STATE_NAME_MAP[key] || raw;
};

/**
 * Generate a cache key from area and city
 */
const makeCacheKey = (area, city) => {
  return `${(area || "").toLowerCase().trim()}_${(city || "").toLowerCase().trim()}`;
};

/**
 * Check the MongoDB cache for existing coordinates
 */
const getFromCache = async (area, city) => {
  try {
    const key = makeCacheKey(area, city);
    const cached = await GeoCache.findOne({ key });
    if (cached) {
      return { lat: cached.lat, lng: cached.lng };
    }
    return null;
  } catch (err) {
    console.log("⚠️ Cache read error:", err.message);
    return null;
  }
};

/**
 * Save coordinates to the MongoDB cache
 */
const saveToCache = async (area, city, lat, lng, source = "nominatim") => {
  try {
    const key = makeCacheKey(area, city);
    await GeoCache.findOneAndUpdate(
      { key },
      { key, area, city, lat, lng, source, createdAt: new Date() },
      { upsert: true, new: true }
    );
    console.log(`💾 Cached coordinates for: ${area}, ${city}`);
  } catch (err) {
    console.log("⚠️ Cache save error:", err.message);
  }
};

/**
 * Geocodes an area and city/state in India using OpenCage API (or Nominatim as fallback)
 * Now with MongoDB caching — only hits the API for NEW locations!
 */
const geocode = async (area, city) => {
  try {
    // ✅ STEP 1: Check cache first — instant, no API call needed
    const cached = await getFromCache(area, city);
    if (cached) {
      console.log(`⚡ Cache HIT for: ${area}, ${city} → (${cached.lat}, ${cached.lng})`);
      return cached;
    }

    console.log(`🔍 Cache MISS for: ${area}, ${city} — fetching from API...`);

    // Normalize the state name (city field often contains state like "westbengal")
    const normalizedState = normalizeState(city);
    const query = `${area}, ${normalizedState}, India`;

    console.log("🌍 Query:", query);

    let result = null;
    let source = "nominatim";

    // Try OpenCage if key exists
    if (process.env.OPENCAGE_KEY) {
      const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${process.env.OPENCAGE_KEY}&limit=5&countrycode=in`;
      const res = await axios.get(url);

      if (res.data.results && res.data.results.length > 0) {
        const results = res.data.results;

        // 🔥 smart selection
        let selected = results.find(r => {
          const name =
            r.components.suburb ||
            r.components.village ||
            r.components.town ||
            r.components.city ||
            "";

          return name.toLowerCase().includes(area.toLowerCase());
        });

        if (!selected) {
          selected = results.find(r =>
            r.components._type === "suburb" ||
            r.components._type === "village"
          );
        }
        if (!selected) {
          selected = results[0];
        }

        console.log("📍 Selected (OpenCage):", selected.formatted);
        result = { lat: selected.geometry.lat, lng: selected.geometry.lng };
        source = "opencage";
      }
    }

    // Fallback to Nominatim (Free, no key needed) if OpenCage fails or no key
    if (!result) {
      console.log("⚠️ No OpenCage key or no results, trying Nominatim fallback...");
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=in&format=json&limit=1`;
      const nRes = await axios.get(nominatimUrl, {
        headers: { "User-Agent": "DiseaseOutbreakApp/1.0" }
      });

      if (nRes.data && nRes.data.length > 0) {
        console.log("📍 Selected (Nominatim):", nRes.data[0].display_name);
        result = {
          lat: parseFloat(nRes.data[0].lat),
          lng: parseFloat(nRes.data[0].lon),
        };
      }
    }

    // Add delay to respect Nominatim rate limit (1 req/sec)
    await new Promise(r => setTimeout(r, 1500));

    // 🚀 FALLBACK 1.5: Try city + India
    if (!result) {
      console.log(`⚠️ Full query failed. Trying city-only: "${city}, India"`);
      const cityOnlyUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ", India")}&countrycodes=in&format=json&limit=1`;
      const cityRes = await axios.get(cityOnlyUrl, {
        headers: { "User-Agent": "DiseaseOutbreakApp/1.0" }
      });

      if (cityRes.data && cityRes.data.length > 0) {
        console.log("📍 City Fallback (Nominatim):", cityRes.data[0].display_name);
        result = {
          lat: parseFloat(cityRes.data[0].lat),
          lng: parseFloat(cityRes.data[0].lon),
        };
      }
      await new Promise(r => setTimeout(r, 1500));
    }

    // 🚀 FALLBACK 2: Try area + India
    if (!result) {
      console.log(`⚠️ City-only failed. Trying area-only: "${area}, India"`);
      const areaOnlyUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(area + ", India")}&countrycodes=in&format=json&limit=1`;
      const areaRes = await axios.get(areaOnlyUrl, {
        headers: { "User-Agent": "DiseaseOutbreakApp/1.0" }
      });

      if (areaRes.data && areaRes.data.length > 0) {
        console.log("📍 Area Fallback (Nominatim):", areaRes.data[0].display_name);
        result = {
          lat: parseFloat(areaRes.data[0].lat),
          lng: parseFloat(areaRes.data[0].lon),
        };
      }
      await new Promise(r => setTimeout(r, 1500));
    }

    // 🚀 FALLBACK 3: Try state name only
    if (!result) {
      console.log(`⚠️ Area-only also failed. Trying state-only: "${normalizedState}, India"`);
      const stateOnlyUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(normalizedState + ", India")}&countrycodes=in&format=json&limit=1`;
      const stateRes = await axios.get(stateOnlyUrl, {
        headers: { "User-Agent": "DiseaseOutbreakApp/1.0" }
      });

      if (stateRes.data && stateRes.data.length > 0) {
        console.log("📍 State Fallback (Nominatim):", stateRes.data[0].display_name);
        result = {
          lat: parseFloat(stateRes.data[0].lat),
          lng: parseFloat(stateRes.data[0].lon),
        };
      }
    }

    // ✅ STEP 2: Save to cache if we found coordinates
    if (result) {
      await saveToCache(area, city, result.lat, result.lng, source);
      return result;
    }

    console.log(`❌ All geocoding attempts failed for: ${area}, ${city}`);
    return null;

  } catch (err) {
    console.log("❌ Geocode failed:", err.message);
    return null;
  }
};

/**
 * Batch geocode helper to stay compatible with riskController
 */
const batchGeocode = async (items) => {
  const results = new Map();
  const seen = new Set();
  
  for (const item of items) {
    const key = `${(item.area || "").toLowerCase().trim()}_${(item.city || "").toLowerCase().trim()}`;
    if (!seen.has(key)) {
      seen.add(key);
      const coords = await geocode(item.area, item.city);
      if (coords) {
        results.set(key, coords);
      }
      // Only delay if we actually hit the API (cache hits are instant)
    }
  }
  return results;
};

module.exports = { geocode, batchGeocode };
