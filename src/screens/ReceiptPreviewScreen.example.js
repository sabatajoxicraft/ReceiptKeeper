/**
 * EXAMPLE: Integration of ReceiptPreviewScreen
 * 
 * This file demonstrates how to integrate the ReceiptPreviewScreen component
 * with OCR services and database operations in your app.
 */

import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import CaptureScreen from './CaptureScreen';
import ReceiptPreviewScreen from './ReceiptPreviewScreen';
import MainScreen from './MainScreen';
import { saveReceipt } from '../database/database';
import { performOCR } from '../services/ocrService'; // Example OCR service

/**
 * EXAMPLE 1: Basic Integration in a Navigation Stack
 * 
 * This shows how to manage the flow from capture -> preview -> save -> main
 */
const CaptureFlowExample = ({ onComplete }) => {
  const [screen, setScreen] = useState('main'); // 'main' | 'capture' | 'preview'
  const [receiptData, setReceiptData] = useState(null);

  const handleCaptureImage = async (imagePath) => {
    try {
      // Step 1: Save receipt to database first
      const receipt = await saveReceipt({
        filename: `receipt-${Date.now()}.jpg`,
        filePath: imagePath,
        onedrivePath: null,
        paymentMethod: 'pending',
        cardName: null,
        year: new Date().getFullYear().toString(),
        month: String(new Date().getMonth() + 1).padStart(2, '0'),
      });

      // Step 2: Run OCR on the image
      const ocrResult = await performOCR(imagePath);

      // Step 3: Prepare data for preview screen
      const data = {
        imagePath,
        ocrData: ocrResult,
        receiptId: receipt.insertId || receipt.id,
      };

      setReceiptData(data);
      setScreen('preview');
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process receipt: ' + error.message);
    }
  };

  const handleSaveOCRData = (result) => {
    console.log('Receipt saved successfully:', result);
    // Navigate back to main screen
    setScreen('main');
    setReceiptData(null);
    
    // Notify parent component
    if (onComplete) {
      onComplete(result);
    }
  };

  const handleBackToMain = () => {
    setScreen('main');
    setReceiptData(null);
  };

  // Render different screens based on state
  if (screen === 'capture') {
    return (
      <CaptureScreen onBack={handleBackToMain} />
    );
  }

  if (screen === 'preview' && receiptData) {
    return (
      <ReceiptPreviewScreen
        imagePath={receiptData.imagePath}
        ocrData={receiptData.ocrData}
        receiptId={receiptData.receiptId}
        onBack={handleBackToMain}
        onSaveSuccess={handleSaveOCRData}
      />
    );
  }

  return <MainScreen onCapture={() => setScreen('capture')} />;
};

/**
 * EXAMPLE 2: With OCR Service Integration
 * 
 * Shows how to integrate with a real OCR service
 */
import { performOCRExtraction } from '../services/ocrService';

const AdvancedCaptureFlow = () => {
  const [loading, setLoading] = useState(false);

  const processReceiptWithOCR = async (imagePath, paymentMethod) => {
    setLoading(true);
    try {
      // Step 1: Extract text from image using Vision Camera OCR Plus
      const rawText = await performOCRExtraction(imagePath);

      // Step 2: Parse structured data from raw text
      const structuredData = parseReceiptText(rawText);

      // Step 3: Save to database
      const receipt = await saveReceipt({
        filename: `receipt-${Date.now()}.jpg`,
        filePath: imagePath,
        paymentMethod,
        year: new Date().getFullYear().toString(),
        month: String(new Date().getMonth() + 1).padStart(2, '0'),
      });

      return {
        receiptId: receipt.insertId || receipt.id,
        imagePath,
        ocrData: structuredData,
      };
    } finally {
      setLoading(false);
    }
  };

  return null; // Return appropriate component
};

/**
 * EXAMPLE 3: Mock OCR Data for Testing
 * 
 * Use this data structure for testing the ReceiptPreviewScreen component
 */
export const mockOCRData = {
  date: new Date().toISOString(),
  vendorName: 'Whole Foods Market',
  totalAmount: 127.45,
  taxAmount: 9.85,
  invoiceNumber: 'INV-20240115-001',
  category: 'food',
  rawOcrText: `WHOLE FOODS MARKET
#2451 - SANTA MONICA
123 MAIN ST
SANTA MONICA CA 90401

Organic Apples x2          $8.99
Almond Butter (16oz)       $18.99
Greek Yogurt x4            $12.00
Wild Caught Salmon         $24.99
Spinach (organic)          $4.50
Bell Peppers x3            $6.75
Grain Bread                $7.50
Olive Oil (Premium)        $22.45
Herbs & Spices Mix         $8.99
Plant-based Milk           $6.49

SUBTOTAL                  $121.65
TAX                        $9.85
TOTAL                     $127.45

Payment: Visa 4****1234
Transaction ID: TXN123456789`,
  overallConfidence: 0.85,
  confidences: {
    date: 0.92,
    vendor: 0.95,
    total: 0.88,
    tax: 0.75,
    invoice: 0.65,
    category: 0.80,
  },
};

