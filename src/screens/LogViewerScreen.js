import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { APP_COLORS } from '../config/constants';
import { getLog, clearLog, exportLog } from '../services/errorLogService';

const LogViewerScreen = ({ onBack }) => {
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const content = await getLog();
      setLogs(content || 'No logs available');
    } catch (error) {
      console.error('Error loading logs:', error);
      Alert.alert('Error', 'Failed to load logs: ' + error.message);
      setLogs('Error loading logs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = () => {
    Alert.alert(
      'Clear Logs',
      'Delete all error logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearLog();
            setLogs('');
            Alert.alert('Success', 'Logs cleared');
          },
        },
      ]
    );
  };

  const handleExportLogs = async () => {
    try {
      const path = await exportLog();
      Alert.alert(
        'Exported',
        `Logs saved to:\n${path}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export logs: ' + error.message);
    }
  };

  const handleShareLogs = async () => {
    try {
      const content = await getLog();
      if (!content) {
        Alert.alert('No Logs', 'No logs to share');
        return;
      }
      await Share.share({
        message: content,
        title: 'Receipt Keeper Error Logs',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share logs: ' + error.message);
    }
  };

  React.useEffect(() => {
    loadLogs();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Error Logs</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={loadLogs}>
          <Text style={styles.buttonText}>🔄 Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleExportLogs}>
          <Text style={styles.buttonText}>📤 Export</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleShareLogs}>
          <Text style={styles.buttonText}>📲 Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={handleClearLogs}>
          <Text style={styles.clearButtonText}>🗑️ Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>Log file: {getLogPath()}</Text>
      </View>

      <ScrollView style={styles.logContainer}>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : logs ? (
          <Text style={styles.logText}>{logs}</Text>
        ) : (
          <Text style={styles.emptyText}>No logs found</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: APP_COLORS.primary,
  },
  backButton: {
    marginRight: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    padding: 10,
    gap: 8,
  },
  button: {
    flex: 1,
    backgroundColor: APP_COLORS.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: APP_COLORS.error,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: APP_COLORS.surface,
    padding: 10,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 11,
    color: APP_COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#000000',
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 8,
    padding: 10,
  },
  logText: {
    fontSize: 11,
    color: '#00FF00',
    fontFamily: 'monospace',
  },
  loadingText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default LogViewerScreen;
