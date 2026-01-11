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
      
      if (onCapture) {
        onCapture({ 
          uri: \`file://\${photo.path}\`,
          path: photo.path,
          width: photo.width,
          height: photo.height,
        });
      }
      
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

  const frameWidth = width * 0.8;
  const frameHeight = height * 0.6;
  const frameLeft = (width - frameWidth) / 2;
  const frameTop = (height - frameHeight) / 2 - 50;

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, frameHeight],
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

      <View style={StyleSheet.absoluteFill}>
        <View style={[styles.overlay, { height: frameTop }]} />
        
        <View style={{ flexDirection: 'row', height: frameHeight }}>
          <View style={[styles.overlay, { width: frameLeft }]} />
          <View style={{ width: frameWidth, height: frameHeight }}>
            <View style={styles.frameContainer}>
              <Animated.View style={[styles.corner, styles.cornerTopLeft, { transform: [{ scale: cornerPulseAnim }] }]} />
              <Animated.View style={[styles.corner, styles.cornerTopRight, { transform: [{ scale: cornerPulseAnim }] }]} />
              <Animated.View style={[styles.corner, styles.cornerBottomLeft, { transform: [{ scale: cornerPulseAnim }] }]} />
              <Animated.View style={[styles.corner, styles.cornerBottomRight, { transform: [{ scale: cornerPulseAnim }] }]} />
              
              <View style={[styles.frameLine, styles.frameTop]} />
              <View style={[styles.frameLine, styles.frameRight]} />
              <View style={[styles.frameLine, styles.frameBottom]} />
              <View style={[styles.frameLine, styles.frameLeft]} />
            </View>
            
            {showGuide && (
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [{ translateY: scanLineTranslateY }],
                  },
                ]}
              />
            )}
          </View>
          <View style={[styles.overlay, { flex: 1 }]} />
        </View>
        
        <View style={[styles.overlay, { flex: 1 }]} />
      </View>

      <View style={styles.topBar}>
        <Text style={styles.instructionText}>
          {showGuide 
            ? '📄 Position document within frame' 
            : 'Processing...'}
        </Text>
      </View>

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
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  frameContainer: {
    flex: 1,
    position: 'relative',
  },
  frameLine: {
    position: 'absolute',
    backgroundColor: '#00FF00',
  },
  frameTop: {
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  frameRight: {
    top: 0,
    right: 0,
    bottom: 0,
    width: 3,
  },
  frameBottom: {
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  frameLeft: {
    top: 0,
    left: 0,
    bottom: 0,
    width: 3,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#00FF00',
    borderWidth: 6,
  },
  cornerTopLeft: {
    top: -3,
    left: -3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTopRight: {
    top: -3,
    right: -3,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomLeft: {
    bottom: -3,
    left: -3,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBottomRight: {
    bottom: -3,
    right: -3,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#00FF00',
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
