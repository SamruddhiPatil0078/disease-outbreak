import React, { useEffect, useRef, useState, Component } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SIZES, SHADOWS, getRiskColor } from '../constants/theme';

const { width } = Dimensions.get('window');

// Error Boundary
class MapErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('MapView crashed:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={fallbackStyles.container}>
          <LinearGradient
            colors={['rgba(18, 26, 47, 0.95)', 'rgba(11, 17, 32, 0.95)']}
            style={fallbackStyles.gradient}
          >
            <Text style={fallbackStyles.icon}>🗺️</Text>
            <Text style={fallbackStyles.title}>Map Unavailable</Text>
            <Text style={fallbackStyles.subtitle}>
              Maps require a development build.{'\n'}Use the web dashboard for map view.
            </Text>
          </LinearGradient>
        </View>
      );
    }
    return this.props.children;
  }
}

const fallbackStyles = StyleSheet.create({
  container: {
    height: 350,
    width: width,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  icon: { fontSize: 48 },
  title: {
    color: COLORS.textPrimary,
    fontSize: SIZES.lg,
    ...FONTS.bold,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: SIZES.sm,
    ...FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
});

// Custom Map Style
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#121A2F' }] },
];

// Animated Marker
const AnimatedRiskZone = ({ data, onPress }) => {
  const isHigh = data.prediction.level === 'HIGH';
  const color = getRiskColor(data.prediction.level);

  const confidence = parseInt(data.prediction.confidence) || 50;
  const baseSize = 40 + (confidence / 2);
  const size = isHigh ? baseSize * 1.5 : baseSize;

  // ✅ FIX ADDED
  const totalSize = size * 2;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (isHigh) {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.5,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(opacityAnim, {
              toValue: 0.1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.4,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    }
  }, [isHigh]);

  return (
    <Marker coordinate={data.coordinates} anchor={{ x: 0.5, y: 0.5 }} onPress={onPress}>
      <View style={[styles.markerContainer, { width: totalSize, height: totalSize }]}>
        <View
          style={[
            styles.outerRing,
            {
              width: totalSize,
              height: totalSize,
              borderRadius: totalSize / 2,
              backgroundColor: `${color}35`,
            },
          ]}
        />
        <View
          style={[
            styles.coreDot,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color,
              borderWidth: 1.5,
              borderColor: '#FFFFFF',
            },
          ]}
        />
      </View>
    </Marker>
  );
};

// Main Component
const LiveMap = ({ data = [], onMarkerPress }) => {
  const mapRef = useRef(null);

  const initialRegion = {
    latitude: 20.5937,
    longitude: 78.9629,
    latitudeDelta: 15.0,
    longitudeDelta: 15.0,
  };

  const hasCoordinates = data.some(d => d.coordinates);

  if (!hasCoordinates) {
    return (
      <View style={styles.fallback}>
        <Text style={{ color: '#fff' }}>No coordinate data available</Text>
      </View>
    );
  }

  return (
    <MapErrorBoundary>
      <View style={styles.container}>
        <MapView style={styles.map} initialRegion={initialRegion} customMapStyle={darkMapStyle}>
          {data.map((item) => (
            <AnimatedRiskZone
              key={item.id}
              data={item}
              onPress={() => onMarkerPress && onMarkerPress(item)}
            />
          ))}
        </MapView>
      </View>
    </MapErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 350,
    width: width,
    marginBottom: 20,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  fallback: {
    height: 350,
    width: width,
    backgroundColor: COLORS.bgMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerRing: {
    position: 'absolute',
  },
  coreDot: {
    position: 'absolute',
  },
});

export default LiveMap;