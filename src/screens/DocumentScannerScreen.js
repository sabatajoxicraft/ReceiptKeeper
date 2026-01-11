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
  const edgePulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkCameraPermission();
    startEdgeAnimation();
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

  const startEdgeAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(edgePulseAnim, {
          toValue: 1.05,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(edgePulseAnim, {
          toValue: 1,
          duration: 1200,
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
          uri: `file://${photo.path}`,
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

  const frameWidth = width * 0.85;
  const frameHeight = height * 0.65;
  const frameLeft = (width - frameWidth) / 2;
  const frameTop = (height - frameHeight) / 2 - 50;
  const lineLength = 60;

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        photo={true}
      />

      {/* Dark overlay */}
      <View style={StyleSheet.absoluteFill}>
        <View style={[styles.overlay, { height: frameTop }]} />
        
        <View style={{ flexDirection: 'row', height: frameHeight }}>
          <View style={[styles.overlay, { width: frameLeft }]} />
          <View style={{ width: frameWidth, height: frameHeight }}>
            {/* Corner edge lines only - 4 corners */}
            <View style={styles.frameContainer}>
              {/* Top-left corner */}
              <Animated.View style={[styles.edgeLineHorizontal, { top: 0, left: 0, width: lineLength, transform: [{ scaleX: edgePulseAnim }] }]} />
              <Animated.View style={[styles.edgeLineVertical, { top: 0, left: 0, height: lineLength, transform: [{ scaleY: edgePulseAnim }] }]} />
              
              {/* Top-right corner */}
              <Animated.View style={[styles.edgeLineHorizontal, { top: 0, right: 0, width: lineLength, transform: [{ scaleX: edgePulseAnim }] }]} />
              <Animated.View style={[styles.edgeLineVertical, { top: 0, right: 0, height: lineLength, transform: [{ scaleY: edgePulseAnim }] }]} />
              
              {/* Bottom-left corner */}
              <Animated.View style={[styles.edgeLineHorizontal, { bottom: 0, left: 0, width: lineLength, transform: [{ scaleX: edgePulseAnim }] }]} />
              <Animated.View style={[styles.edgeLineVertical, { bottom: 0, left: 0, height: lineLength, transform: [{ scaleY: edgePulseAnim }] }]} />
              
              {/* Bottom-right corner */}
              <Animated.View style={[styles.edgeLineHorizontal, { bottom: 0, right: 0, width: lineLength, transform: [{ scaleX: edgePulseAnim }] }]} />
              <Animated.View style={[styles.edgeLineVertical, { bottom: 0, right: 0, height: lineLength, transform: [{ scaleY: edgePulseAnim }] }]} />
            </View>
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
  edgeLineHorizontal: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#00FF00',
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  edgeLineVertical: {
    position: 'absolute',
    width: 4,
    backgroundColor: '#00FF00',
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
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
