import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

const AnimatedSplash = ({ onAnimationFinish }) => {
  const animationRef = useRef(null);

  useEffect(() => {
    // Start the animation
    if (animationRef.current) {
      animationRef.current.play();
    }
  }, []);

  return (
    <View style={styles.container}>
      <LottieView
        ref={animationRef}
        source={require('../../assets/splash_animation.json')}
        style={styles.animation}
        autoPlay
        loop={false}
        speed={1}
        onAnimationFinish={onAnimationFinish}
      />
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
  animation: {
    width: Math.min(width, height) * 0.6,
    height: Math.min(width, height) * 0.6,
  },
});

export default AnimatedSplash;
