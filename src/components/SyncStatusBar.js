import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { APP_COLORS } from '../config/constants';
import { getAllReceipts } from '../database/database';
import {
  getQueueStats,
  addToQueue,
  processQueue,
  clearFailedItems,
} from '../services/uploadQueueService';

const SyncStatusBar = () => {
  const [stats, setStats] = useState({ total: 0, pending: 0, failed: 0 });
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
      const receipts = await getAllReceipts();
      console.log('Found', receipts.length, 'receipts in database');
      
      // Step 2: Add each to queue
      let queued = 0;
      for (const receipt of receipts) {
        await addToQueue(receipt.filePath, receipt.onedrivePath);
        queued++;
      }
      console.log('Added', queued, 'receipts to upload queue');
      
      // Step 3: Process the queue
      console.log('Processing upload queue...');
      const result = await processQueue();
      console.log('Upload result:', result);
      
      await loadStats();
      
      Alert.alert(
        'Sync Complete',
        `✅ Processed: ${result.processed}\n${result.failed > 0 ? `⚠️ Failed: ${result.failed}` : '✅ All uploaded!'}`
      );
      
      console.log('=== MANUAL SYNC COMPLETE ===');
    } catch (error) {
      console.error('❌ Sync error:', error);
      Alert.alert('Sync Error', error.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleClearFailed = async () => {
    await clearFailedItems();
    await loadStats();
    Alert.alert('Cleared', 'Failed items removed from queue');
  };

  // Always show the sync button
  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {stats.total > 0 ? (
            <>📤 Queue: {stats.pending} pending{stats.failed > 0 && ` • ⚠️ ${stats.failed} failed`}</>
          ) : (
            '📤 Ready to sync receipts'
          )}
        </Text>
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
    marginBottom: 8,
  },
  statusText: {
    fontSize: 13,
    color: '#666',
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
