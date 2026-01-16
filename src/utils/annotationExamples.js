/**
 * IMAGE ANNOTATION INTEGRATION EXAMPLES
 * 
 * This file demonstrates how to integrate the image annotation utilities
 * into your Receipt Keeper screens and components.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';

// Import annotation utilities
import {
  annotateReceiptImage,
  annotateReceiptImageBatch,
  extractAnnotationMetadata,
} from './imageAnnotator';
import { AnnotatedReceiptImageRenderer, useAnnotatedImage } from './skiaCanvasRenderer';

/**
 * EXAMPLE 1: Basic Annotation in Capture Flow
 * =============================================
 * 
 * Integration point: After OCR extraction in CaptureScreen
 */
export async function integrateAnnotationInCapture(
  originalImagePath,
  ocrResult,
  navigation
) {
  try {
    // Extract OCR fields using existing ocrFieldExtractor
    const ocrData = {
      vendor: ocrResult.vendor || 'Unknown',
      date: ocrResult.date || new Date().toISOString(),
      amount: ocrResult.amount || '0.00',
      tax: ocrResult.tax || '0.00',
      invoiceNumber: ocrResult.invoiceNumber || 'N/A',
    };

    // Generate output path for annotated image
    const timestamp = Date.now();
    const outputPath = originalImagePath.replace(
      /\.[^/.]+$/,
      `_annotated_${timestamp}.jpg`
    );

    console.log('Starting annotation:', {
      original: originalImagePath,
      output: outputPath,
      ocrData,
    });

    // Annotate the image
    const annotatedPath = await annotateReceiptImage(
      originalImagePath,
      ocrData,
      outputPath
    );

    console.log('✅ Annotation complete:', annotatedPath);

    // Navigate to preview with annotated image
    navigation.navigate('ReceiptPreview', {
      imagePath: annotatedPath,
      ocrData: ocrData,
      originalImagePath: originalImagePath,
    });

    return annotatedPath;
  } catch (error) {
    console.error('❌ Annotation failed:', error);
    
    Toast.show({
      type: 'error',
      text1: 'Annotation Failed',
      text2: error.message,
      duration: 4000,
    });

    throw error;
  }
}

/**
 * EXAMPLE 2: Receipt Preview Screen with Annotation
 * ==================================================
 * 
 * Enhanced preview screen that displays annotated image
 */
