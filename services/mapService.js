const axios = require('axios');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Geocode address to coordinates
const geocodeAddress = async (address) => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not configured - using mock coordinates');
      // Return mock coordinates for development/testing
      return {
        latitude: 40.7128, // New York City latitude
        longitude: -74.0060, // New York City longitude
        formattedAddress: address
      };
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: response.data.results[0].formatted_address
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    // Return mock coordinates as fallback
    return {
      latitude: 40.7128, // New York City latitude
      longitude: -74.0060, // New York City longitude
      formattedAddress: address
    };
  }
};

// Reverse geocode coordinates to address
const reverseGeocode = async (latitude, longitude) => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not configured - using mock address');
      // Return mock address for development/testing
      return {
        formattedAddress: 'New York, NY, USA',
        addressComponents: []
      };
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        latlng: `${latitude},${longitude}`,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      return {
        formattedAddress: response.data.results[0].formatted_address,
        addressComponents: response.data.results[0].address_components
      };
    }

    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    // Return mock address as fallback
    return {
      formattedAddress: 'New York, NY, USA',
      addressComponents: []
    };
  }
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

module.exports = {
  geocodeAddress,
  reverseGeocode,
  calculateDistance
};

