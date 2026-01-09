/**
 * Upload Queue Service
 * Manages background uploads to OneDrive with retry logic
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadToOneDrive, isAuthenticated } from './onedriveService';
import NetInfo from '@react-native-community/netinfo';
import { logError, logInfo } from './errorLogService';

const QUEUE_KEY = 'upload_queue';
const MAX_RETRIES = 3;
const RETRY_DELAYS = [5000, 15000, 60000]; // 5s, 15s, 1m

// Queue item structure:
// {
//   id: string,
//   localPath: string,
//   remotePath: string,
//   retryCount: number,
//   addedAt: string,
//   lastAttempt: string,
//   error: string,
// }

/**
 * Get upload queue from storage
 */
export const getQueue = async () => {
  try {
    const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (error) {
    console.error('Error reading queue:', error);
    return [];
  }
};

/**
 * Save upload queue to storage
 */
const saveQueue = async (queue) => {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error saving queue:', error);
    throw error; // Re-throw to let caller know
  }
};

/**
 * Add item to upload queue
 */
export const addToQueue = async (localPath, remotePath) => {
  try {
    const queue = await getQueue();
    
    const item = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      localPath,
      remotePath,
      retryCount: 0,
      addedAt: new Date().toISOString(),
      lastAttempt: null,
      error: null,
    };
    
    queue.push(item);
    await saveQueue(queue);
    
    console.log(`Added to upload queue: ${remotePath}`);
    
    // Try to upload immediately if online
    // Don't await this, let it run in background but handle errors
    processQueue().catch(err => console.error('Background upload failed:', err));
    
    return item.id;
  } catch (error) {
    console.error('Error adding to queue:', error);
    return null;
  }
};

/**
 * Remove item from queue
 */
const removeFromQueue = async (itemId) => {
  try {
    const queue = await getQueue();
    const newQueue = queue.filter(item => item.id !== itemId);
    await saveQueue(newQueue);
    console.log(`Removed from queue: ${itemId}`);
  } catch (error) {
    console.error('Error removing from queue:', error);
  }
};

/**
 * Update item in queue
 */
const updateQueueItem = async (itemId, updates) => {
  try {
    const queue = await getQueue();
    const index = queue.findIndex(item => item.id === itemId);
    
    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates };
      await saveQueue(queue);
    }
  } catch (error) {
    console.error('Error updating queue item:', error);
  }
};

/**
 * Check if device is online
 */
const isOnline = async () => {
  try {
    const netInfo = await NetInfo.fetch();
    console.log('Network info:', netInfo);
    // isInternetReachable can be null on some devices, so treat null as true
    return netInfo.isConnected === true && (netInfo.isInternetReachable === true || netInfo.isInternetReachable === null);
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
};

/**
 * Check if should upload based on network type
 * Can be configured by user later
 */
const shouldUploadOnNetwork = async () => {
  try {
    const netInfo = await NetInfo.fetch();
    console.log('Checking network type:', netInfo.type);
    
    // TODO: Add user preference for cellular data usage
    // For now, allow WiFi and unknown types (some devices report 'unknown')
    const allowedTypes = ['wifi', 'ethernet', 'unknown'];
    return allowedTypes.includes(netInfo.type);
  } catch (error) {
    console.error('Error checking network type:', error);
    // If we can't check, allow upload attempt
    return true;
  }
};

/**
 * Process a single queue item
 */
const processQueueItem = async (item) => {
  try {
    await logInfo('UploadQueue', `Processing item: ${item.remotePath}`);
    
    // Check if authenticated
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      await logInfo('UploadQueue', 'Not authenticated, skipping upload');
      return false;
    }
    
    // Check network
    const online = await isOnline();
    if (!online) {
      await logInfo('UploadQueue', 'Device offline, skipping upload');
      return false;
    }
    
    // Check network type (WiFi preferred)
    const canUpload = await shouldUploadOnNetwork();
    if (!canUpload) {
      await logInfo('UploadQueue', 'Not on allowed network type, skipping upload');
      return false;
    }
    
    // Update last attempt
    await updateQueueItem(item.id, {
      lastAttempt: new Date().toISOString(),
    });
    
    // Attempt upload
    await logInfo('UploadQueue', `Uploading: ${item.remotePath}`);
    const result = await uploadToOneDrive(item.localPath, item.remotePath);
    
    await logInfo('UploadQueue', 'Upload result', result);
    
    if (result && result.success) {
      await logInfo('UploadQueue', `Upload successful: ${item.remotePath}`);
      await removeFromQueue(item.id);
      return true;
    } else {
      throw new Error('Upload failed - no success flag');
    }
  } catch (error) {
    await logError('UploadQueue', error, {
      item: item.remotePath,
      retryCount: item.retryCount,
      localPath: item.localPath,
    });
    
    // Increment retry count
    const newRetryCount = item.retryCount + 1;
    
    if (newRetryCount >= MAX_RETRIES) {
      await logError('UploadQueue', new Error(`Max retries reached for ${item.remotePath}`));
      await updateQueueItem(item.id, {
        retryCount: newRetryCount,
        error: error.message,
      });
    } else {
      await logInfo('UploadQueue', `Will retry ${item.remotePath} (attempt ${newRetryCount}/${MAX_RETRIES})`);
      await updateQueueItem(item.id, {
        retryCount: newRetryCount,
        error: error.message,
      });
      
      // Schedule retry with exponential backoff
      const delay = RETRY_DELAYS[newRetryCount - 1] || 60000;
      setTimeout(() => {
        processQueue().catch(err => console.error('Retry upload failed:', err));
      }, delay);
    }
    
    return false;
  }
};