/**
 * EXAMPLE 4: Testing Component in Isolation
 * 
 * Use this for development and testing
 */
import { mockOCRData } from './mockData';

const TestReceiptPreviewScreen = () => {
  const [imagePath] = useState(
    'file:///path/to/receipt/image.jpg' // Replace with actual test image
  );

  return (
    <ReceiptPreviewScreen
      imagePath={imagePath}
      ocrData={mockOCRData}
      receiptId={1}
      onBack={() => console.log('Back pressed')}
      onSaveSuccess={(data) => {
        console.log('Save successful:', data);
      }}
    />
  );
};

/**
 * EXAMPLE 5: Error Handling Pattern
 * 
 * Demonstrates proper error handling and user feedback
 */
const handleSaveWithErrorHandling = async (receiptId, ocrData) => {
  try {
    // Validate data
    if (!ocrData.vendorName || !ocrData.totalAmount) {
      throw new Error('Vendor name and total amount are required');
    }

    // Save to database
    await saveOCRData(receiptId, ocrData);

    // Success!
    Toast.show({
      type: 'success',
      text1: '✅ Receipt Saved',
      text2: `${ocrData.vendorName} - $${ocrData.totalAmount.toFixed(2)}`,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to save receipt:', error);

    // Show specific error messages
    const errorMessage = error.message || 'Unknown error occurred';
    
    if (error.message.includes('database')) {
      Toast.show({
        type: 'error',
        text1: 'Database Error',
        text2: 'Failed to save to database. Check logs.',
      });
    } else if (error.message.includes('validation')) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: errorMessage,
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
    }

    return { success: false, error };
  }
};

/**
 * EXAMPLE 6: Field-Specific Validation
 * 
 * Custom validation logic for receipt fields
 */
export const validateReceiptData = (ocrData) => {
  const errors = [];

  // Vendor name validation
  if (!ocrData.vendorName || ocrData.vendorName.trim().length === 0) {
    errors.push({ field: 'vendor', message: 'Vendor name is required' });
  } else if (ocrData.vendorName.length > 100) {
    errors.push({ field: 'vendor', message: 'Vendor name is too long' });
  }

  // Amount validation
  const totalAmount = parseFloat(ocrData.totalAmount);
  if (isNaN(totalAmount) || totalAmount <= 0) {
    errors.push({ field: 'total', message: 'Total amount must be greater than 0' });
  } else if (totalAmount > 100000) {
    errors.push({ field: 'total', message: 'Amount seems unreasonably high' });
  }

  // Tax validation
  if (ocrData.taxAmount) {
    const taxAmount = parseFloat(ocrData.taxAmount);
    if (isNaN(taxAmount) || taxAmount < 0) {
      errors.push({ field: 'tax', message: 'Tax amount must be non-negative' });
    }
    if (taxAmount > totalAmount) {
      errors.push({ field: 'tax', message: 'Tax cannot exceed total amount' });
    }
  }

  // Category validation
  const validCategories = [
    'food', 'transportation', 'office', 'utilities',
    'healthcare', 'entertainment', 'travel', 'other'
  ];
  if (!validCategories.includes(ocrData.category)) {
    errors.push({ field: 'category', message: 'Invalid category selected' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * EXAMPLE 7: Integration with Redux/Context
 * 
 * Shows how to use the component with state management
 */
// Using Context API
const ReceiptContext = React.createContext();

const ReceiptProvider = ({ children }) => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);

  const saveReceipt = async (ocrData) => {
    setLoading(true);
    try {
      // Save to database
      const result = await saveOCRData(ocrData.receiptId, ocrData);
      
      // Update local state
      setReceipts(prev => [...prev, ocrData]);
      
      return result;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ReceiptContext.Provider value={{ receipts, loading, saveReceipt }}>
      {children}
    </ReceiptContext.Provider>
  );
};

// Usage in component
const ReceiptPreviewWithContext = ({ ocrData, receiptId }) => {
  const { saveReceipt } = React.useContext(ReceiptContext);

  const handleSave = async (editedData) => {
    await saveReceipt({
      ...editedData,
      receiptId,
    });
  };

  return (
    <ReceiptPreviewScreen
      ocrData={ocrData}
      receiptId={receiptId}
      onSaveSuccess={(data) => handleSave(data.ocrData)}
    />
  );
};

export {
  CaptureFlowExample,
  AdvancedCaptureFlow,
  TestReceiptPreviewScreen,
  ReceiptProvider,
  ReceiptPreviewWithContext,
};
