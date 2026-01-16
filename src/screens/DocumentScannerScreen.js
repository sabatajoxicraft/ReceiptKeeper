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
  Modal,
} from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { useTextRecognition } from 'react-native-vision-camera-ocr-plus';
import { PhotoRecognizer } from 'react-native-vision-camera-ocr-plus';
import { runAtTargetFps, runOnJS } from 'react-native-reanimated';
import { APP_COLORS } from '../config/constants';
import { extractAll } from '../utils/ocrFieldExtractor';

const { width, height } = Dimensions.get('window');

const DocumentScannerScreen = ({ onCapture, onBack }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [liveOcrText, setLiveOcrText] = useState('');
  const [ocrConfidence, setOcrConfidence] = useState(0);
  const [extractedFields, setExtractedFields] = useState(null);
  const [showOcrOverlay, setShowOcrOverlay] = useState(false);
  
  const camera = useRef(null);
  const device = useCameraDevice('back');
  const edgePulseAnim = useRef(new Animated.Value(1)).current;
  
  // OCR Configuration for real-time text recognition
  const { scanText } = useTextRecognition({
    language: 'latin',
    frameSkipThreshold: 10, // Process every 10th frame for performance
    useLightweightMode: true, // Optimized for Android
  });

  useEffect(() => {
    checkCameraPermission();
    startEdgeAnimation();
    return () => setIsActive(false);
  }, []);

  // Frame processor for real-time OCR (runs on camera frames)
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    runAtTargetFps(2, () => {
      try {
        const result = scanText(frame);
        
        if (result?.text && result.text.length > 10) {
          runOnJS(setLiveOcrText)(result.text);
          
          // Calculate confidence based on text length and quality
          const confidence = Math.min(0.8, result.text.length / 500);
          runOnJS(setOcrConfidence)(confidence);
          
          // Show OCR overlay if we have meaningful text
          if (result.text.length > 50) {
            runOnJS(setShowOcrOverlay)(true);
          }
        }
      } catch (error) {
        console.warn('Frame processor error:', error);
      }
    });
  }, [scanText]);

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
    setProcessing(true);
    
    try {
      console.log('📸 Capturing photo...');
      const photo = await camera.current.takePhoto({
        qualityPrioritization: 'balanced',
        flash: 'off',
      });
      
      const photoUri = `file://${photo.path}`;
      console.log('✅ Photo captured:', photoUri);

      // Step 1: Extract OCR text from captured photo
      console.log('🔍 Running OCR on captured photo...');
      let ocrText = '';
      try {
        const ocrResult = await PhotoRecognizer({
          uri: photoUri,
          orientation: 'portrait',
        });
        ocrText = ocrResult?.text || '';
        console.log('✅ OCR completed, text length:', ocrText.length);
        console.log('Raw OCR text:', ocrText.substring(0, 200) + '...');
      } catch (ocrError) {
        console.warn('⚠️ OCR failed, continuing without extraction:', ocrError);
        ocrText = liveOcrText; // Fall back to live OCR text
      }

      // Step 2: Extract structured fields from OCR text
      console.log('📋 Extracting fields from OCR text...');
      let extractedData = null;
      if (ocrText && ocrText.length > 10) {
        try {
          extractedData = extractAll(ocrText);
          console.log('✅ Field extraction complete:', {
            date: extractedData.date,
            amount: extractedData.amount,
            vendor: extractedData.vendor,
            invoiceNumber: extractedData.invoiceNumber,
            tax: extractedData.tax,
          });
        } catch (extractError) {
          console.warn('⚠️ Field extraction failed:', extractError);
          extractedData = null;
        }
      }

      // Step 3: Pass data to parent with OCR information
      console.log('📤 Sending capture data to parent screen...');
      if (onCapture) {
        onCapture({
          uri: photoUri,
          path: photo.path,
          width: photo.width,
          height: photo.height,
          ocrText: ocrText,
          extractedFields: extractedData,
          timestamp: new Date().toISOString(),
        });
      }
      
      setTimeout(() => {
        onBack();
      }, 500);
    } catch (error) {
      console.error('❌ Capture error:', error);
      Alert.alert('Error', 'Failed to capture document: ' + error.message);
      setShowGuide(true);
    } finally {
      setCapturing(false);
      setProcessing(false);
    }
  }, [capturing, onCapture, onBack, liveOcrText]);

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
        frameProcessor={frameProcessor}
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
          {processing 
            ? '🔍 Processing OCR...' 
            : showGuide 
            ? '📄 Position document within frame' 
            : 'Processing...'}
        </Text>
        
        {/* OCR Confidence indicator */}
        {ocrConfidence > 0 && !processing && (
          <View style={styles.confidenceIndicator}>
            <Text style={styles.confidenceText}>
              OCR Confidence: {Math.round(ocrConfidence * 100)}%
            </Text>
            <View style={styles.confidenceBar}>
              <View
                style={[
                  styles.confidenceFill,
                  {
                    width: `${ocrConfidence * 100}%`,
                    backgroundColor: ocrConfidence > 0.7 ? '#00FF00' : '#FFaa00',
                  },
                ]}
              />
            </View>
          </View>
        )}
      </View>

      {/* OCR Text Overlay */}
      <Modal
        visible={showOcrOverlay && liveOcrText.length > 0 && !processing}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOcrOverlay(false)}>
        <View style={styles.ocrOverlayContainer}>
          <TouchableOpacity
            style={styles.ocrOverlayClose}
            onPress={() => setShowOcrOverlay(false)}>
            <Text style={styles.ocrOverlayCloseText}>✕</Text>
          </TouchableOpacity>
          
          <Text style={styles.ocrOverlayTitle}>📋 Detected Text</Text>
          
          <View style={styles.ocrOverlayContent}>
            <Text style={styles.ocrOverlayText}>{liveOcrText}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.ocrOverlayButton}
            onPress={() => setShowOcrOverlay(false)}>
            <Text style={styles.ocrOverlayButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} disabled={processing || capturing}>
          <Text style={styles.backButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.captureButton,
            (capturing || processing) && styles.captureButtonDisabled,
          ]}
          onPress={handleCapture}
          disabled={capturing || processing}>
          {capturing || processing ? (
            <View style={styles.processingIndicator}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.processingLabel}>
                {processing ? 'OCR' : 'Snap'}
              </Text>
            </View>
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
  confidenceIndicator: {
    marginTop: 15,
    paddingHorizontal: 10,
  },
  confidenceText: {
    color: '#00FF00',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
    textAlign: 'center',
  },
  confidenceBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 2,
  },
  ocrOverlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  ocrOverlayClose: {
    position: 'absolute',
    top: 30,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ocrOverlayCloseText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  ocrOverlayTitle: {
    color: '#00FF00',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  ocrOverlayContent: {
    flex: 1,
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
  },
  ocrOverlayText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 22,
  },
  ocrOverlayButton: {
    backgroundColor: '#00FF00',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  ocrOverlayButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
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
  processingIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 5,
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
