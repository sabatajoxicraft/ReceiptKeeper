import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { isAuthenticated, getOneDriveUserInfo } from '../services/onedriveService';
import NetInfo from '@react-native-community/netinfo';
import { getSetting } from '../database/database';
import { APP_COLORS } from '../config/constants';

const SyncDebugInfo = ({ onClose }) => {
  const [info, setInfo] = useState({});

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    try {
      const auth = await isAuthenticated();
      const userInfo = auth ? await getOneDriveUserInfo() : null;
      const netInfo = await NetInfo.fetch();
      const receiptsPath = await getSetting('local_receipts_path');
      const logsPath = await getSetting('local_logs_path');
      const onedrivePath = await getSetting('onedrive_base_path');

      setInfo({
        authenticated: auth,
        userEmail: userInfo?.email || 'Not signed in',
        networkType: netInfo.type,
        isConnected: netInfo.isConnected,
        isInternetReachable: netInfo.isInternetReachable,
        receiptsPath: receiptsPath || 'Not set',
        logsPath: logsPath || 'Not set',
        onedrivePath: onedrivePath || 'Not set',
      });
    } catch (error) {
      console.error('Error loading debug info:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>🔍 Sync Debug Info</Text>

        <Text style={styles.label}>OneDrive Authentication:</Text>
        <Text style={styles.value}>{info.authenticated ? '✅ Signed In' : '❌ Not Signed In'}</Text>
        <Text style={styles.value}>{info.userEmail}</Text>

        <Text style={styles.label}>Network:</Text>
        <Text style={styles.value}>Type: {info.networkType}</Text>
        <Text style={styles.value}>Connected: {info.isConnected ? '✅ Yes' : '❌ No'}</Text>
        <Text style={styles.value}>Internet: {info.isInternetReachable ? '✅ Yes' : '❌ No'}</Text>

        <Text style={styles.label}>Paths:</Text>
        <Text style={styles.value}>Receipts: {info.receiptsPath}</Text>
        <Text style={styles.value}>Logs: {info.logsPath}</Text>
        <Text style={styles.value}>OneDrive: {info.onedrivePath}</Text>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 100,
    borderRadius: 10,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: APP_COLORS.text,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
    color: APP_COLORS.text,
  },
  value: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    marginLeft: 10,
    marginBottom: 5,
  },
  closeButton: {
    backgroundColor: APP_COLORS.primary,
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
    marginBottom: 20,
  },
  closeButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SyncDebugInfo;
