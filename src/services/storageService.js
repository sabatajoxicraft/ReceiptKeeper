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
    const years = await RNFS.readDir(basePath);
    for (const yearDir of years) {
      if (yearDir.isDirectory()) {
        const year = yearDir.name;
        
        // 4. Scan Months
        const months = await RNFS.readDir(yearDir.path);
        for (const monthDir of months) {
          if (monthDir.isDirectory()) {
            const month = monthDir.name;
            
            // 5. Scan Files
            const files = await RNFS.readDir(monthDir.path);
            for (const file of files) {
              if (file.isFile() && !knownPaths.has(file.path)) {
                // Found a missing file!
                console.log(`Found missing receipt: ${file.path}`);
                
                // Add to DB
                // We default to 'cash' since we don't know payment method
                // We default to 'pending' upload status
                // We assume filename format matches our convention, but use file.name regardless
                
                await saveReceipt({
                  filename: file.name,
                  filePath: file.path,
                  onedrivePath: `/${year}/${month}/${file.name}`, // Reconstruct expected remote path
                  paymentMethod: 'cash', // Default
                  cardName: null,
                  year: year,
                  month: month
                });
                
                newReceiptsCount++;
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
