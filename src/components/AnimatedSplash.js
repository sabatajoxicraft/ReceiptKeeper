import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import Svg, { Rect, Line, Circle, Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Animated SVG components
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const AnimatedSplash = ({ onAnimationFinish }) => {
  // Animation values
  const paperScale = useRef(new Animated.Value(0)).current;
  const paperOpacity = useRef(new Animated.Value(0)).current;
  const line1Progress = useRef(new Animated.Value(0)).current;
  const line2Progress = useRef(new Animated.Value(0)).current;
  const line3Progress = useRef(new Animated.Value(0)).current;
  const line4Progress = useRef(new Animated.Value(0)).current;
  const circleScale = useRef(new Animated.Value(0)).current;
  const checkProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence of animations
    Animated.sequence([
      // 1. Paper fades in and scales up
      Animated.parallel([
        Animated.timing(paperOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.spring(paperScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: false,
        }),
      ]),
      // 2. Lines draw in sequence
      Animated.stagger(100, [
        Animated.timing(line1Progress, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(line2Progress, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(line3Progress, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(line4Progress, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
      // 3. Circle pops in
      Animated.spring(circleScale, {
        toValue: 1,
        tension: 60,
        friction: 6,
        useNativeDriver: false,
      }),
      // 4. Checkmark draws
      Animated.timing(checkProgress, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
      // 5. Brief pause before finishing
      Animated.delay(300),
    ]).start(() => {
      if (onAnimationFinish) {
        onAnimationFinish();
      }
    });
  }, []);

  // Interpolations for line widths (drawing effect)
  const line1Width = line1Progress.interpolate({
    inputRange: [0, 1],
    outputRange: [55, 145],
  });
  const line2Width = line2Progress.interpolate({
    inputRange: [0, 1],
    outputRange: [55, 130],
  });
  const line3Width = line3Progress.interpolate({
    inputRange: [0, 1],
    outputRange: [55, 140],
  });
  const line4Width = line4Progress.interpolate({
    inputRange: [0, 1],
    outputRange: [55, 120],
  });

  // Checkmark dash animation
  const checkDashOffset = checkProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const logoSize = Math.min(width, height) * 0.5;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: paperOpacity,
            transform: [{ scale: paperScale }],
          },
        ]}
      >
        <Svg width={logoSize} height={logoSize} viewBox="0 0 200 200">
          {/* Receipt Paper */}
          <Rect x="40" y="20" width="120" height="160" rx="8" fill="white" />
          
          {/* Animated Lines */}
          <AnimatedLine
            x1="55"
            y1="50"
            x2={line1Width}
            y2="50"
            stroke="#E0E0E0"
            strokeWidth="3"
          />
          <AnimatedLine
            x1="55"
            y1="70"
            x2={line2Width}
            y2="70"
            stroke="#E0E0E0"
            strokeWidth="3"
          />
          <AnimatedLine
            x1="55"
            y1="90"
            x2={line3Width}
            y2="90"
            stroke="#E0E0E0"
            strokeWidth="3"
          />
          <AnimatedLine
            x1="55"
            y1="110"
            x2={line4Width}
            y2="110"
            stroke="#E0E0E0"
            strokeWidth="3"
          />
          
          {/* Green Circle */}
          <AnimatedCircle
            cx="140"
            cy="140"
            r={circleScale.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 35],
            })}
            fill="#22C55E"
          />
          
          {/* Checkmark */}
          <AnimatedPath
            d="M125 140 L135 150 L158 125"
            stroke="white"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="50"
            strokeDashoffset={checkDashOffset}
          />
        </Svg>
      </Animated.View>
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
  },
});

export default AnimatedSplash;
