import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { APP_COLORS } from '../config/constants';
import { getReceipts } from '../database/database';
import {
  getQueueStats,
  addToQueue,
  processQueue,
  clearFailedItems,
} from '../services/uploadQueueService';
import SyncDebugInfo from './SyncDebugInfo';

const SyncStatusBar = () => {
  const [stats, setStats] = useState({ total: 0, pending: 0, failed: 0 });
  const [showDebug, setShowDebug] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    const queueStats = await getQueueStats();
    setStats(queueStats);
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      console.log('=== MANUAL SYNC STARTED ===');
      
      // Step 1: Get all receipts from database
      const receipts = await getReceipts(1000); // Get up to 1000 receipts
      console.log('Found', receipts.length, 'receipts in database');
      
      if (receipts.length === 0) {
        Alert.alert('No Receipts', 'No receipts found to sync. Capture some receipts first!');
        setSyncing(false);
        return;
      }
      
      // Step 2: Add each to queue
      let queued = 0;
      for (const receipt of receipts) {
        // Database columns use snake_case: file_path, onedrive_path
        const localPath = receipt.file_path;
        const remotePath = receipt.onedrive_path;
        
        if (localPath && remotePath) {
          await addToQueue(localPath, remotePath);
          queued++;
        } else {
          console.warn('Skipping receipt with missing paths:', receipt);
        }
      }
      console.log('Added', queued, 'receipts to upload queue');
      
      if (queued === 0) {
        Alert.alert('Nothing to Sync', 'No valid receipts to upload.');
        setSyncing(false);
        return;
      }
      
      // Step 3: Process the queue
      console.log('Processing upload queue...');
      const result = await processQueue();
      console.log('Upload result:', result);
      
      await loadStats();
      
      // Show detailed results
      if (result.failed > 0) {
        Alert.alert(
          'Sync Results',
          `✅ Uploaded: ${result.processed - result.failed}\n⚠️ Failed: ${result.failed}\n\nCheck logs (📋 button) for error details.\n\nCommon issues:\n• Not signed in to OneDrive\n• Not on WiFi\n• File doesn't exist\n• OneDrive folder invalid`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Sync Complete',
          `✅ All ${result.processed} receipts uploaded successfully!`
        );
      }
      
      console.log('=== MANUAL SYNC COMPLETE ===');
    } catch (error) {
      console.error('❌ Sync error:', error);
      Alert.alert('Sync Error', error.message || 'Failed to sync receipts');
    } finally {
      setSyncing(false);
    }
  };

  const handleClearFailed = async () => {
    await clearFailedItems();
    await loadStats();
    Alert.alert('Cleared', 'Failed items removed from queue');
  };

  // Sync features disabled temporarily as per user request
  return null;
  /*
  // Always show the sync button
  return (
    <>
      <View style={styles.container}>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {stats.total > 0 ? (
              <>📤 Queue: {stats.pending} pending{stats.failed > 0 && ` • ⚠️ ${stats.failed} failed`}</>
            ) : (
              '📤 Ready to sync receipts'
            )}
          </Text>
          <TouchableOpacity onPress={() => setShowDebug(true)} style={styles.debugButton}>
            <Text style={styles.debugButtonText}>ℹ️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.syncButton]}
            onPress={handleSyncNow}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sync Now</Text>
            )}
          </TouchableOpacity>

          {stats.failed > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={handleClearFailed}
            >
              <Text style={styles.buttonText}>Clear Failed</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Modal visible={showDebug} animationType="slide" transparent={true}>
        <SyncDebugInfo onClose={() => setShowDebug(false)} />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    padding: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  debugButton: {
    padding: 4,
  },
  debugButtonText: {
    fontSize: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  syncButton: {
    backgroundColor: APP_COLORS.primary,
    flex: 1,
  },
  clearButton: {
    backgroundColor: '#ff6b6b',
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default SyncStatusBar;
*/
