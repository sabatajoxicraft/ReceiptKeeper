/**
 * Advanced Skia Canvas Renderer for Image Annotation
 * 
 * This module provides a React component-based approach to rendering
 * annotated receipt images using @shopify/react-native-skia
 * 
 * Can be used for:
 * - Real-time annotation preview
 * - Canvas-based image generation
 * - Custom annotation styling
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Canvas, Image as SkiaImage, useImage } from '@shopify/react-native-skia';
import RNFS from 'react-native-fs';

/**
 * Configuration for annotation rendering
 */
export const ANNOTATION_STYLE = {
  header: {
    height: 150,
    backgroundColor: '#FFFFFF',
    borderColor: '#EEEEEE',
    borderWidth: 1,
  },
  text: {
    vendor: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333333',
      lineHeight: 22,
    },
    dateAmount: {
      fontSize: 14,
      fontWeight: '500',
      color: '#555555',
      lineHeight: 20,
    },
    invoice: {
      fontSize: 12,
      fontWeight: '400',
      color: '#666666',
      lineHeight: 18,
    },
    tax: {
      fontSize: 12,
      fontWeight: '400',
      color: '#666666',
      lineHeight: 18,
    },
  },
  spacing: {
    padding: 12,
    lineGap: 8,
  },
};

/**
 * Annotated Receipt Image Renderer Component
 * 
 * Renders an original receipt image with OCR data annotation header
 * using Skia canvas for high performance rendering
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.imagePath - Path to original receipt image
 * @param {Object} props.ocrData - OCR extracted data
 * @param {Object} props.style - Custom styling override
 * @param {boolean} props.showDebug - Show debug information
 * @returns {React.ReactElement}
 */
export const AnnotatedReceiptImageRenderer = ({
  imagePath,
  ocrData,
  style = {},
  showDebug = false,
}) => {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageDimensions, setImageDimensions] = useState(null);
  const skiaImageRef = useRef(null);

  const mergedStyle = { ...ANNOTATION_STYLE, ...style };

  // Load image from file system
  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if file exists
        const exists = await RNFS.exists(imagePath);
        if (!exists) {
          throw new Error(`Image not found: ${imagePath}`);
        }

        // Read image as base64
        const base64Data = await RNFS.readFile(imagePath, 'base64');
        const uri = `data:image/jpeg;base64,${base64Data}`;
        setImageUri(uri);

        // Get image dimensions using Image.getSize (if available)
        // This is a placeholder - actual implementation would need
        // native module or library integration
        setImageDimensions({
          width: 400,
          height: 600,
        });

        setLoading(false);
      } catch (err) {
        console.error('Failed to load image:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadImage();
  }, [imagePath]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading receipt...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SkiaReceiptAnnotationCanvas
        imageUri={imageUri}
        ocrData={ocrData}
        style={mergedStyle}
        showDebug={showDebug}
      />
    </View>
  );
};

/**
 * Internal Skia Canvas Component for rendering annotation
 * @private
 */
const SkiaReceiptAnnotationCanvas = ({ imageUri, ocrData, style, showDebug }) => {
  const skiaImage = useImage(imageUri);
  const canvasWidth = 400;
  const canvasHeight = 750;

  if (!skiaImage) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
      {/* Header background */}
      <SkiaRect
        x={0}
        y={0}
        width={canvasWidth}
        height={style.header.height}
        color={style.header.backgroundColor}
      />

      {/* Header border */}
      <SkiaRect
        x={0}
        y={0}
        width={canvasWidth}
        height={style.header.height}
        color={style.header.borderColor}
        strokeWidth={style.header.borderWidth}
        strokeOnly={true}
      />

      {/* Annotation text elements */}
      <SkiaAnnotationText
        ocrData={ocrData}
        style={style}
        canvasWidth={canvasWidth}
      />

      {/* Original image below header */}
      <SkiaImage
        image={skiaImage}
        x={0}
        y={style.header.height}
        width={canvasWidth}
        height={canvasHeight - style.header.height}
      />

      {/* Debug grid (optional) */}
      {showDebug && <SkiaDebugGrid canvasWidth={canvasWidth} canvasHeight={canvasHeight} />}
    </Canvas>
  );
};

/**
 * Renders annotation text elements on canvas
 * @private
 */
