/**
 * Error Logging Service
 * Logs errors to a file for debugging
 */

import RNFS from 'react-native-fs';

const LOG_FILE = `${RNFS.DocumentDirectoryPath}/error_log.txt`;
const MAX_LOG_SIZE = 100000; // 100KB max

/**
 * Write log entry to file
 */
export const logError = async (source, error, additionalInfo = {}) => {
  try {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    
    const logEntry = `
===========================================
TIME: ${timestamp}
SOURCE: ${source}
ERROR: ${errorMessage}
STACK: ${stack}
INFO: ${JSON.stringify(additionalInfo, null, 2)}
===========================================

`;
    
    // Check if log file exists
    const exists = await RNFS.exists(LOG_FILE);
    
    if (exists) {
      // Check file size
      const stats = await RNFS.stat(LOG_FILE);
      if (stats.size > MAX_LOG_SIZE) {
        // Rotate log - keep last 50KB
        const content = await RNFS.readFile(LOG_FILE, 'utf8');
        const truncated = content.slice(-50000);
        await RNFS.writeFile(LOG_FILE, '... (log rotated)\n\n' + truncated, 'utf8');
      }
    }
    
    // Append log entry
    await RNFS.appendFile(LOG_FILE, logEntry, 'utf8');
    
    console.log(`Logged error to ${LOG_FILE}:`, errorMessage);
  } catch (logError) {
    console.error('Failed to write error log:', logError);
  }
};

/**
 * Log info message
 */
export const logInfo = async (source, message, additionalInfo = {}) => {
  try {
    const timestamp = new Date().toISOString();
    
    const logEntry = `[${timestamp}] [INFO] [${source}] ${message} ${JSON.stringify(additionalInfo)}\n`;
    
    await RNFS.appendFile(LOG_FILE, logEntry, 'utf8');
  } catch (logError) {
    console.error('Failed to write info log:', logError);
  }
};

/**
 * Get log file contents
 */
export const getLogContents = async () => {
  try {
    const exists = await RNFS.exists(LOG_FILE);
    if (!exists) {
      return 'No log file found';
    }
    
    const content = await RNFS.readFile(LOG_FILE, 'utf8');
    return content;
  } catch (error) {
    console.error('Failed to read log file:', error);
    return `Error reading log: ${error.message}`;
  }
};

/**
 * Clear log file
 */
export const clearLog = async () => {
  try {
    const exists = await RNFS.exists(LOG_FILE);
    if (exists) {
      await RNFS.unlink(LOG_FILE);
    }
    console.log('Log file cleared');
  } catch (error) {
    console.error('Failed to clear log:', error);
  }
};

/**
 * Copy log to gallery for easy access
 */
export const exportLog = async () => {
  try {
    const content = await getLogContents();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportPath = `${RNFS.PicturesDirectoryPath || '/storage/emulated/0/Pictures'}/ReceiptKeeper/error_log_${timestamp}.txt`;
    
    await RNFS.writeFile(exportPath, content, 'utf8');
    
    console.log(`Log exported to: ${exportPath}`);
    return exportPath;
  } catch (error) {
    console.error('Failed to export log:', error);
    throw error;
  }
};

/**
 * Get log file path
 */
export const getLogPath = () => LOG_FILE;
