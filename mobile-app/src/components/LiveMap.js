import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SIZES, SHADOWS, getRiskColor } from '../constants/theme';

const { width } = Dimensions.get('window');

// Error Boundary to catch react-native-maps crashes in Expo Go
class MapErrorBoundary extends React.Component {
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

// Simple static round colored dot marker
const RiskDot = ({ data, onPress }) => {
  const color = getRiskColor(data.prediction.level);
  const dotSize = 14;
  const outerSize = 24;

  return (
    <Marker coordinate={data.coordinates} anchor={{ x: 0.5, y: 0.5 }} onPress={onPress}>
      <View style={[styles.markerContainer, { width: outerSize, height: outerSize }]}>
        {/* Outer glow ring */}
        <View
          style={[
            styles.outerRing,
            {
              width: outerSize,
              height: outerSize,
              borderRadius: outerSize / 2,
              backgroundColor: `${color}35`,
            },
          ]}
        />
        {/* Core dot — solid, static, fully opaque */}
        <View
          style={[
            styles.coreDot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
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
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          customMapStyle={darkMapStyle}
        >
          {data.map((item) => (
            <RiskDot key={item.id} data={item} onPress={() => onMarkerPress && onMarkerPress(item)} />
          ))}
        </MapView>

        {/* Floating Legend */}
        <View style={styles.legendContainer}>
          <LinearGradient
            colors={['rgba(18, 26, 47, 0.85)', 'rgba(11, 17, 32, 0.95)']}
            style={styles.legendGradient}
          >
            <Text style={styles.legendTitle}>Risk Zones</Text>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.high, ...SHADOWS.glowSm(COLORS.high) }]} />
              <Text style={styles.legendText}>High</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.medium }]} />
              <Text style={styles.legendText}>Medium</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.low }]} />
              <Text style={styles.legendText}>Low</Text>
            </View>
          </LinearGradient>
        </View>
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
  legendContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  legendGradient: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  legendTitle: {
    color: COLORS.textPrimary,
    fontSize: 11,
    ...FONTS.bold,
    marginBottom: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    ...FONTS.medium,
  },
});

export default LiveMap;