# React Native Vision Camera OCR Plus - Quick Start Guide

## Installation ✅ Complete

Package `react-native-vision-camera-ocr-plus@1.2.0` has been installed successfully.

---

## Quick Integration (Copy-Paste Ready)

### 1. Request Camera Permission

```javascript
// src/utils/permissions.js
import { PermissionsAndroid } from 'react-native';

export async function requestCameraPermission() {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera Permission Required',
        message: 'ReceiptKeeper needs camera access to scan receipts',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.error('Permission request error:', err);
    return false;
  }
}
```

### 2. Basic OCR Scanner Component

```javascript
// src/screens/ReceiptScanner.js
import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { useTextRecognition } from 'react-native-vision-camera-ocr-plus';
import { runAtTargetFps } from 'react-native-reanimated';

export default function ReceiptScanner({ onScanned }) {
  const [recognizedText, setRecognizedText] = useState('');
  const device = useCameraDevice('back');
  
  // Configure OCR with performance optimization for Android
  const { scanText } = useTextRecognition({
    language: 'latin',
    frameSkipThreshold: 10,        // Process every 10th frame for better performance
    useLightweightMode: true,      // Lightweight mode for Android devices
  });

  // Frame processor for real-time text recognition
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    runAtTargetFps(2, () => {
      const result = scanText(frame);
      
      if (result?.text && result.text.length > 0) {
        runOnJS(setRecognizedText)(result.text);
        runOnJS(onScanned)(result);
      }
    });
  }, []);

  if (!device) {
    return (
      <View style={styles.container}>
        <Text>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
      />
      
      {/* Optional: Display recognized text overlay */}
      {recognizedText && (
        <View style={styles.textOverlay}>
          <Text style={styles.recognizedText}>{recognizedText}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  textOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
  },
  recognizedText: {
    color: '#fff',
    fontSize: 12,
  },
});
```

### 3. Advanced - Scan Specific Region (Receipt Area)

```javascript
// For scanning just the receipt area
const { scanText } = useTextRecognition({
  language: 'latin',
  frameSkipThreshold: 10,
  useLightweightMode: true,
  scanRegion: {
    left: '5%',      // 5% from left edge
    top: '15%',      // 15% from top (receipt usually in center)
    width: '90%',    // 90% of screen width
    height: '70%'    // 70% of screen height
  },
});
```

### 4. Static Photo OCR (From Gallery)

```javascript
// src/utils/photoOCR.js
import { PhotoRecognizer } from 'react-native-vision-camera-ocr-plus';

export async function recognizeTextFromPhoto(photoUri) {
  try {
    const result = await PhotoRecognizer({
      uri: photoUri,
      orientation: 'portrait',
    });
    return result.text;
  } catch (error) {
    console.error('Photo OCR error:', error);
    return null;
  }
}
```

### 5. Add to App.js or Navigation

```javascript
// Example: Add scanner to your app navigation
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ReceiptScanner from './src/screens/ReceiptScanner';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="ReceiptScanner" 
          component={ReceiptScanner}
          options={{ title: 'Scan Receipt' }}
        />
        {/* Add other screens here */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## Available Languages

### Text Recognition (OCR)
- `'latin'` - Default, works for English and most European languages
- `'chinese'` - Simplified/Traditional Chinese
- `'devanagari'` - Hindi and other Indic scripts
- `'japanese'` - Japanese text
- `'korean'` - Korean text

```javascript
// Example: Chinese text recognition
const { scanText } = useTextRecognition({
  language: 'chinese',
  frameSkipThreshold: 10,
  useLightweightMode: true,
});
```

### Translation (ML Kit)
Supports 23+ language pairs:
```javascript
import { Camera } from 'react-native-vision-camera-ocr-plus';

// Real-time translation while scanning
<Camera
  mode="translate"
  options={{ 
    from: 'en',  // English
    to: 'es'     // Spanish
  }}
  callback={(result) => console.log('Translated:', result.text)}
/>
```

---

## Performance Tips for Android

### For Best Performance:
```javascript
const { scanText } = useTextRecognition({
  language: 'latin',
  frameSkipThreshold: 15,      // Lower FPS = better performance
  useLightweightMode: true,    // Reduced accuracy but much faster
});

// Also limit frame processor FPS:
const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  runAtTargetFps(2, () => {    // Process at 2 FPS max
    const result = scanText(frame);
  });
}, []);
```

### For Better Accuracy:
```javascript
const { scanText } = useTextRecognition({
  language: 'latin',
  frameSkipThreshold: 3,       // More processing
  useLightweightMode: false,   // Full detail data
});

// Process more frequently:
const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  runAtTargetFps(10, () => {   // Process at 10 FPS
    const result = scanText(frame);
  });
}, []);
```

---

## Building & Testing

### Build for Android
```bash
npm run android
```

### Build APK (Release)
```bash
cd android && ./gradlew assembleRelease
cd ..
# APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

### Debug APK
```bash
cd android && ./gradlew assembleDebug
cd ..
# APK will be at: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Troubleshooting

### Camera Not Working
```javascript
// 1. Ensure permission is granted
import { requestCameraPermission } from './src/utils/permissions';
const hasPermission = await requestCameraPermission();

// 2. Ensure isActive prop is true
<Camera isActive={true} ... />

// 3. Check if device exists
const device = useCameraDevice('back');
if (!device) return <Text>No camera device found</Text>;
```

### No Text Being Recognized
- Ensure good lighting
- Hold camera steady for 1-2 seconds
- Increase `frameSkipThreshold` to reduce processing overhead
- Reduce `scanRegion` to focus on receipt area

### App Crashing on Scan
- Check Android Studio logcat for errors
- Ensure ML Kit models are downloading (first time is slowest)
- Increase device RAM - clear other apps
- Disable `useLightweightMode` to see if it's a mode issue

### Models Not Downloading
```javascript
// Check internet connection
// Models download on first use (~50-100MB)
// Can take 5-10 seconds on first launch

// To remove cached model:
import { RemoveLanguageModel } from 'react-native-vision-camera-ocr-plus';
await RemoveLanguageModel('latin');
```

---

## Next Steps

1. ✅ Install completed
2. 📱 Implement scanner component
3. 🔧 Request camera permissions
4. 🧪 Test on device
5. 📦 Build and deploy

---

## Additional Resources

- **Full Documentation:** Check `OCRANDFIGURATION_REPORT.md`
- **GitHub Repo:** https://github.com/jamenamcinteer/react-native-vision-camera-ocr-plus
- **Vision Camera Docs:** https://react-native-vision-camera.com/

---

**Ready to scan? Start with the Basic OCR Scanner Component above! 🚀**
