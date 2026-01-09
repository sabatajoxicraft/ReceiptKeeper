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
import {
  getQueueStats,
  processQueue,
  retryFailedItems,
  clearFailedItems,
} from '../services/uploadQueueService';

const SyncStatusBar = () => {
  const [stats, setStats] = useState({ total: 0, pending: 0, failed: 0 });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadStats();
    
    // Refresh stats every 10 seconds
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
      const result = await processQueue();
      await loadStats();
      
      if (result.processed > 0) {
        Alert.alert(
          'Sync Complete',
          `✅ ${result.processed} uploaded${result.failed > 0 ? `\n⚠️ ${result.failed} skipped (check WiFi/auth)` : ''}`
        );
      } else if (result.failed > 0) {
        Alert.alert(
          'No Uploads', 
          'Nothing uploaded. Possible reasons:\n\n• Not on WiFi\n• Not authenticated to OneDrive\n• No internet connection\n\nCheck settings and try again.'
        );
      } else {
        Alert.alert('Queue Empty', 'All receipts are already synced!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to sync: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleRetryFailed = async () => {
    Alert.alert(
      'Retry Failed Uploads',
      'Retry all failed uploads?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retry',
          onPress: async () => {
            setSyncing(true);
            try {
              const result = await retryFailedItems();
              await loadStats();
              Alert.alert('Retry Complete', `✅ ${result.processed} uploaded`);
            } finally {
              setSyncing(false);
            }
          },
        },
      ]
    );
  };

  const handleClearFailed = async () => {
    Alert.alert(
      'Clear Failed',
      'Remove failed uploads from queue? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearFailedItems();
            await loadStats();
          },
        },
      ]
    );
  };

  // Don't show if queue is empty
  if (stats.total === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={styles.statusInfo}>
          {syncing ? (
            <>
              <ActivityIndicator size="small" color={APP_COLORS.primary} />
              <Text style={styles.statusText}>Syncing...</Text>
            </>
          ) : (
            <>
              <Text style={styles.statusIcon}>☁️</Text>
              <Text style={styles.statusText}>
                {stats.pending > 0 ? `${stats.pending} pending` : 'Synced'}
                {stats.failed > 0 && ` • ${stats.failed} failed`}
              </Text>
            </>
          )}
        </View>

        <View style={styles.buttonGroup}>
          {stats.pending > 0 && (
            <TouchableOpacity
              style={styles.syncButton}
              onPress={handleSyncNow}
              disabled={syncing}
            >
              <Text style={styles.syncButtonText}>Sync Now</Text>
            </TouchableOpacity>
          )}
          
          {stats.failed > 0 && (
            <>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetryFailed}
                disabled={syncing}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearFailed}
                disabled={syncing}
              >
                <Text style={styles.clearButtonText}>×</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: APP_COLORS.text,
    marginLeft: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  syncButton: {
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: APP_COLORS.warning,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: APP_COLORS.error,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SyncStatusBar;
