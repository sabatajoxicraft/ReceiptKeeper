/**
 * IMAGE ANNOTATION UTILITY - INTEGRATION GUIDE
 * 
 * This module provides tools for burning OCR data into receipt images using
 * react-native-skia for drawing and canvas manipulation.
 * 
 * FILES CREATED:
 * 1. src/utils/imageAnnotator.js - Main annotation engine
 * 2. src/utils/skiaAnnotationUtils.js - Skia drawing utilities
 */

import { annotateReceiptImage, annotateReceiptImageBatch } from '../utils/imageAnnotator';

/**
 * BASIC USAGE EXAMPLE
 * ====================
 */

// In your CaptureScreen or ReceiptPreviewScreen:
async function handleAnnotateReceipt() {
  try {
    const ocrData = {
      vendor: 'Starbucks',
      date: '2024-01-15',
      amount: '12.45',
      tax: '1.02',
      invoiceNumber: 'STB-20240115-001',
    };

    const imagePath = '/path/to/original/receipt.jpg';
    const outputPath = '/path/to/annotated/receipt_annotated.jpg';

    const result = await annotateReceiptImage(imagePath, ocrData, outputPath);
    
    console.log('Annotated image saved:', result);
    // Display the annotated image to user
    setAnnotatedImagePath(result);
    
  } catch (error) {
    console.error('Annotation failed:', error.message);
    // Show error toast to user
  }
}

/**
 * REACT COMPONENT INTEGRATION EXAMPLE
 * ====================================
 */

import React, { useState } from 'react';
import { View, Image, ActivityIndicator, Button, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import { annotateReceiptImage } from '../utils/imageAnnotator';

function ReceiptAnnotationComponent({ imagePath, ocrData }) {
  const [annotatedPath, setAnnotatedPath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnnotate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Generate output path in the same directory
      const timestamp = new Date().getTime();
      const outputPath = imagePath.replace(
        /\.[^/.]+$/,
        `_annotated_${timestamp}.jpg`
      );

      const result = await annotateReceiptImage(
        imagePath,
        ocrData,
        outputPath
      );

      setAnnotatedPath(result);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Receipt annotated successfully',
      });
      
    } catch (err) {
      setError(err.message);
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* Original Image */}
      <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
        Original Receipt
      </Text>
      <Image
        source={{ uri: `file://${imagePath}` }}
        style={{ height: 300, marginBottom: 16 }}
        resizeMode="contain"
      />

      {/* OCR Data Display */}
      <View style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5' }}>
        <Text>Vendor: {ocrData.vendor}</Text>
        <Text>Date: {ocrData.date}</Text>
        <Text>Amount: ${ocrData.amount}</Text>
        <Text>Tax: ${ocrData.tax}</Text>
        <Text>Invoice: {ocrData.invoiceNumber}</Text>
      </View>

      {/* Annotate Button */}
      <Button
        title={loading ? 'Processing...' : 'Annotate Receipt'}
        onPress={handleAnnotate}
        disabled={loading}
      />

      {/* Loading Indicator */}
      {loading && (
        <View style={{ marginTop: 16, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={{ marginTop: 8 }}>Creating annotated image...</Text>
        </View>
      )}

      {/* Error Message */}
      {error && (
        <View style={{ marginTop: 16, padding: 12, backgroundColor: '#ffebee' }}>
          <Text style={{ color: '#c62828' }}>Error: {error}</Text>
        </View>
      )}

      {/* Annotated Image Display */}
      {annotatedPath && (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
            Annotated Receipt
          </Text>
          <Image
            source={{ uri: `file://${annotatedPath}` }}
            style={{ height: 300 }}
            resizeMode="contain"
          />
        </View>
      )}
    </View>
  );
}

/**
 * BATCH PROCESSING EXAMPLE
 * ========================
 */

import { annotateReceiptImageBatch } from '../utils/imageAnnotator';

async function handleBatchAnnotation(receipts) {
  try {
    const results = await annotateReceiptImageBatch(
      receipts,
      (progress) => {
        console.log(
          `Processed ${progress.current}/${progress.total}: ${
            progress.success ? 'Success' : 'Failed'
          }`
        );
        
        // Update progress bar in UI
        updateProgressBar(progress.current / progress.total);
      }
    );

    console.log('Batch annotation complete:', results);
    Toast.show({
      type: 'success',
      text1: 'Batch Complete',
      text2: `Annotated ${results.length} receipts`,
    });
    
  } catch (error) {
    console.error('Batch annotation failed:', error);
  }
}

