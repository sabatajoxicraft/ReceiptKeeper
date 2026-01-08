import RNFS from 'react-native-fs';
import { Platform, PermissionsAndroid } from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';

export const formatDateTime = (date = new Date()) => {
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${day}-${hours}${minutes}${seconds}`;
};

export const getYearMonth = (date = new Date()) => {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  return { year, month };
};

/**
 * Request storage permission for Android
 */
const requestStoragePermission = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission',
        message: 'Receipt Keeper needs storage access to save receipts to gallery',
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
};

/**
 * Save image to public gallery folder (Pictures/ReceiptKeeper)
 */
const saveToGallery = async (base64Data, filename) => {
  try {
    // For Android, save to public Pictures/ReceiptKeeper folder
    if (Platform.OS === 'android') {
      // Check permission
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        console.log('Storage permission denied, skipping gallery save');
        return null;
      }

      // Create ReceiptKeeper folder in Pictures
      const picturesPath = RNFS.PicturesDirectoryPath || '/storage/emulated/0/Pictures';
      const receiptKeeperPath = `${picturesPath}/ReceiptKeeper`;
      
      // Create directory if it doesn't exist
      const dirExists = await RNFS.exists(receiptKeeperPath);
      if (!dirExists) {
        await RNFS.mkdir(receiptKeeperPath);
      }

      // Save image to gallery folder
      const galleryFilePath = `${receiptKeeperPath}/${filename}`;
      await RNFS.writeFile(galleryFilePath, base64Data, 'base64');
      
      console.log(`Saved to gallery: ${galleryFilePath}`);
      return galleryFilePath;
    }
    
    return null;
  } catch (error) {
    console.error('Error saving to gallery:', error);
    return null;
  }
};

export const saveImageToLocal = async (base64Data, extension = 'jpg') => {
  try {
    const { year, month } = getYearMonth();
    const filename = `${formatDateTime()}.${extension}`;
    
    // 1. Save to internal app storage (private)
    const baseDir = `${RNFS.DocumentDirectoryPath}/receipts/${year}/${month}`;
    await RNFS.mkdir(baseDir, { intermediate: true });
    
    const filePath = `${baseDir}/${filename}`;
    await RNFS.writeFile(filePath, base64Data, 'base64');
    
    // 2. Save to public gallery folder (Pictures/ReceiptKeeper)
    const galleryPath = await saveToGallery(base64Data, filename);
    
    // Create metadata file
    const metadata = {
      filename,
      captureDate: new Date().toISOString(),
      year,
      month,
      galleryPath,
    };
    
    const metadataPath = `${baseDir}/${formatDateTime()}.json`;
    await RNFS.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
    
    return {
      filePath,
      filename,
      year,
      month,
      metadataPath,
      galleryPath,
    };
  } catch (error) {
    console.error('Error saving image:', error);
    throw error;
  }
};

export const deleteFile = async (filePath) => {
  try {
    const exists = await RNFS.exists(filePath);
    if (exists) {
      await RNFS.unlink(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

export const getFileInfo = async (filePath) => {
  try {
    const stat = await RNFS.stat(filePath);
    return {
      size: stat.size,
      isFile: stat.isFile(),
      modificationTime: stat.mtime,
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    return null;
  }
};
