import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import Svg, { Rect, Line } from 'react-native-svg';
import { APP_COLORS } from '../config/constants';

const { width, height } = Dimensions.get('window');

const DocumentScannerScreen = ({ onCapture, onBack }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  
  const camera = useRef(null);
  const device = useCameraDevice('back');
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const cornerPulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkCameraPermission();
    startScanAnimation();
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

  const startScanAnimation = () => {
    // Animated scanning line that moves up and down
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulsing corner markers
    Animated.loop(
      Animated.sequence([
        Animated.timing(cornerPulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(cornerPulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleCapture = useCallback(async () => {
    if (capturing || !camera.current) return;

    setCapturing(true);
    setShowGuide(false);
    
    try {
      const photo = await camera.current.takePhoto({
        qualityPrioritization: 'balanced',
        flash: 'off',
      });
      
      console.log('Photo captured:', photo.path);
      
      // Call parent callback with photo data
      if (onCapture) {
        onCapture({ 
          uri: `file://${photo.path}`,
          path: photo.path,
          width: photo.width,
          height: photo.height,
        });
      }
      
      // Small delay before going back
      setTimeout(() => {
        onBack();
      }, 500);
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Error', 'Failed to capture document: ' + error.message);
      setShowGuide(true);
    } finally {
      setCapturing(false);
    }
  }, [capturing, onCapture, onBack]);

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

  // Document frame dimensions
  const frameWidth = width * 0.8;
  const frameHeight = height * 0.6;
  const frameLeft = (width - frameWidth) / 2;
  const frameTop = (height - frameHeight) / 2 - 50;

  // Scanning line position
  const scanLineY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [frameTop, frameTop + frameHeight],
  });

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        photo={true}
      />

      {/* Dark overlay with transparent frame */}
      <Svg style={StyleSheet.absoluteFill}>
        {/* Top overlay */}
        <Rect x={0} y={0} width={width} height={frameTop} fill="rgba(0,0,0,0.6)" />
        {/* Left overlay */}
        <Rect x={0} y={frameTop} width={frameLeft} height={frameHeight} fill="rgba(0,0,0,0.6)" />
        {/* Right overlay */}
        <Rect x={frameLeft + frameWidth} y={frameTop} width={frameLeft} height={frameHeight} fill="rgba(0,0,0,0.6)" />
        {/* Bottom overlay */}
        <Rect x={0} y={frameTop + frameHeight} width={width} height={height - (frameTop + frameHeight)} fill="rgba(0,0,0,0.6)" />

        {/* Frame border */}
        <Line x1={frameLeft} y1={frameTop} x2={frameLeft + frameWidth} y2={frameTop} stroke="#00FF00" strokeWidth={3} />
        <Line x1={frameLeft + frameWidth} y1={frameTop} x2={frameLeft + frameWidth} y2={frameTop + frameHeight} stroke="#00FF00" strokeWidth={3} />
        <Line x1={frameLeft + frameWidth} y1={frameTop + frameHeight} x2={frameLeft} y2={frameTop + frameHeight} stroke="#00FF00" strokeWidth={3} />
        <Line x1={frameLeft} y1={frameTop + frameHeight} x2={frameLeft} y2={frameTop} stroke="#00FF00" strokeWidth={3} />

        {/* Corner markers */}
        {/* Top-left */}
        <Line x1={frameLeft} y1={frameTop} x2={frameLeft + 40} y2={frameTop} stroke="#00FF00" strokeWidth={6} />
        <Line x1={frameLeft} y1={frameTop} x2={frameLeft} y2={frameTop + 40} stroke="#00FF00" strokeWidth={6} />
        
        {/* Top-right */}
        <Line x1={frameLeft + frameWidth} y1={frameTop} x2={frameLeft + frameWidth - 40} y2={frameTop} stroke="#00FF00" strokeWidth={6} />
        <Line x1={frameLeft + frameWidth} y1={frameTop} x2={frameLeft + frameWidth} y2={frameTop + 40} stroke="#00FF00" strokeWidth={6} />
        
        {/* Bottom-left */}
        <Line x1={frameLeft} y1={frameTop + frameHeight} x2={frameLeft + 40} y2={frameTop + frameHeight} stroke="#00FF00" strokeWidth={6} />
        <Line x1={frameLeft} y1={frameTop + frameHeight} x2={frameLeft} y2={frameTop + frameHeight - 40} stroke="#00FF00" strokeWidth={6} />
        
        {/* Bottom-right */}
        <Line x1={frameLeft + frameWidth} y1={frameTop + frameHeight} x2={frameLeft + frameWidth - 40} y2={frameTop + frameHeight} stroke="#00FF00" strokeWidth={6} />
        <Line x1={frameLeft + frameWidth} y1={frameTop + frameHeight} x2={frameLeft + frameWidth} y2={frameTop + frameHeight - 40} stroke="#00FF00" strokeWidth={6} />
      </Svg>

      {/* Animated scanning line */}
      {showGuide && (
        <Animated.View
          style={[
            styles.scanLine,
            {
              transform: [{ translateY: scanLineY }],
              left: frameLeft,
              width: frameWidth,
            },
          ]}
        />
      )}

      {/* Top bar with instructions */}
      <View style={styles.topBar}>
        <Text style={styles.instructionText}>
          {showGuide 
            ? '📄 Position document within frame' 
            : 'Processing...'}
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
            capturing && styles.captureButtonDisabled,
          ]}
          onPress={handleCapture}
          disabled={capturing}>
          {capturing ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : (
            <View style={styles.captureButtonInner} />
          )}
        </TouchableOpacity>

        <View style={styles.placeholder} />
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
  scanLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#00FF00',
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    backgroundColor: APP_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
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
