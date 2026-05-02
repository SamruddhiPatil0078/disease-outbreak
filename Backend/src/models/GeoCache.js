const mongoose = require("mongoose");

/**
 * GeoCache Model
 * Stores geocoded coordinates for area+city combinations.
 * Once an area is geocoded, the coordinates are cached permanently
 * so we never hit the geocoding API for the same area again.
 */
const GeoCacheSchema = new mongoose.Schema({
  // Composite key: area_city (lowercased, trimmed)
  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  area: { type: String, required: true },
  city: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  source: { type: String, default: "nominatim" }, // 'opencage' | 'nominatim' | 'manual'
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("GeoCache", GeoCacheSchema);