export function ReceiptPreviewScreenWithAnnotation({
  route,
  navigation,
}) {
  const { imagePath, ocrData } = route.params;
  const [annotatedImagePath, setAnnotatedImagePath] = useState(imagePath);
  const [loading, setLoading] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const { imageUri, loading: imageLoading, error: imageError } = useAnnotatedImage(
    annotatedImagePath,
    ocrData
  );

  const handleReAnnotate = async () => {
    setLoading(true);
    try {
      const timestamp = Date.now();
      const newOutputPath = imagePath.replace(
        /\.[^/.]+$/,
        `_annotated_${timestamp}.jpg`
      );

      const result = await annotateReceiptImage(
        imagePath,
        ocrData,
        newOutputPath
      );

      setAnnotatedImagePath(result);
      
      Toast.show({
        type: 'success',
        text1: 'Re-annotated',
        text2: 'Image updated successfully',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportAnnotated = async () => {
    try {
      // Export annotated image with metadata
      const metadata = await extractAnnotationMetadata(annotatedImagePath);
      
      Toast.show({
        type: 'success',
        text1: 'Exported',
        text2: `Receipt exported with annotation metadata`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Export Failed',
        text2: error.message,
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Receipt Preview</Text>
      </View>

      {/* Annotated Image Display */}
      <View style={styles.imageSection}>
        <Text style={styles.sectionTitle}>
          {showOriginal ? 'Original Receipt' : 'Annotated Receipt'}
        </Text>
        
        {imageLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : imageError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{imageError}</Text>
          </View>
        ) : imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.receiptImage}
            resizeMode="contain"
          />
        ) : null}

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowOriginal(!showOriginal)}
        >
          <Text style={styles.toggleButtonText}>
            {showOriginal ? 'Show Annotated' : 'Show Original'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* OCR Data Display */}
      <View style={styles.dataSection}>
        <Text style={styles.sectionTitle}>Extracted Data</Text>
        
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Vendor:</Text>
          <Text style={styles.dataValue}>{ocrData.vendor}</Text>
        </View>
        
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Date:</Text>
          <Text style={styles.dataValue}>{ocrData.date}</Text>
        </View>
        
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Amount:</Text>
          <Text style={styles.dataValue}>${ocrData.amount}</Text>
        </View>
        
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Tax:</Text>
          <Text style={styles.dataValue}>${ocrData.tax}</Text>
        </View>
        
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Invoice #:</Text>
          <Text style={styles.dataValue}>{ocrData.invoiceNumber}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleReAnnotate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#007AFF" />
          ) : (
            <Text style={styles.buttonText}>Re-Annotate</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleExportAnnotated}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Export</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/**
 * EXAMPLE 3: Batch Annotation Component
 * =====================================
 * 
 * For processing multiple receipts at once
 */
export function BatchAnnotationComponent({ receipts, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState([]);

  const handleBatchProcess = async () => {
    setProcessing(true);
    setProgress(0);
    setResults([]);
    setErrors([]);

    try {
      const annotationTasks = receipts.map((receipt, index) => ({
        imagePath: receipt.imagePath,
        ocrData: receipt.ocrData,
        outputPath: receipt.outputPath || receipt.imagePath.replace(
          /\.[^/.]+$/,
          `_annotated_${Date.now()}.jpg`
        ),
      }));

      const processedResults = await annotateReceiptImageBatch(
        annotationTasks,
        (progressData) => {
          setProgress(progressData.current / progressData.total);

          if (progressData.success) {
            setResults((prev) => [...prev, progressData.path]);
          } else {
            setErrors((prev) => [...prev, {
              index: progressData.current - 1,
              error: progressData.error,
            }]);
          }
        }
      );

      Toast.show({
        type: 'success',
        text1: 'Batch Complete',
        text2: `Processed ${processedResults.length} receipts`,
      });

      if (onComplete) {
        onComplete({ results: processedResults, errors });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Batch Failed',
        text2: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Batch Annotation</Text>
      </View>

      {/* Progress Bar */}
      {processing && (
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>
            {Math.round(progress * 100)}% Complete
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%` },
              ]}
            />
          </View>
        </View>
      )}

      {/* Results Summary */}
      {results.length > 0 && (
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Results</Text>
          <Text style={styles.summaryText}>
            ✅ Successfully processed: {results.length}
          </Text>
          {errors.length > 0 && (
            <Text style={styles.summaryText}>
              ❌ Failed: {errors.length}
            </Text>
          )}
        </View>
      )}

      {/* Action Button */}
      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={handleBatchProcess}
        disabled={processing}
      >
        {processing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            Process {receipts.length} Receipts
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

/**
 * EXAMPLE 4: Annotation Settings Component
 * ========================================
 * 
 * Allow users to customize annotation appearance
 */
export function AnnotationSettingsComponent() {
  const [settings, setSettings] = useState({
    enableAnnotation: true,
    headerHeight: 150,
    fontSize: 14,
    includeInvoiceNumber: true,
    includeTaxAmount: true,
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Annotation Settings</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Enable Annotation</Text>
          <TouchableOpacity
            style={[
              styles.toggle,
              { backgroundColor: settings.enableAnnotation ? '#34C759' : '#CCCCCC' },
            ]}
            onPress={() =>
              setSettings({
                ...settings,
                enableAnnotation: !settings.enableAnnotation,
              })
            }
          >
            <View style={styles.toggleSwitch} />
          </TouchableOpacity>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>
            Header Height: {settings.headerHeight}px
          </Text>
          {/* Slider would go here */}
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>
            Font Size: {settings.fontSize}pt
          </Text>
          {/* Slider would go here */}
        </View>
      </View>
    </ScrollView>
  );
}

/**
 * STYLES
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  imageSection: {
    padding: 16,
  },
  receiptImage: {
    width: '100%',
    height: 400,
    marginBottom: 12,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
  },
  errorText: {
    color: '#C62828',
    textAlign: 'center',
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#E8E8E8',
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  dataSection: {
    padding: 16,
    backgroundColor: '#F8F8F8',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  dataValue: {
    fontSize: 14,
    color: '#333333',
  },
  actionSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#E8E8E8',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressSection: {
    padding: 16,
  },
  progressText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  summarySection: {
    padding: 16,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 12,
    color: '#666666',
    marginVertical: 2,
  },
  settingsSection: {
    padding: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  settingLabel: {
    fontSize: 14,
    color: '#333333',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
});

export default {
  integrateAnnotationInCapture,
  ReceiptPreviewScreenWithAnnotation,
  BatchAnnotationComponent,
  AnnotationSettingsComponent,
};
