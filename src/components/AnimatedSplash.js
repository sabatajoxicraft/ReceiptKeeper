import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

const AnimatedSplash = ({ onAnimationFinish }) => {
  // Animation values
  const paperScale = useRef(new Animated.Value(0)).current;
  const paperOpacity = useRef(new Animated.Value(0)).current;
  const line1Width = useRef(new Animated.Value(0)).current;
  const line2Width = useRef(new Animated.Value(0)).current;
  const line3Width = useRef(new Animated.Value(0)).current;
  const line4Width = useRef(new Animated.Value(0)).current;
  const checkBadgeScale = useRef(new Animated.Value(0)).current;
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  const appNameOpacity = useRef(new Animated.Value(0)).current;
  const appNameTranslate = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Paper scales up from nothing (500ms)
      Animated.parallel([
        Animated.timing(paperOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(paperScale, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      
      // 2. Pause to let user see the paper
      Animated.delay(200),
      
      // 3. Lines draw in one by one (clearly visible)
      Animated.timing(line1Width, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(line2Width, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(line3Width, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(line4Width, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      
      // 4. Pause before checkmark
      Animated.delay(150),
      
      // 5. Green circle badge pops in with overshoot
      Animated.spring(checkBadgeScale, {
        toValue: 1,
        tension: 80,
        friction: 5,
        useNativeDriver: true,
      }),
      
      // 6. Brief pause
      Animated.delay(100),
      
      // 7. Checkmark fades in
      Animated.timing(checkmarkOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      
      // 8. App name slides up and fades in
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(appNameOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(appNameTranslate, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      
      // 9. Hold for user to appreciate
      Animated.delay(600),
    ]).start(() => {
      if (onAnimationFinish) {
        onAnimationFinish();
      }
    });
  }, []);

  const logoSize = Math.min(width, height) * 0.4;
  const paperWidth = logoSize * 0.6;
  const paperHeight = logoSize * 0.85;
  const lineMaxWidth = paperWidth - 40;

  return (
    <View style={styles.container}>
      {/* Animated Receipt Paper */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: paperOpacity,
            transform: [{ scale: paperScale }],
          },
        ]}
      >
        <View style={[styles.paper, { width: paperWidth, height: paperHeight }]}>
          {/* Animated Lines */}
          <Animated.View
            style={[
              styles.line,
              {
                width: line1Width.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, lineMaxWidth * 0.9],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.line,
              {
                width: line2Width.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, lineMaxWidth * 0.65],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.line,
              {
                width: line3Width.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, lineMaxWidth * 0.8],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.line,
              {
                width: line4Width.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, lineMaxWidth * 0.5],
                }),
              },
            ]}
          />
        </View>
        
        {/* Green checkmark badge */}
        <Animated.View
          style={[
            styles.checkBadge,
            {
              transform: [{ scale: checkBadgeScale }],
              right: -5,
              bottom: -5,
            },
          ]}
        >
          <Animated.View style={[styles.checkmark, { opacity: checkmarkOpacity }]}>
            <View style={styles.checkShort} />
            <View style={styles.checkLong} />
          </Animated.View>
        </Animated.View>
      </Animated.View>
      
      {/* App name */}
      <Animated.Text
        style={[
          styles.appName,
          {
            opacity: appNameOpacity,
            transform: [{ translateY: appNameTranslate }],
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
    paddingTop: 25,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  line: {
    height: 5,
    backgroundColor: '#D1D5DB',
    borderRadius: 3,
    marginVertical: 10,
  },
  checkBadge: {
    position: 'absolute',
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  checkmark: {
    width: 28,
    height: 28,
    position: 'relative',
  },
  checkShort: {
    position: 'absolute',
    width: 10,
    height: 4,
    backgroundColor: 'white',
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
    left: 3,
    top: 14,
  },
  checkLong: {
    position: 'absolute',
    width: 18,
    height: 4,
    backgroundColor: 'white',
    borderRadius: 2,
    transform: [{ rotate: '-45deg' }],
    left: 8,
    top: 11,
  },
  appName: {
    marginTop: 40,
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
});

export default AnimatedSplash;
