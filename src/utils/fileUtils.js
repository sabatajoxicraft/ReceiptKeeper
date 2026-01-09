import RNFS from 'react-native-fs';
import { getSetting } from '../database/database';

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
 * Save image to user-configured local path
 */
export const saveImageToLocal = async (base64Data, extension = 'jpg') => {
  try {
    const { year, month } = getYearMonth();
    const filename = `${formatDateTime()}.${extension}`;
    
    // Get user-configured path from settings
    const userPath = await getSetting('local_receipts_path');
    const basePath = userPath || `${RNFS.DownloadDirectoryPath}/ReceiptKeeper`;
    
    // Save to [UserPath]/YYYY/MM/ folder
    const baseDir = `${basePath}/${year}/${month}`;
    console.log('Creating directory:', baseDir);
    await RNFS.mkdir(baseDir, { intermediate: true });
    
    const filePath = `${baseDir}/${filename}`;
    console.log('Writing file:', filePath);
    await RNFS.writeFile(filePath, base64Data, 'base64');
    
    console.log('✅ Image saved successfully to:', filePath);
    
    return {
      filePath,
      filename,
      year,
      month,
    };
  } catch (error) {
    console.error('❌ Error saving image:', error);
    throw error;
  }
};
