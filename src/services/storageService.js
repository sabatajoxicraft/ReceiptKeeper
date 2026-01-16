import RNFS from 'react-native-fs';
import { getSetting, getDatabase, saveReceipt } from '../database/database';

/**
 * Scan local storage for receipts that are not in the database
 * Returns count of new receipts added
 */
export const scanForMissingReceipts = async () => {
  try {
    console.log('=== STARTING STORAGE SCAN ===');
    const db = getDatabase();
    
    // 1. Get all known file paths from DB
    const results = await db.executeSql('SELECT file_path FROM receipts');
    const knownPaths = new Set();
    for (let i = 0; i < results[0].rows.length; i++) {
      knownPaths.add(results[0].rows.item(i).file_path);
    }
    console.log(`Found ${knownPaths.size} known receipts in DB`);

    // 2. Get base path
    const userPath = await getSetting('local_receipts_path');
    const basePath = userPath || `${RNFS.DownloadDirectoryPath}/ReceiptKeeper`;
    
    const exists = await RNFS.exists(basePath);
    if (!exists) {
      console.log('Base directory does not exist, nothing to scan');
      return 0;
    }

    let newReceiptsCount = 0;

    // 3. Scan Years
    console.log(`Scanning base path: ${basePath}`);
    const years = await RNFS.readDir(basePath);
    for (const yearDir of years) {
      if (yearDir.isDirectory() && /^\d{4}$/.test(yearDir.name)) {
        const year = yearDir.name;
        
        // 4. Scan Months
        const months = await RNFS.readDir(yearDir.path);
        for (const monthDir of months) {
          if (monthDir.isDirectory() && /^\d{2}$/.test(monthDir.name)) {
            const month = monthDir.name;
            
            // 5. Scan Files
            const files = await RNFS.readDir(monthDir.path);
            for (const file of files) {
              // Regex for DD-HHMMSS.jpg (or .JPG)
              // D = digit, H = digit, M = digit, S = digit
              // Format: 09-220740.jpg
              const filenameRegex = /^\d{2}-\d{6}\.(jpg|jpeg)$/i;
              
              if (file.isFile() && filenameRegex.test(file.name)) {
                // Check if we already have this EXACT path in DB
                if (knownPaths.has(file.path)) {
                  continue;
                }

                // Found a missing file!
                console.log(`Found missing receipt: ${file.path}`);
                
                // Add to DB
                await saveReceipt({
                  filename: file.name,
                  filePath: file.path,
                  onedrivePath: `/${year}/${month}/${file.name}`,
                  paymentMethod: 'cash', // Default
                  cardName: null,
                  year: year,
                  month: month
                });
                
                newReceiptsCount++;
              } else if (file.isFile()) {
                 console.log(`Skipping invalid format file: ${file.name}`);
              }
            }
          }
        }
      }
    }
    
    console.log(`=== SCAN COMPLETE: Added ${newReceiptsCount} new receipts ===`);
    return newReceiptsCount;

  } catch (error) {
    console.error('Error scanning storage:', error);
    return 0;
  }
};
