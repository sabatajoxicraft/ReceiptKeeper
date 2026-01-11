import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { useSharedValue, withTiming, useAnimatedProps } from 'react-native-reanimated';
import { Worklets } from 'react-native-worklets-core';
import { detect } from 'vision-camera-dynamsoft-document-normalizer';
import Svg, { Polygon, Line } from 'react-native-svg';
import Animated from 'react-native-reanimated';
import { APP_COLORS } from '../config/constants';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);
const AnimatedLine = Animated.createAnimatedComponent(Line);

const DocumentScannerScreen = ({ onCapture, onBack }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [detectedCorners, setDetectedCorners] = useState(null);
  const [isDocumentDetected, setIsDocumentDetected] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const device = useCameraDevice('back');

  // Shared values for smooth animation
  const corner1X = useSharedValue(0);
  const corner1Y = useSharedValue(0);
  const corner2X = useSharedValue(0);
  const corner2Y = useSharedValue(0);
  const corner3X = useSharedValue(0);
  const corner3Y = useSharedValue(0);
  const corner4X = useSharedValue(0);
  const corner4Y = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    checkCameraPermission();
    return () => setIsActive(false);
  }, []);

  const checkCameraPermission = async () => {
    const status = await Camera.requestCameraPermission();
    setHasPermission(status === 'granted');
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access to scan documents'
      );
    }
  };

  // Worklet callback for updating corners from frame processor
  const updateCorners = Worklets.createRunInJsFn((corners) => {
    if (corners && corners.length === 4) {
      // Animate corners smoothly
      corner1X.value = withTiming(corners[0].x, { duration: 100 });
      corner1Y.value = withTiming(corners[0].y, { duration: 100 });
      corner2X.value = withTiming(corners[1].x, { duration: 100 });
      corner2Y.value = withTiming(corners[1].y, { duration: 100 });
      corner3X.value = withTiming(corners[2].x, { duration: 100 });
      corner3Y.value = withTiming(corners[2].y, { duration: 100 });
      corner4X.value = withTiming(corners[3].x, { duration: 100 });
      corner4Y.value = withTiming(corners[3].y, { duration: 100 });
      opacity.value = withTiming(1, { duration: 200 });
      
      setDetectedCorners(corners);
      setIsDocumentDetected(true);
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      setIsDocumentDetected(false);
    }
  });

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    try {
      const results = detect(frame);
      if (results && results.length > 0) {
        const quad = results[0].location;
        const corners = [
          { x: quad.points[0].x, y: quad.points[0].y },
          { x: quad.points[1].x, y: quad.points[1].y },
          { x: quad.points[2].x, y: quad.points[2].y },
          { x: quad.points[3].x, y: quad.points[3].y },
        ];
        updateCorners(corners);
      } else {
        updateCorners(null);
      }
    } catch (error) {
      console.error('Frame processor error:', error);
    }
  }, [updateCorners]);

  // Animated props for polygon overlay
  const animatedPolygonProps = useAnimatedProps(() => {
    const points = `${corner1X.value},${corner1Y.value} ${corner2X.value},${corner2Y.value} ${corner3X.value},${corner3Y.value} ${corner4X.value},${corner4Y.value}`;
    return {
      points,
      opacity: opacity.value,
    };
  });

  const handleCapture = useCallback(async () => {
    if (!isDocumentDetected || capturing) return;

    setCapturing(true);
    try {
      // TODO: Implement photo capture with perspective correction
      // For now, just capture the frame
      Alert.alert('Success', 'Document captured! (TODO: implement perspective correction)');
      
      // Call parent callback with corners for processing
      if (onCapture && detectedCorners) {
        onCapture({ corners: detectedCorners });
      }
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Error', 'Failed to capture document');
    } finally {
      setCapturing(false);
    }
  }, [isDocumentDetected, capturing, detectedCorners, onCapture]);

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera permission is required</Text>
        <TouchableOpacity style={styles.button} onPress={onBack}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={APP_COLORS.primary} />
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        frameProcessor={frameProcessor}
        photo={true}
      />

      {/* Animated corner detection overlay */}
      <Svg style={StyleSheet.absoluteFill}>
        <AnimatedPolygon
          animatedProps={animatedPolygonProps}
          stroke="#00FF00"
          strokeWidth={3}
          fill="rgba(0, 255, 0, 0.1)"
        />
      </Svg>

      {/* Top bar with instructions */}
      <View style={styles.topBar}>
        <Text style={styles.instructionText}>
          {isDocumentDetected 
            ? '✓ Document detected - Tap to capture' 
            : 'Position document within frame'}
        </Text>
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.captureButton,
            isDocumentDetected && styles.captureButtonActive,
            capturing && styles.captureButtonDisabled,
          ]}
          onPress={handleCapture}
          disabled={!isDocumentDetected || capturing}>
          {capturing ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : (
            <View style={styles.captureButtonInner} />
          )}
        </TouchableOpacity>

        <View style={styles.placeholder} />
      </View>

      {/* Detection status indicator */}
      <View style={[styles.statusIndicator, isDocumentDetected && styles.statusActive]}>
        <View style={styles.statusDot} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 30,
    paddingBottom: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 15,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  captureButtonActive: {
    backgroundColor: APP_COLORS.primary,
    borderColor: '#00FF00',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
  },
  placeholder: {
    width: 60,
  },
  statusIndicator: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusActive: {
    backgroundColor: 'rgba(0, 255, 0, 0.3)',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 20,
  },
  button: {
    backgroundColor: APP_COLORS.primary,
    padding: 15,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DocumentScannerScreen;
