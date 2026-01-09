import RNFS from 'react-native-fs';

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
 * Save image to Downloads/ReceiptKeeper folder ONLY
 * Simple, clean, no permissions needed on Android 10+
 */
export const saveImageToLocal = async (base64Data, extension = 'jpg') => {
  try {
    const { year, month } = getYearMonth();
    const filename = `${formatDateTime()}.${extension}`;
    
    // Save to Downloads/ReceiptKeeper/YYYY/MM/ folder
    const baseDir = `${RNFS.DownloadDirectoryPath}/ReceiptKeeper/${year}/${month}`;
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