/**
 * Process entire upload queue
 */
export const processQueue = async () => {
  try {
    const queue = await getQueue();
    
    if (queue.length === 0) {
      console.log('Upload queue is empty');
      return { processed: 0, failed: 0 };
    }
    
    console.log(`Processing ${queue.length} items in upload queue`);
    
    let processed = 0;
    let failed = 0;
    
    // Process items sequentially to avoid overwhelming the API
    for (const item of queue) {
      // Skip items that have failed max retries (will retry manually)
      if (item.retryCount >= MAX_RETRIES) {
        console.log(`Skipping ${item.remotePath} (max retries reached)`);
        failed++;
        continue;
      }
      
      const success = await processQueueItem(item);
      if (success) {
        processed++;
      } else {
        failed++;
      }
      
      // Small delay between uploads
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`Queue processing complete: ${processed} uploaded, ${failed} failed`);
    
    return { processed, failed };
  } catch (error) {
    console.error('Error processing queue:', error);
    return { processed: 0, failed: 0 };
  }
};

/**
 * Get queue statistics
 */
export const getQueueStats = async () => {
  try {
    const queue = await getQueue();
    
    const pending = queue.filter(item => item.retryCount < MAX_RETRIES).length;
    const failed = queue.filter(item => item.retryCount >= MAX_RETRIES).length;
    
    return {
      total: queue.length,
      pending,
      failed,
    };
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return { total: 0, pending: 0, failed: 0 };
  }
};

/**
 * Clear all failed items from queue
 */
export const clearFailedItems = async () => {
  try {
    const queue = await getQueue();
    const newQueue = queue.filter(item => item.retryCount < MAX_RETRIES);
    await saveQueue(newQueue);
    console.log('Cleared failed items from queue');
  } catch (error) {
    console.error('Error clearing failed items:', error);
  }
};

/**
 * Retry all failed items
 */
export const retryFailedItems = async () => {
  try {
    const queue = await getQueue();
    
    // Reset retry count for failed items
    const updatedQueue = queue.map(item => {
      if (item.retryCount >= MAX_RETRIES) {
        return { ...item, retryCount: 0, error: null };
      }
      return item;
    });
    
    await saveQueue(updatedQueue);
    console.log('Reset failed items for retry');
    
    // Process queue
    return await processQueue();
  } catch (error) {
    console.error('Error retrying failed items:', error);
    return { processed: 0, failed: 0 };
  }
};

/**
 * Clear entire queue (use with caution)
 */
export const clearQueue = async () => {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
    console.log('Queue cleared');
  } catch (error) {
    console.error('Error clearing queue:', error);
  }
};
