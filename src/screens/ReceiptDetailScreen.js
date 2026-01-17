import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { APP_COLORS } from '../config/constants';
import { getDatabase } from '../database/database';

const CATEGORIES = ['Transport', 'Meals', 'Supplies', 'Services', 'Other', 'Uncategorized'];

const ReceiptDetailScreen = ({ receiptId, onBack, onUpdate }) => {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  
  const [editedData, setEditedData] = useState({
    vendor_name: '',
    total_amount: '',
    tax_amount: '',
    invoice_number: '',
    category: '',
  });

  useEffect(() => {
    loadReceiptDetails();
  }, [receiptId]);

  const loadReceiptDetails = async () => {
    try {
      const db = getDatabase();
      const result = await db.executeSql(
        'SELECT * FROM receipts WHERE id = ?',
        [receiptId]
      );

      if (result[0].rows.length > 0) {
        const data = result[0].rows.item(0);
        setReceipt(data);
        setEditedData({
          vendor_name: data.vendor_name || '',
          total_amount: data.total_amount?.toString() || '',
          tax_amount: data.tax_amount?.toString() || '',
          invoice_number: data.invoice_number || '',
          category: data.category || 'Uncategorized',
        });
      }
    } catch (error) {
      console.error('Error loading receipt details:', error);
      Alert.alert('Error', 'Failed to load receipt details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const db = getDatabase();
      await db.executeSql(
        `UPDATE receipts 
         SET vendor_name = ?, 
             total_amount = ?, 
             tax_amount = ?, 
             invoice_number = ?, 
             category = ?
         WHERE id = ?`,
        [
          editedData.vendor_name,
          parseFloat(editedData.total_amount) || null,
          parseFloat(editedData.tax_amount) || null,
          editedData.invoice_number,
          editedData.category,
          receiptId,
        ]
      );

      setEditing(false);
      await loadReceiptDetails();
      if (onUpdate) onUpdate();
      Alert.alert('Success', 'Receipt updated successfully');
    } catch (error) {
      console.error('Error saving receipt:', error);
      Alert.alert('Error', 'Failed to save changes');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Receipt',
      'Are you sure you want to delete this receipt?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getDatabase();
              await db.executeSql('DELETE FROM receipts WHERE id = ?', [receiptId]);
              Alert.alert('Success', 'Receipt deleted');
              onBack();
            } catch (error) {
              console.error('Error deleting receipt:', error);
              Alert.alert('Error', 'Failed to delete receipt');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!receipt) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Receipt not found</Text>
        <TouchableOpacity style={styles.button} onPress={onBack}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receipt Details</Text>
        <TouchableOpacity
          onPress={() => (editing ? handleSave() : setEditing(true))}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>{editing ? '💾 Save' : '✏️ Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Receipt Image */}
        {receipt.file_path && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: `file://${receipt.file_path}` }}
              style={styles.receiptImage}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Receipt Information */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Merchant/Vendor</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={editedData.vendor_name}
                onChangeText={(text) =>
                  setEditedData({ ...editedData, vendor_name: text })
                }
                placeholder="Enter merchant name"
                placeholderTextColor={APP_COLORS.textSecondary}
              />
            ) : (
              <Text style={styles.value}>{receipt.vendor_name || 'Not specified'}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Total Amount</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={editedData.total_amount}
                onChangeText={(text) =>
                  setEditedData({ ...editedData, total_amount: text })
                }
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor={APP_COLORS.textSecondary}
              />
            ) : (
              <Text style={styles.value}>
                {receipt.total_amount
                  ? `R ${parseFloat(receipt.total_amount).toFixed(2)}`
                  : 'Not specified'}
              </Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Tax Amount</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={editedData.tax_amount}
                onChangeText={(text) =>
                  setEditedData({ ...editedData, tax_amount: text })
                }
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor={APP_COLORS.textSecondary}
              />
            ) : (
              <Text style={styles.value}>
                {receipt.tax_amount
                  ? `R ${parseFloat(receipt.tax_amount).toFixed(2)}`
                  : 'Not specified'}
              </Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Invoice Number</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={editedData.invoice_number}
                onChangeText={(text) =>
                  setEditedData({ ...editedData, invoice_number: text })
                }
                placeholder="Enter invoice number"
                placeholderTextColor={APP_COLORS.textSecondary}
              />
            ) : (
              <Text style={styles.value}>{receipt.invoice_number || 'Not specified'}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Category</Text>
            {editing ? (
              <TouchableOpacity
                style={styles.categoryButton}
                onPress={() => setShowCategoryPicker(true)}
              >
                <Text style={styles.categoryButtonText}>
                  {editedData.category || 'Select Category'}
                </Text>
                <Text style={styles.categoryArrow}>▼</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {receipt.category || 'Uncategorized'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Date Captured</Text>
            <Text style={styles.value}>
              {new Date(receipt.date_captured).toLocaleString()}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>
              {receipt.payment_method === 'cash' ? '💵 Cash' : `💳 ${receipt.card_name}`}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>File</Text>
            <Text style={styles.valueSmall}>{receipt.filename}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Sync Status</Text>
            <Text
              style={[
                styles.value,
                receipt.upload_status === 'success'
                  ? styles.syncSuccess
                  : styles.syncPending,
              ]}
            >
              {receipt.upload_status === 'success' ? '✅ Synced' : '⏳ Pending'}
            </Text>
          </View>
        </View>

        {/* Delete Button */}
        {editing && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>🗑️ Delete Receipt</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryOption,
                  editedData.category === category && styles.categoryOptionSelected,
                ]}
                onPress={() => {
                  setEditedData({ ...editedData, category });
                  setShowCategoryPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.categoryOptionText,
                    editedData.category === category &&
                      styles.categoryOptionTextSelected,
                  ]}
                >
                  {category}
                </Text>
                {editedData.category === category && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCategoryPicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    padding: 15,
    backgroundColor: APP_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border || '#ddd',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: APP_COLORS.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_COLORS.text,
  },
  editButton: {
    padding: 5,
  },
  editButtonText: {
    fontSize: 16,
    color: APP_COLORS.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    backgroundColor: '#000',
    padding: 10,
    alignItems: 'center',
  },
  receiptImage: {
    width: '100%',
    height: 400,
  },
  infoCard: {
    backgroundColor: APP_COLORS.surface,
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  infoRow: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    marginBottom: 5,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: APP_COLORS.text,
    fontWeight: '600',
  },
  valueSmall: {
    fontSize: 14,
    color: APP_COLORS.text,
    fontFamily: 'monospace',
  },
  input: {
    fontSize: 16,
    color: APP_COLORS.text,
    borderWidth: 1,
    borderColor: APP_COLORS.border || '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
  },
  categoryButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: APP_COLORS.border || '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  categoryButtonText: {
    fontSize: 16,
    color: APP_COLORS.text,
  },
  categoryArrow: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
  },
  categoryBadge: {
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: APP_COLORS.border || '#ddd',
    marginVertical: 10,
  },
  syncSuccess: {
    color: APP_COLORS.success || '#28a745',
  },
  syncPending: {
    color: APP_COLORS.warning || '#ffc107',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 18,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 50,
  },
  errorText: {
    fontSize: 18,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  button: {
    backgroundColor: APP_COLORS.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: APP_COLORS.text,
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryOptionSelected: {
    backgroundColor: APP_COLORS.primary + '20',
  },
  categoryOptionText: {
    fontSize: 16,
    color: APP_COLORS.text,
  },
  categoryOptionTextSelected: {
    color: APP_COLORS.primary,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: APP_COLORS.primary,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    marginTop: 15,
    padding: 15,
    backgroundColor: APP_COLORS.textSecondary,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReceiptDetailScreen;
