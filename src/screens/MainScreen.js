import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { getReceipts } from '../database/database';
import { APP_COLORS } from '../config/constants';

const MainScreen = ({ onCapture, onSettings }) => {
  const [receipts, setReceipts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0 });

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      const data = await getReceipts(100);
      setReceipts(data);

      // Calculate stats
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const thisMonth = data.filter(
        (r) =>
          parseInt(r.month) === currentMonth &&
          parseInt(r.year) === currentYear
      ).length;

      setStats({ total: data.length, thisMonth });
    } catch (error) {
      console.error('Error loading receipts:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReceipts();
    setRefreshing(false);
  };

  const renderReceipt = ({ item }) => (
    <View style={styles.receiptCard}>
      <View style={styles.receiptHeader}>
        <Text style={styles.receiptFilename}>{item.filename}</Text>
        <Text style={styles.receiptDate}>
          {new Date(item.date_captured).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.receiptDetails}>
        <Text style={styles.receiptPayment}>
          {item.payment_method === 'cash' ? '💵 Cash' : `💳 ${item.card_name}`}
        </Text>
        <Text style={styles.receiptPath}>{item.onedrive_path}</Text>
      </View>
      {item.upload_status === 'pending' && (
        <Text style={styles.uploadPending}>⏳ Upload pending</Text>
      )}
      {item.upload_status === 'success' && (
        <Text style={styles.uploadSuccess}>✅ Synced</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📱 Receipt Keeper</Text>
        <TouchableOpacity onPress={onSettings}>
          <Text style={styles.settingsButton}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Receipts</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.thisMonth}</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.captureButton} onPress={onCapture}>
        <Text style={styles.captureButtonText}>📸 Capture Receipt</Text>
      </TouchableOpacity>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Recent Receipts</Text>
        {receipts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No receipts yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the button above to capture your first receipt
            </Text>
          </View>
        ) : (
          <FlatList
            data={receipts}
            renderItem={renderReceipt}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: APP_COLORS.surface,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: APP_COLORS.text,
  },
  settingsButton: {
    fontSize: 28,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  statBox: {
    flex: 1,
    backgroundColor: APP_COLORS.surface,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: APP_COLORS.primary,
  },
  statLabel: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    marginTop: 5,
  },
  captureButton: {
    backgroundColor: APP_COLORS.primary,
    margin: 20,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  captureButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: APP_COLORS.text,
  },
  receiptCard: {
    backgroundColor: APP_COLORS.surface,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  receiptFilename: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.text,
    flex: 1,
  },
  receiptDate: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
  },
  receiptDetails: {
    marginTop: 5,
  },
  receiptPayment: {
    fontSize: 15,
    color: APP_COLORS.text,
    marginBottom: 3,
  },
  receiptPath: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  uploadPending: {
    fontSize: 12,
    color: APP_COLORS.warning,
    marginTop: 5,
  },
  uploadSuccess: {
    fontSize: 12,
    color: APP_COLORS.success,
    marginTop: 5,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyStateText: {
    fontSize: 18,
    color: APP_COLORS.textSecondary,
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default MainScreen;