/**
 * OCR DATA FORMAT
 * ===============
 * 
 * The ocrData object should contain:
 * {
 *   vendor: string,           // Store/vendor name (required)
 *   date: string,             // Transaction date (required)
 *   amount: string|number,    // Total amount (required)
 *   tax?: string|number,      // Tax amount (optional, defaults to 0)
 *   invoiceNumber?: string,   // Invoice/receipt number (optional)
 * }
 */

/**
 * INTEGRATION WITH EXISTING SCREENS
 * ==================================
 */

// In CaptureScreen.js:
import { annotateReceiptImage } from '../utils/imageAnnotator';
import { extractOCRFields } from '../utils/ocrFieldExtractor';

async function onReceiptCaptured(imagePath, visionOCRResult) {
  try {
    // Extract OCR fields
    const ocrData = await extractOCRFields(visionOCRResult);
    
    // Generate output path
    const timestamp = new Date().getTime();
    const outputPath = imagePath.replace(/\.[^/.]+$/, `_marked_${timestamp}.jpg`);
    
    // Annotate image
    const annotatedPath = await annotateReceiptImage(imagePath, ocrData, outputPath);
    
    // Save to database with metadata
    await saveReceiptToDB({
      originalImage: imagePath,
      annotatedImage: annotatedPath,
      ocrData: ocrData,
      capturedAt: new Date(),
    });
    
    // Display preview
    navigation.navigate('ReceiptPreview', {
      imagePath: annotatedPath,
      ocrData: ocrData,
    });
    
  } catch (error) {
    console.error('Capture processing failed:', error);
    Toast.show({
      type: 'error',
      text1: 'Processing Failed',
      text2: error.message,
    });
  }
}

/**
 * REACT-NATIVE-SKIA CANVAS INTEGRATION
 * ====================================
 */

// For advanced custom rendering, use skiaAnnotationUtils:
import {
  drawHeaderBox,
  drawText,
  drawAnnotationHeader,
  ANNOTATION_CONFIG,
} from '../utils/skiaAnnotationUtils';

// This provides access to:
// - ANNOTATION_CONFIG: Configuration object for styling
// - drawHeaderBox(): Draw white header background
// - drawText(): Draw formatted text
// - drawAnnotationHeader(): Complete annotation rendering

/**
 * ERROR HANDLING
 * ==============
 * 
 * The module throws descriptive errors:
 * 
 * - "Invalid OCR data: must be an object"
 * - "Missing required field in OCR data: {field}"
 * - "Invalid imagePath: must be a non-empty string"
 * - "Source image not found: {path}"
 * - "Failed to load image: {error}"
 * - "Failed to create annotated image: {error}"
 */

/**
 * PRODUCTION DEPLOYMENT NOTES
 * ===========================
 * 
 * The current implementation saves annotation metadata as JSON.
 * For production, consider:
 * 
 * 1. ACTUAL IMAGE RENDERING
 *    - Integrate native image manipulation libraries:
 *      * Android: Android Graphics/Canvas API
 *      * iOS: CoreGraphics / Core Image
 *    - Use RN native module for layer composition
 * 
 * 2. PERFORMANCE OPTIMIZATION
 *    - Cache fonts and styles
 *    - Use workers for batch processing
 *    - Implement image compression
 * 
 * 3. QUALITY SETTINGS
 *    - Configurable JPEG quality (75-95%)
 *    - DPI/resolution preservation
 *    - Color space handling
 * 
 * 4. FONT MANAGEMENT
 *    - Bundle custom fonts if needed
 *    - Fallback font handling
 *    - Multi-language support
 */

/**
 * TESTING
 * =======
 */

// Mock data for testing:
const mockOCRData = {
  vendor: 'Target Store #1234',
  date: '2024-01-15T14:30:00Z',
  amount: '156.78',
  tax: '12.54',
  invoiceNumber: 'TGT-20240115-001',
};

// Test function:
async function testAnnotation() {
  try {
    const result = await annotateReceiptImage(
      '/mock/path/receipt.jpg',
      mockOCRData,
      '/mock/path/receipt_annotated.jpg'
    );
    
    console.log('Test passed:', result);
  } catch (error) {
    console.log('Test failed:', error.message);
  }
}

export {
  annotateReceiptImage,
  annotateReceiptImageBatch,
  handleAnnotateReceipt,
  ReceiptAnnotationComponent,
  handleBatchAnnotation,
  onReceiptCaptured,
};
