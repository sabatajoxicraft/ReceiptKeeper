/**
 * Error Logging Service
 * Logs errors to a user-configured path
 */

import RNFS from 'react-native-fs';
import { getSetting } from '../database/database';

/**
 * Get log file path from settings
 */
const getLogFilePath = async () => {
  const userPath = await getSetting('local_logs_path');
  const basePath = userPath || `${RNFS.DownloadDirectoryPath}/ReceiptKeeper/Logs`;
  
  // Ensure directory exists
  const dirExists = await RNFS.exists(basePath);
  if (!dirExists) {
    await RNFS.mkdir(basePath, { intermediate: true });
  }
  
  return `${basePath}/error_log.txt`;
};

const MAX_LOG_SIZE = 100000; // 100KB max

/**
 * Write log entry to file
 */
export const logError = async (source, error, message = '', additionalInfo = {}) => {
  try {
    const LOG_FILE = await getLogFilePath();
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    
    const logEntry = `
===========================================
TIME: ${timestamp}
SOURCE: ${source}
MESSAGE: ${message}
ERROR: ${errorMessage}
STACK: ${stack}
INFO: ${JSON.stringify(additionalInfo, null, 2)}
===========================================

`;

    // Check file size
    const fileExists = await RNFS.exists(LOG_FILE);
    if (fileExists) {
      const stats = await RNFS.stat(LOG_FILE);
      if (stats.size > MAX_LOG_SIZE) {
        // Keep last 50KB
        const content = await RNFS.readFile(LOG_FILE, 'utf8');
        const truncated = content.slice(-50000);
        await RNFS.writeFile(LOG_FILE, truncated, 'utf8');
      }
    }

    // Append log
    await RNFS.appendFile(LOG_FILE, logEntry, 'utf8');
  } catch (err) {
    console.error('Failed to write log:', err);
  }
};

/**
 * Log info message
 */
export const logInfo = async (source, message, additionalInfo = {}) => {
  try {
    const LOG_FILE = await getLogFilePath();
    const timestamp = new Date().toISOString();
    
    const logEntry = `[${timestamp}] [${source}] ${message} ${JSON.stringify(additionalInfo)}\n`;
    
    await RNFS.appendFile(LOG_FILE, logEntry, 'utf8');
  } catch (err) {
    console.error('Failed to write info log:', err);
  }
};

/**
 * Get log content
 */
export const getLog = async () => {
  try {
    const LOG_FILE = await getLogFilePath();
    const exists = await RNFS.exists(LOG_FILE);
    if (!exists) return 'No logs yet';
    
    return await RNFS.readFile(LOG_FILE, 'utf8');
  } catch (error) {
    return `Error reading log: ${error.message}`;
  }
};

/**
 * Clear log file
 */
export const clearLog = async () => {
  try {
    const LOG_FILE = await getLogFilePath();
    await RNFS.writeFile(LOG_FILE, '', 'utf8');
  } catch (error) {
    console.error('Error clearing log:', error);
  }
};

/**
 * Export log to public location
 */
export const exportLog = async () => {
  try {
    const LOG_FILE = await getLogFilePath();
    const content = await getLog();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Get user receipts path to export to same location
    const userPath = await getSetting('local_receipts_path');
    const basePath = userPath || `${RNFS.DownloadDirectoryPath}/ReceiptKeeper`;
    
    const exportPath = `${basePath}/error_log_${timestamp}.txt`;
    await RNFS.writeFile(exportPath, content, 'utf8');
    
    return exportPath;
  } catch (error) {
    throw new Error(`Failed to export log: ${error.message}`);
  }
};
