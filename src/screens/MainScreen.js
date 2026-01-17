import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { getReceipts } from '../database/database';
import { scanForMissingReceipts } from '../services/storageService';
import { APP_COLORS } from '../config/constants';
import SyncStatusBar from '../components/SyncStatusBar';
import SearchFilterBar from '../components/SearchFilterBar';
import PDFExportModal from '../components/PDFExportModal';
import ReceiptDetailScreen from './ReceiptDetailScreen';

const MainScreen = ({ onCapture, onSettings, onViewLogs }) => {
  const [sections, setSections] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0 });
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);
  const [currentFilters, setCurrentFilters] = useState({});
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [allReceipts, setAllReceipts] = useState([]);

  useEffect(() => {
    // Initial load and scan
    handleInitialLoad();
  }, []);

  const handleInitialLoad = async () => {
    setRefreshing(true);
    // 1. Scan for any files in storage that aren't in DB
    await scanForMissingReceipts();
    // 2. Load data from DB
    await loadReceipts();
    setRefreshing(false);
  };

  const loadReceipts = async () => {
    try {
      const data = await getReceipts(1000, currentFilters); // Apply filters
      setAllReceipts(data); // Store all receipts for PDF export
      
      // Group by status
      const pending = data.filter(r => r.upload_status !== 'success');
      const synced = data.filter(r => r.upload_status === 'success');
      
      const newSections = [];
      
      if (pending.length > 0) {
        newSections.push({
          title: '☁️ Needs Sync',
          data: pending,
        });
      }
      
      if (synced.length > 0) {
        newSections.push({
          title: '✅ Synced History',
          data: synced,
        });
      }

      setSections(newSections);

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

  const handleFilterChange = (filters) => {
    setCurrentFilters(filters);
  };

  useEffect(() => {
    loadReceipts();
  }, [currentFilters]);

  const onRefresh = async () => {
    setRefreshing(true);
    await scanForMissingReceipts(); // Check storage again on refresh
    await loadReceipts();
    setRefreshing(false);
  };

  const handleReceiptPress = (receiptId) => {
    setSelectedReceiptId(receiptId);
  };

  const handleBackToList = () => {
    setSelectedReceiptId(null);
    loadReceipts(); // Refresh list after potential edits
  };

  const renderReceipt = ({ item }) => (
    <TouchableOpacity
      style={styles.receiptCard}
      onPress={() => handleReceiptPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.receiptCardContent}>
        {/* Thumbnail */}
        {item.file_path && (
          <Image
            source={{ uri: `file://${item.file_path}` }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        )}

        {/* Receipt Info */}
        <View style={styles.receiptInfo}>
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptVendor} numberOfLines={1}>
              {item.vendor_name || item.filename}
            </Text>
            <Text style={styles.receiptDate}>
              {new Date(item.date_captured).toLocaleDateString()}
            </Text>
          </View>

          {item.total_amount && (
            <Text style={styles.receiptAmount}>
              R {parseFloat(item.total_amount).toFixed(2)}
            </Text>
          )}

          {item.category && (
            <View style={styles.categoryBadgeSmall}>
              <Text style={styles.categoryBadgeTextSmall}>{item.category}</Text>
            </View>
          )}

          <View style={styles.receiptDetails}>
            <Text style={styles.receiptPayment}>
              {item.payment_method === 'cash' ? '💵 Cash' : `💳 ${item.card_name}`}
            </Text>
          </View>

          {item.upload_status === 'pending' && (
            <Text style={styles.uploadPending}>⏳ Upload pending</Text>
          )}
          {item.upload_status === 'success' && (
            <Text style={styles.uploadSuccess}>✅ Synced</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Show detail screen if receipt selected
  if (selectedReceiptId) {
    return (
      <ReceiptDetailScreen
        receiptId={selectedReceiptId}
        onBack={handleBackToList}
        onUpdate={loadReceipts}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📱 Receipt Keeper</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={onViewLogs} style={styles.headerButton}>
            <Text style={styles.settingsButton}>📋</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSettings} style={styles.headerButton}>
            <Text style={styles.settingsButton}>⚙️</Text>
          </TouchableOpacity>
        </View>
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

      {/* Sync Status Bar */}
      <SyncStatusBar />

      {/* Search and Filter */}
      <SearchFilterBar onFilterChange={handleFilterChange} />

      <TouchableOpacity style={styles.captureButton} onPress={onCapture}>
        <Text style={styles.captureButtonText}>📸 Capture Receipt</Text>
      </TouchableOpacity>

      {/* PDF Export Button */}
      {allReceipts.length > 0 && (
        <TouchableOpacity
          style={styles.pdfButton}
          onPress={() => setShowPDFModal(true)}
        >
          <Text style={styles.pdfButtonText}>📄 Export to PDF</Text>
        </TouchableOpacity>
      )}

      <View style={styles.listContainer}>
        {sections.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No receipts found</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the button above to capture your first receipt
            </Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            renderItem={renderReceipt}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={styles.sectionHeader}>{title}</Text>
            )}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            stickySectionHeadersEnabled={false}
          />
        )}
      </View>

      {/* PDF Export Modal */}
      <PDFExportModal
        visible={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        receipts={allReceipts}
      />
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
  headerButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  headerButton: {
    padding: 5,
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
    marginHorizontal: 20,
    marginTop: 10,
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
  pdfButton: {
    backgroundColor: '#FF6B35',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  pdfButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
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
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: APP_COLORS.background,
    color: APP_COLORS.primary,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 5,
  },
  receiptCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  receiptCardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  thumbnail: {
    width: 80,
    height: 100,
    borderRadius: 8,
    backgroundColor: APP_COLORS.border,
    marginRight: 12,
  },
  receiptInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  receiptVendor: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.text,
    flex: 1,
    marginRight: 10,
  },
  receiptDate: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
  },
  receiptAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_COLORS.primary,
    marginBottom: 5,
  },
  categoryBadgeSmall: {
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  categoryBadgeTextSmall: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  receiptDetails: {
    marginTop: 3,
  },
  receiptPayment: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
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