const SkiaAnnotationText = ({ ocrData, style, canvasWidth }) => {
  const { padding, lineGap } = style.spacing;
  let currentY = padding + 4;

  const textElements = [];

  // Vendor name
  textElements.push({
    text: ocrData.vendor || 'Unknown Vendor',
    x: padding,
    y: currentY,
    style: style.text.vendor,
  });
  currentY += style.text.vendor.lineHeight + lineGap;

  // Date and Amount
  const dateAmountText = `${formatDate(ocrData.date)} | ${formatCurrency(ocrData.amount)}`;
  textElements.push({
    text: dateAmountText,
    x: padding,
    y: currentY,
    style: style.text.dateAmount,
  });
  currentY += style.text.dateAmount.lineHeight + lineGap;

  // Invoice Number
  textElements.push({
    text: `Invoice: ${ocrData.invoiceNumber || 'N/A'}`,
    x: padding,
    y: currentY,
    style: style.text.invoice,
  });
  currentY += style.text.invoice.lineHeight + lineGap;

  // Tax Amount
  textElements.push({
    text: `Tax: ${formatCurrency(ocrData.tax || 0)}`,
    x: padding,
    y: currentY,
    style: style.text.tax,
  });

  return (
    <View>
      {textElements.map((element, index) => (
        <SkiaTextElement key={index} {...element} canvasWidth={canvasWidth} />
      ))}
    </View>
  );
};

/**
 * Individual text element renderer
 * @private
 */
const SkiaTextElement = ({ text, x, y, style, canvasWidth }) => {
  // This would be rendered using Skia's Text component
  // in the actual Canvas context
  return (
    <Text
      style={{
        position: 'absolute',
        left: x,
        top: y,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        color: style.color,
        maxWidth: canvasWidth - x - 12,
      }}
      numberOfLines={1}
    >
      {text}
    </Text>
  );
};

/**
 * Rectangle wrapper for Skia
 * @private
 */
const SkiaRect = ({ x, y, width, height, color, strokeWidth, strokeOnly }) => {
  // Placeholder - would be replaced with actual Skia Rect component
  return (
    <View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: width,
        height: height,
        backgroundColor: strokeOnly ? 'transparent' : color,
        borderWidth: strokeOnly ? strokeWidth : 0,
        borderColor: strokeOnly ? color : 'transparent',
      }}
    />
  );
};

/**
 * Debug grid overlay
 * @private
 */
const SkiaDebugGrid = ({ canvasWidth, canvasHeight }) => {
  const gridSize = 50;
  const lines = [];

  // Vertical lines
  for (let x = 0; x < canvasWidth; x += gridSize) {
    lines.push(
      <View
        key={`v-${x}`}
        style={{
          position: 'absolute',
          left: x,
          top: 0,
          width: 1,
          height: canvasHeight,
          backgroundColor: '#CCCCCC',
          opacity: 0.5,
        }}
      />
    );
  }

  // Horizontal lines
  for (let y = 0; y < canvasHeight; y += gridSize) {
    lines.push(
      <View
        key={`h-${y}`}
        style={{
          position: 'absolute',
          left: 0,
          top: y,
          width: canvasWidth,
          height: 1,
          backgroundColor: '#CCCCCC',
          opacity: 0.5,
        }}
      />
    );
  }

  return <View style={styles.debugContainer}>{lines}</View>;
};

/**
 * Utility function to format date
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr.substring(0, 10);
    }
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    return dateStr.substring(0, 10);
  }
};

/**
 * Utility function to format currency
 */
export const formatCurrency = (amount) => {
  if (!amount) return '$0.00';

  const numAmount = typeof amount === 'string'
    ? parseFloat(amount.replace(/[^0-9.]/g, ''))
    : amount;

  return `$${isNaN(numAmount) ? '0.00' : numAmount.toFixed(2)}`;
};

/**
 * Hook for managing annotated image state
 * 
 * @param {string} imagePath - Path to original image
 * @param {Object} ocrData - OCR data
 * @returns {Object} {imageUri, loading, error, retry}
 */
export const useAnnotatedImage = (imagePath, ocrData) => {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadImage = async () => {
    try {
      setLoading(true);
      setError(null);

      const exists = await RNFS.exists(imagePath);
      if (!exists) {
        throw new Error('Image file not found');
      }

      const base64Data = await RNFS.readFile(imagePath, 'base64');
      const uri = `data:image/jpeg;base64,${base64Data}`;
      setImageUri(uri);
    } catch (err) {
      console.error('Error loading image:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImage();
  }, [imagePath]);

  return {
    imageUri,
    loading,
    error,
    retry: loadImage,
  };
};

/**
 * Styles
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
  },
  errorText: {
    fontSize: 14,
    color: '#C62828',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  debugContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
});

export default {
  AnnotatedReceiptImageRenderer,
  ANNOTATION_STYLE,
  useAnnotatedImage,
  formatDate,
  formatCurrency,
};
