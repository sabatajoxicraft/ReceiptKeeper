import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  TextInput as RNTextInput,
  Platform,
} from 'react-native';
import RNFS from 'react-native-fs';
import { APP_COLORS, DEFAULT_CARDS, PAYMENT_METHODS } from '../config/constants';
import { saveOCRData, saveReceipt, getReceipts } from '../database/database';
import { saveImageToLocal } from '../utils/fileUtils';
import { buildOneDrivePath } from '../services/onedriveService';
import CardBadge from '../components/CardBadge';
import Toast from 'react-native-toast-message';

// Category options for dropdown
const RECEIPT_CATEGORIES = [
  { label: 'Food & Dining', value: 'food' },
  { label: 'Transportation', value: 'transportation' },
  { label: 'Office Supplies', value: 'office' },
  { label: 'Utilities', value: 'utilities' },
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'Entertainment', value: 'entertainment' },
  { label: 'Travel', value: 'travel' },
  { label: 'Other', value: 'other' },
];

const ReceiptPreviewScreen = ({ 
  captureData,
  imagePath, 
  ocrData, 
  receiptId,
  onBack, 
  onSaved,
  onRetake
}) => {
  // Form state
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [category, setCategory] = useState('other');
  const [selectedCard, setSelectedCard] = useState(null);
  const [cards, setCards] = useState(DEFAULT_CARDS);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Confidence tracking
  const [fieldConfidences, setFieldConfidences] = useState({});
  const [rawOcrText, setRawOcrText] = useState('');
  const [overallConfidence, setOverallConfidence] = useState(0);
  const [imageUri, setImageUri] = useState('');

  // Processing state
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Confidence threshold for highlighting
  const CONFIDENCE_THRESHOLD = 0.7;

  useEffect(() => {
    initializeForm();
  }, [captureData, ocrData, receiptId]);

  const initializeForm = async () => {
    // Handle captureData from document scanner
    if (captureData) {
      console.log('Initializing form from captureData:', {
        uri: captureData.uri,
        extractedFields: captureData.extractedFields,
      });
      
      setImageUri(captureData.uri || '');
      setRawOcrText(captureData.ocrText || '');

      if (captureData.extractedFields) {
        const fields = captureData.extractedFields;
        
        if (fields.date) {
          try {
            setDate(new Date(fields.date));
          } catch (e) {
            setDate(new Date());
          }
        }
        
        setVendorName(fields.vendor || '');
        setTotalAmount(fields.amount?.toString() || '');
        setTaxAmount(fields.tax?.toString() || '');
        setInvoiceNumber(fields.invoiceNumber || '');
        setCategory(fields.category || 'other');
      }
      return;
    }

    // Handle ocrData from props (legacy support)
    if (!ocrData) return;

    // Set date if available
    if (ocrData.date) {
      try {
        setDate(new Date(ocrData.date));
      } catch (e) {
        setDate(new Date());
      }
    }

    // Set text fields with OCR data
    setVendorName(ocrData.vendorName || '');
    setTotalAmount(ocrData.totalAmount?.toString() || '');
    setTaxAmount(ocrData.taxAmount?.toString() || '');
    setInvoiceNumber(ocrData.invoiceNumber || '');
    setCategory(ocrData.category || 'other');
    setRawOcrText(ocrData.rawOcrText || '');
    setImageUri(imagePath || '');

    // Store field confidences
    const confidences = {};
    if (ocrData.confidences) {
      Object.keys(ocrData.confidences).forEach((field) => {
        confidences[field] = ocrData.confidences[field];
      });
    }
    setFieldConfidences(confidences);

    // Calculate overall confidence
    if (ocrData.overallConfidence !== undefined) {
      setOverallConfidence(ocrData.overallConfidence);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    // For now, we'll use a simple date input approach
    // Users can edit the date directly or use platform native picker
    if (selectedDate) {
      setDate(selectedDate);
    }
    setShowDatePicker(false);
  };

  const handleDatePress = () => {
    // Open native date picker if available
    if (Platform.OS === 'android') {
      // Android: could use react-native-date-picker or similar
      // For now, show alert with instructions
      Alert.alert(
        'Edit Date',
        'Tap the date field to change it.\n\nFormat: MM/DD/YYYY',
      );
    } else {
      // iOS: could integrate with native DatePickerIOS
      Alert.alert(
        'Edit Date',
        'Tap the date field to change it.\n\nFormat: MM/DD/YYYY',
      );
    }
  };

  const isLowConfidence = (field) => {
    const confidence = fieldConfidences[field];
    return confidence !== undefined && confidence < CONFIDENCE_THRESHOLD;
  };

  const getConfidenceColor = (field) => {
    const confidence = fieldConfidences[field];
    if (confidence === undefined) return null;
    
    if (confidence < 0.5) return '#FFE082'; // Light yellow for very low
    if (confidence < 0.7) return '#FFF9C4'; // Pale yellow for low
    return null;
  };

  const getConfidenceIndicator = (field) => {
    const confidence = fieldConfidences[field];
    if (confidence === undefined) return null;
    
    const percentage = Math.round(confidence * 100);
    let icon = '✅';
    
    if (confidence < 0.5) icon = '⚠️';
    else if (confidence < 0.7) icon = '⚡';
    
    return `${icon} ${percentage}%`;
  };

  const validateForm = () => {
    const errors = {};

    if (!vendorName.trim()) {
      errors.vendorName = 'Vendor name is required';
    }

    if (!totalAmount.trim()) {
      errors.totalAmount = 'Total amount is required';
    } else if (isNaN(parseFloat(totalAmount))) {
      errors.totalAmount = 'Total amount must be a number';
    }

    if (taxAmount && isNaN(parseFloat(taxAmount))) {
      errors.taxAmount = 'Tax amount must be a number';
    }

    if (!category) {
      errors.category = 'Category is required';
    }

    if (!selectedCard && !date) {
      errors.payment = 'Please select a payment method';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: '❌ Validation Error',
        text2: 'Please fix all errors before saving',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }

    setSaving(true);

    try {
      // Step 1: Save the receipt file and get a receiptId if we don't have one
      let finalReceiptId = receiptId;
      
      if (!finalReceiptId && imageUri) {
        console.log('💾 Saving receipt image...');
        try {
          const base64Data = await RNFS.readFile(
            imageUri.replace('file://', ''),
            'base64'
          );
          
          const { filePath, filename, year, month } = await saveImageToLocal(
            base64Data,
            'jpg'
          );
          
          const onedrivePath = buildOneDrivePath(year, month, filename);
          
          // Determine payment method
          const paymentMethod = selectedCard ? PAYMENT_METHODS.CARD : PAYMENT_METHODS.CASH;
          const cardName = selectedCard?.name || null;
          
          // Save to database
          const result = await saveReceipt({
            filename,
            filePath,
            onedrivePath,
            paymentMethod,
            cardName,
            year,
            month,
          });
          
          // In case saveReceipt returns an ID
          if (result?.id) {
            finalReceiptId = result.id;
          }
          
          console.log('✅ Receipt image saved:', filePath);
        } catch (fileError) {
          console.warn('⚠️ Could not save image file:', fileError);
          // Continue anyway - we can still save OCR data
        }
      }

      // Step 2: Prepare and save OCR data
      const ocrDataToSave = {
        vendorName: vendorName.trim(),
        totalAmount: parseFloat(totalAmount),
        taxAmount: taxAmount ? parseFloat(taxAmount) : 0,
        invoiceNumber: invoiceNumber.trim(),
        category,
        currency: 'USD',
        rawOcrText,
        ocrConfidence: overallConfidence,
      };

      // Step 3: Save OCR data if we have a receiptId
      if (finalReceiptId) {
        console.log('💾 Saving OCR data for receipt:', finalReceiptId);
        await saveOCRData(finalReceiptId, ocrDataToSave);
        console.log('✅ OCR data saved');
      } else {
        console.warn('⚠️ No receiptId available, skipping OCR data save');
      }

      // Show success message
      Toast.show({
        type: 'success',
        text1: '✅ Receipt Saved!',
        text2: `${vendorName} - $${totalAmount}`,
        position: 'top',
        visibilityTime: 3000,
      });

      // Callback on success
      if (onSaved) {
        setTimeout(() => {
          onSaved({
            receiptId: finalReceiptId,
            ocrData: ocrDataToSave,
            date,
            card: selectedCard,
          });
        }, 800);
      } else {
        // Default: go back to main screen
        setTimeout(() => {
          onBack?.();
        }, 800);
      }
    } catch (error) {
      console.error('Error saving receipt:', error);
      Toast.show({
        type: 'error',
        text1: '❌ Error',
        text2: error.message || 'Failed to save receipt',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRetake = () => {
    Alert.alert('Retake Photo', 'Are you sure? All changes will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Retake',
        style: 'destructive',
        onPress: () => {
          if (onRetake) {
            onRetake();
          } else {
            onBack?.();
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📝 Review & Edit Receipt</Text>
      </View>

      {/* Receipt Image Preview */}
      {imageUri && (
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Receipt Image</Text>
          <Image source={{ uri: imageUri }} style={styles.thumbnail} />
        </View>
      )}

      {/* Confidence Summary */}
      {overallConfidence > 0 && (
        <View style={styles.confidenceSummary}>
          <Text style={styles.confidenceLabel}>OCR Confidence</Text>
          <View style={styles.confidenceBar}>
            <View
              style={[
                styles.confidenceFill,
                { width: `${overallConfidence * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.confidenceText}>
            {Math.round(overallConfidence * 100)}% Overall Confidence
          </Text>
          {overallConfidence < CONFIDENCE_THRESHOLD && (
            <Text style={styles.warningText}>
              ⚠️ Low confidence - please verify all fields
            </Text>
          )}
        </View>
      )}

      {/* Form Fields */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Extracted Data</Text>

        {/* Date Field */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>📅 Date</Text>
            {getConfidenceIndicator('date') && (
              <Text style={styles.confidenceIndicator}>
                {getConfidenceIndicator('date')}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.dateButton,
              isLowConfidence('date') && {
                backgroundColor: getConfidenceColor('date'),
              },
            ]}
            onPress={handleDatePress}>
            <Text style={styles.dateButtonText}>
              {date.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Vendor Name Field */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>🏪 Vendor Name</Text>
            {getConfidenceIndicator('vendor') && (
              <Text style={styles.confidenceIndicator}>
                {getConfidenceIndicator('vendor')}
              </Text>
            )}
          </View>
          <RNTextInput
            style={[
              styles.textInput,
              validationErrors.vendorName && styles.inputError,
              isLowConfidence('vendor') && {
                backgroundColor: getConfidenceColor('vendor'),
              },
            ]}
            value={vendorName}
            onChangeText={setVendorName}
            placeholder="e.g., Whole Foods Market"
            placeholderTextColor={APP_COLORS.textSecondary}
          />
          {validationErrors.vendorName && (
            <Text style={styles.errorText}>{validationErrors.vendorName}</Text>
          )}
        </View>

        {/* Total Amount Field */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>💰 Total Amount</Text>
            {getConfidenceIndicator('total') && (
              <Text style={styles.confidenceIndicator}>
                {getConfidenceIndicator('total')}
              </Text>
            )}
          </View>
          <RNTextInput
            style={[
              styles.textInput,
              validationErrors.totalAmount && styles.inputError,
              isLowConfidence('total') && {
                backgroundColor: getConfidenceColor('total'),
              },
            ]}
            value={totalAmount}
            onChangeText={setTotalAmount}
            placeholder="0.00"
            placeholderTextColor={APP_COLORS.textSecondary}
            keyboardType="decimal-pad"
          />
          {validationErrors.totalAmount && (
            <Text style={styles.errorText}>{validationErrors.totalAmount}</Text>
          )}
        </View>

        {/* Tax Amount Field */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>🧾 Tax Amount</Text>
            {getConfidenceIndicator('tax') && (
              <Text style={styles.confidenceIndicator}>
                {getConfidenceIndicator('tax')}
              </Text>
            )}
          </View>
          <RNTextInput
            style={[
              styles.textInput,
              validationErrors.taxAmount && styles.inputError,
              isLowConfidence('tax') && {
                backgroundColor: getConfidenceColor('tax'),
              },
            ]}
            value={taxAmount}
            onChangeText={setTaxAmount}
            placeholder="0.00 (optional)"
            placeholderTextColor={APP_COLORS.textSecondary}
            keyboardType="decimal-pad"
          />
          {validationErrors.taxAmount && (
            <Text style={styles.errorText}>{validationErrors.taxAmount}</Text>
          )}
        </View>

        {/* Invoice Number Field */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>🔢 Invoice Number</Text>
            {getConfidenceIndicator('invoice') && (
              <Text style={styles.confidenceIndicator}>
                {getConfidenceIndicator('invoice')}
              </Text>
            )}
          </View>
          <RNTextInput
            style={[
              styles.textInput,
              isLowConfidence('invoice') && {
                backgroundColor: getConfidenceColor('invoice'),
              },
            ]}
            value={invoiceNumber}
            onChangeText={setInvoiceNumber}
            placeholder="e.g., INV-12345 (optional)"
            placeholderTextColor={APP_COLORS.textSecondary}
          />
        </View>

        {/* Category Dropdown */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>📂 Category</Text>
            {getConfidenceIndicator('category') && (
              <Text style={styles.confidenceIndicator}>
                {getConfidenceIndicator('category')}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.pickerButton,
              validationErrors.category && styles.inputError,
              isLowConfidence('category') && {
                backgroundColor: getConfidenceColor('category'),
              },
            ]}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}>
            <Text style={styles.pickerButtonText}>
              {RECEIPT_CATEGORIES.find((c) => c.value === category)?.label ||
                'Select Category'}
            </Text>
            <Text style={styles.pickerChevron}>
              {showCategoryPicker ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {showCategoryPicker && (
            <View style={styles.categoryOptions}>
              {RECEIPT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryOption,
                    category === cat.value && styles.categoryOptionSelected,
                  ]}
                  onPress={() => {
                    setCategory(cat.value);
                    setShowCategoryPicker(false);
                  }}>
                  <Text
                    style={[
                      styles.categoryOptionText,
                      category === cat.value && styles.categoryOptionTextSelected,
                    ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {validationErrors.category && (
            <Text style={styles.errorText}>{validationErrors.category}</Text>
          )}
        </View>

        {/* Payment Method Selection */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>💳 Payment Method</Text>

          <TouchableOpacity
            style={[
              styles.paymentButton,
              validationErrors.payment && styles.inputError,
            ]}
            onPress={() => setSelectedCard(null)}>
            <Text
              style={[
                styles.paymentButtonText,
                !selectedCard && styles.paymentButtonTextSelected,
              ]}>
              💵 Cash
            </Text>
          </TouchableOpacity>

          <View style={styles.cardsContainer}>
            {cards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={[
                  styles.cardOption,
                  { borderColor: card.color },
                  selectedCard?.id === card.id && styles.cardOptionSelected,
                ]}
                onPress={() => setSelectedCard(card)}>
                <View style={styles.cardRow}>
                  <CardBadge firstDigit={card.firstDigit} size="sm" />
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{card.name}</Text>
                  </View>
                  {selectedCard?.id === card.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {validationErrors.payment && (
            <Text style={styles.errorText}>{validationErrors.payment}</Text>
          )}
        </View>

        {/* Raw OCR Text (read-only reference) */}
        {rawOcrText && (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>📄 Raw OCR Text</Text>
            <View style={styles.rawOcrContainer}>
              <Text style={styles.rawOcrText} numberOfLines={5}>
                {rawOcrText}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        {saving ? (
          <View style={styles.savingContainer}>
            <ActivityIndicator size="large" color={APP_COLORS.primary} />
            <Text style={styles.savingText}>Saving receipt...</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving}>
              <Text style={styles.saveButtonText}>✅ Save Receipt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.retakeButton}
              onPress={handleRetake}
              disabled={saving}>
              <Text style={styles.retakeButtonText}>📷 Retake Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onBack}
              disabled={saving}>
              <Text style={styles.cancelButtonText}>✕ Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },

  // Header
  header: {
    padding: 20,
    backgroundColor: APP_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: APP_COLORS.primary,
    textAlign: 'center',
  },

  // Image Section
  imageSection: {
    padding: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 12,
  },
  thumbnail: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    backgroundColor: '#000',
    resizeMode: 'contain',
  },

  // Confidence Summary
  confidenceSummary: {
    marginHorizontal: 15,
    marginTop: 10,
    padding: 12,
    backgroundColor: APP_COLORS.surface,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: APP_COLORS.warning,
  },
  confidenceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 8,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: APP_COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: APP_COLORS.success,
  },
  confidenceText: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
  },
  warningText: {
    fontSize: 12,
    color: APP_COLORS.warning,
    marginTop: 6,
    fontWeight: '500',
  },

  // Form Section
  formSection: {
    padding: 15,
  },

  // Field Group
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  confidenceIndicator: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
  },

  // Text Input
  textInput: {
    backgroundColor: APP_COLORS.surface,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: APP_COLORS.text,
  },
  inputError: {
    borderColor: APP_COLORS.error,
  },
  errorText: {
    color: APP_COLORS.error,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },

  // Date Button
  dateButton: {
    backgroundColor: APP_COLORS.surface,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: 15,
    color: APP_COLORS.text,
    fontWeight: '500',
  },

  // Picker Button (Category)
  pickerButton: {
    backgroundColor: APP_COLORS.surface,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 15,
    color: APP_COLORS.text,
    fontWeight: '500',
  },
  pickerChevron: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
  },

  // Category Options
  categoryOptions: {
    backgroundColor: APP_COLORS.surface,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    borderRadius: 8,
    marginTop: 8,
    overflow: 'hidden',
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
  },
  categoryOptionSelected: {
    backgroundColor: APP_COLORS.accent,
  },
  categoryOptionText: {
    fontSize: 15,
    color: APP_COLORS.text,
  },
  categoryOptionTextSelected: {
    color: APP_COLORS.surface,
    fontWeight: '600',
  },

  // Payment Method
  paymentButton: {
    backgroundColor: APP_COLORS.surface,
    borderWidth: 2,
    borderColor: APP_COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  paymentButtonText: {
    fontSize: 15,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
  },
  paymentButtonTextSelected: {
    color: APP_COLORS.primary,
    fontWeight: '700',
  },

  // Cards Container
  cardsContainer: {
    marginTop: 8,
  },
  cardOption: {
    backgroundColor: APP_COLORS.surface,
    borderWidth: 2,
    borderColor: APP_COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  cardOptionSelected: {
    borderColor: APP_COLORS.primary,
    backgroundColor: '#F0F8F0',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 10,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  checkmark: {
    fontSize: 18,
    color: APP_COLORS.primary,
    fontWeight: '700',
  },

  // Raw OCR Text
  rawOcrContainer: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    borderRadius: 8,
    padding: 10,
    maxHeight: 100,
  },
  rawOcrText: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    lineHeight: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Action Section
  actionSection: {
    padding: 15,
    backgroundColor: APP_COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.border,
  },

  // Saving Container
  savingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  savingText: {
    marginTop: 12,
    fontSize: 16,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
  },

  // Save Button
  saveButton: {
    backgroundColor: APP_COLORS.success,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Retake Button
  retakeButton: {
    backgroundColor: APP_COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Cancel Button
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: APP_COLORS.textSecondary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 20,
  },
});

export default ReceiptPreviewScreen;
