import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

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

export const saveImageToLocal = async (base64Data, extension = 'jpg') => {
  try {
    const { year, month } = getYearMonth();
    const filename = `${formatDateTime()}.${extension}`;
    
    // Create directory structure
    const baseDir = `${RNFS.DocumentDirectoryPath}/receipts/${year}/${month}`;
    await RNFS.mkdir(baseDir, { intermediate: true });
    
    const filePath = `${baseDir}/${filename}`;
    
    // Save image
    await RNFS.writeFile(filePath, base64Data, 'base64');
    
    // Create metadata file
    const metadata = {
      filename,
      captureDate: new Date().toISOString(),
      year,
      month,
    };
    
    const metadataPath = `${baseDir}/${formatDateTime()}.json`;
    await RNFS.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
    
    return {
      filePath,
      filename,
      year,
      month,
      metadataPath,
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
