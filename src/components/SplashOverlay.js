import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const SplashOverlay = ({ visible, onComplete }) => {
  const [show, setShow] = useState(visible);

  useEffect(() => {
    if (visible) {
      // Auto-hide after 2.5 seconds
      const timer = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);

  if (!show) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B3D2E" />
      
      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>📄✓</Text>
        </View>
        <Text style={styles.appName}>ReceiptKeeper</Text>
      </View>

      {/* Slogan */}
      <View style={styles.sloganContainer}>
        <Text style={styles.sloganMain}>Every Receipt.</Text>
        <Text style={styles.sloganMain}>Every Detail.</Text>
        <Text style={styles.sloganMain}>Every Time.</Text>
        <Text style={styles.sloganSub}>Track • Organize • Secure</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: 'rgba(11, 61, 46, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoBox: {
    width: 120,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 56,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  sloganContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  sloganMain: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  sloganSub: {
    fontSize: 14,
    fontWeight: '400',
    color: '#B2DFDB',
    marginTop: 12,
    letterSpacing: 2,
    textAlign: 'center',
  },
});

export default SplashOverlay;
