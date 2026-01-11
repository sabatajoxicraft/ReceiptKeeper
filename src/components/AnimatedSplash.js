import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing, Image } from 'react-native';

const { width, height } = Dimensions.get('window');

const AnimatedSplash = ({ onAnimationFinish }) => {
  // Animation values
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Sequence of animations
    Animated.sequence([
      // 1. Logo fades in and scales up with spring
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      // 2. Brief pause
      Animated.delay(200),
      // 3. Checkmark badge pops in
      Animated.spring(checkScale, {
        toValue: 1,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }),
      // 4. Subtle pulse effect
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      // 5. Hold before finishing
      Animated.delay(400),
    ]).start(() => {
      if (onAnimationFinish) {
        onAnimationFinish();
      }
    });
  }, []);

  const logoSize = Math.min(width, height) * 0.4;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [
              { scale: Animated.multiply(logoScale, pulseAnim) },
            ],
          },
        ]}
      >
        {/* Receipt Paper */}
        <View style={[styles.paper, { width: logoSize * 0.6, height: logoSize * 0.8 }]}>
          {/* Lines on receipt */}
          <View style={styles.line} />
          <View style={[styles.line, { width: '70%' }]} />
          <View style={[styles.line, { width: '85%' }]} />
          <View style={[styles.line, { width: '55%' }]} />
        </View>
        
        {/* Green checkmark badge */}
        <Animated.View
          style={[
            styles.checkBadge,
            {
              transform: [{ scale: checkScale }],
              right: logoSize * 0.05,
              bottom: logoSize * 0.05,
            },
          ]}
        >
          <View style={styles.checkmark}>
            <View style={styles.checkShort} />
            <View style={styles.checkLong} />
          </View>
        </Animated.View>
      </Animated.View>
      
      {/* App name with fade in */}
      <Animated.Text
        style={[
          styles.appName,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        ReceiptKeeper
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B3D2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  paper: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  line: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginVertical: 8,
    width: '90%',
  },
  checkBadge: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  checkmark: {
    width: 24,
    height: 24,
    position: 'relative',
  },
  checkShort: {
    position: 'absolute',
    width: 10,
    height: 4,
    backgroundColor: 'white',
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
    left: 2,
    top: 12,
  },
  checkLong: {
    position: 'absolute',
    width: 18,
    height: 4,
    backgroundColor: 'white',
    borderRadius: 2,
    transform: [{ rotate: '-45deg' }],
    left: 6,
    top: 10,
  },
  appName: {
    marginTop: 30,
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 1,
  },
});

export default AnimatedSplash;
