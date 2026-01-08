import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { getSetting } from '../database/database';
import { APP_COLORS, PAYMENT_METHODS } from '../config/constants';
import { saveImageToLocal } from '../utils/fileUtils';
import { saveReceipt } from '../database/database';
import { uploadToOneDrive, buildOneDrivePath } from '../services/onedriveService';
import Toast from 'react-native-toast-message';

const CaptureScreen = ({ onBack }) => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [cards, setCards] = useState([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    const savedCards = await getSetting('payment_cards');
    if (savedCards) {
      setCards(JSON.parse(savedCards));
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'Receipt Keeper needs camera access to capture receipts',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleCapture = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Camera permission is needed to capture receipts');
      return;
    }

    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
        includeBase64: true,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled camera');
        } else if (response.errorCode) {
          Alert.alert('Error', response.errorMessage);
        } else if (response.assets && response.assets[0]) {
          setCapturedImage(response.assets[0]);
        }
      }
    );
  };

  const handleSelectFromGallery = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: true,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled picker');
        } else if (response.errorCode) {
          Alert.alert('Error', response.errorMessage);
        } else if (response.assets && response.assets[0]) {
          setCapturedImage(response.assets[0]);
        }
      }
    );
  };

  const processReceipt = async (paymentMethod, cardName = null) => {
    if (!capturedImage) return;

    setProcessing(true);

    try {
      // Save image locally (both internal and gallery)
      const { filePath, filename, year, month, galleryPath } = await saveImageToLocal(
        capturedImage.base64,
        'jpg'
      );

      // Build OneDrive path
      const onedrivePath = buildOneDrivePath(year, month, filename);

      // Save to database
      await saveReceipt({
        filename,
        filePath,
        onedrivePath,
        paymentMethod,
        cardName,
        year,
        month,
      });

      // Upload to OneDrive (async, don't wait)
      uploadToOneDrive(filePath, onedrivePath)
        .then(() => {
          console.log('Uploaded to OneDrive successfully');
        })
        .catch((error) => {
          console.log('OneDrive upload queued for later:', error.message);
        });

      // Show success message
      const saveLocation = galleryPath 
        ? '📱 Saved to gallery\n☁️ Synced to OneDrive'
        : `☁️ ${onedrivePath}`;
      
      Toast.show({
        type: 'success',
        text1: '✅ Receipt Saved!',
        text2: saveLocation,
        position: 'top',
        visibilityTime: 4000,
      });

      // Reset and go back
      setTimeout(() => {
        setCapturedImage(null);
        setProcessing(false);
        onBack();
      }, 1000);
    } catch (error) {
      setProcessing(false);
      Alert.alert('Error', 'Failed to save receipt: ' + error.message);
    }
  };

  const handleCash = () => {
    processReceipt(PAYMENT_METHODS.CASH);
  };

  const handleCard = (card) => {
    processReceipt(PAYMENT_METHODS.CARD, card.name);
  };

  return (
    <View style={styles.container}>
      {!capturedImage ? (
        <View style={styles.captureContainer}>
          <Text style={styles.title}>📸 Capture Receipt</Text>

          <TouchableOpacity style={styles.cameraButton} onPress={handleCapture}>
            <Text style={styles.cameraButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.galleryButton} onPress={handleSelectFromGallery}>
            <Text style={styles.galleryButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.reviewContainer}>
          <Text style={styles.title}>Review & Save</Text>

          <Image source={{ uri: capturedImage.uri }} style={styles.preview} />

          {processing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color={APP_COLORS.primary} />
              <Text style={styles.processingText}>Saving receipt...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Select Payment Method:</Text>

              <TouchableOpacity style={styles.cashButton} onPress={handleCash}>
                <Text style={styles.paymentButtonText}>💵 Cash</Text>
              </TouchableOpacity>

              <View style={styles.cardButtons}>
                {cards.map((card) => (
                  <TouchableOpacity
                    key={card.id}
                    style={[styles.cardButton, { borderColor: card.color }]}
                    onPress={() => handleCard(card)}>
                    <Text style={styles.paymentButtonText}>💳 {card.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.retakeButton}
                onPress={() => setCapturedImage(null)}>
                <Text style={styles.retakeButtonText}>Retake Photo</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  captureContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  reviewContainer: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: APP_COLORS.text,
  },
  cameraButton: {
    backgroundColor: APP_COLORS.primary,
    padding: 20,
    borderRadius: 15,
    width: '80%',
    alignItems: 'center',
    marginBottom: 15,
  },
  cameraButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  galleryButton: {
    backgroundColor: APP_COLORS.secondary,
    padding: 20,
    borderRadius: 15,
    width: '80%',
    alignItems: 'center',
    marginBottom: 15,
  },
  galleryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 20,
    padding: 15,
  },
  backButtonText: {
    color: APP_COLORS.textSecondary,
    fontSize: 16,
  },
  preview: {
    width: '100%',
    height: 400,
    borderRadius: 10,
    marginBottom: 20,
    resizeMode: 'contain',
    backgroundColor: '#000',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: APP_COLORS.text,
  },
  cashButton: {
    backgroundColor: APP_COLORS.success,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  cardButtons: {
    marginBottom: 15,
  },
  cardButton: {
    backgroundColor: APP_COLORS.surface,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
  },
  paymentButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  retakeButton: {
    marginTop: 10,
    padding: 15,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: APP_COLORS.textSecondary,
    fontSize: 16,
  },
  processingContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  processingText: {
    marginTop: 15,
    fontSize: 16,
    color: APP_COLORS.textSecondary,
  },
});

export default CaptureScreen;
