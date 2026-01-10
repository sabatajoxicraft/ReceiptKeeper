import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const SplashOverlay = ({ visible, onComplete }) => {
  const [show, setShow] = useState(visible);
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.9);

  useEffect(() => {
    if (visible) {
      // Fade in animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          setShow(false);
          onComplete?.();
        });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);

  if (!show) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Logo and branding */}
      <Animated.View 
        style={[
          styles.content,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        {/* App Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBox}>
            <Text style={styles.iconEmoji}>📄</Text>
            <View style={styles.checkmarkBadge}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          </View>
        </View>

        {/* App Name */}
        <Text style={styles.appName}>ReceiptKeeper</Text>

        {/* Slogan */}
        <View style={styles.sloganContainer}>
          <Text style={styles.sloganLine}>Every Receipt.</Text>
          <Text style={styles.sloganLine}>Every Detail.</Text>
          <Text style={styles.sloganLine}>Every Time.</Text>
        </View>

        {/* Tagline */}
        <View style={styles.taglineContainer}>
          <View style={styles.divider} />
          <Text style={styles.tagline}>Track • Organize • Secure</Text>
          <View style={styles.divider} />
        </View>
      </Animated.View>

      {/* Attribution */}
      <Text style={styles.attribution}>Photo by Unsplash</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBox: {
    width: 140,
    height: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
    position: 'relative',
  },
  iconEmoji: {
    fontSize: 70,
    marginTop: -8,
  },
  checkmarkBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 48,
    height: 48,
    backgroundColor: '#22C55E',
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  checkmark: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  sloganContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sloganLine: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 12,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    color: '#B2DFDB',
    letterSpacing: 3,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  attribution: {
    position: 'absolute',
    bottom: 24,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1,
  },
});

export default SplashOverlay;
