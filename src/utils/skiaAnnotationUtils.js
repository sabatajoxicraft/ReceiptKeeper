import { Canvas, Image as SkiaImage, Text, Group, Rect } from '@shopify/react-native-skia';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

/**
 * Skia-based canvas utilities for image annotation
 * Provides low-level drawing functions for creating annotated receipt images
 */

/**
 * Configuration for annotation styling
 */
export const ANNOTATION_CONFIG = {
  headerHeight: 150,
  headerColor: '#FFFFFF',
  padding: 12,
  
  // Typography
  vendorFontSize: 16,
  vendorFontWeight: 'bold',
  
  dateFontSize: 14,
  amountFontSize: 14,
  
  invoiceFontSize: 12,
  taxFontSize: 12,
  
  textColor: '#333333',
  
  // Spacing
  lineHeight: 22,
  verticalSpacing: 8,
};

/**
 * Draws a rounded rectangle header on the canvas
 * 
 * @param {Object} canvas - Skia canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Header height
 * @param {Object} config - Styling configuration
 */
export const drawHeaderBox = (canvas, width, height, config = ANNOTATION_CONFIG) => {
  try {
    // Draw white background header
    canvas.drawRect({
      x: 0,
      y: 0,
      width: width,
      height: height,
      color: config.headerColor,
    });

    // Optional: Draw subtle border
    canvas.drawRect({
      x: 0,
      y: 0,
      width: width,
      height: height,
      color: '#EEEEEE',
      style: 'stroke',
      strokeWidth: 1,
    });

    console.log('✓ Header box drawn');
  } catch (error) {
    console.error('Error drawing header box:', error);
    throw error;
  }
};

/**
 * Draws text with proper formatting on canvas
 * 
 * @param {Object} canvas - Skia canvas context
 * @param {string} text - Text to draw
 * @param {Object} options - Drawing options {x, y, fontSize, fontWeight, color}
 */
export const drawText = (canvas, text, options = {}) => {
  const {
    x = 12,
    y = 0,
    fontSize = 14,
    fontWeight = 'normal',
    color = '#333333',
    maxWidth = 280,
  } = options;

  try {
    // Truncate text if it exceeds maxWidth (approximate)
    let displayText = text;
    if (text.length > 30 && fontSize > 12) {
      displayText = text.substring(0, 27) + '...';
    }

    canvas.drawText({
      x: x,
      y: y,
      text: displayText,
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: color,
      family: 'System',
    });

    console.log(`✓ Text drawn: "${displayText}" at (${x}, ${y})`);
  } catch (error) {
    console.error('Error drawing text:', error);
    throw error;
  }
};

/**
 * Draws complete annotation header with all OCR data
 * 
 * @param {Object} canvas - Skia canvas context
 * @param {Object} ocrData - Extracted OCR data
 * @param {number} canvasWidth - Width of canvas
 * @param {Object} config - Styling configuration
 */
export const drawAnnotationHeader = (canvas, ocrData, canvasWidth, config = ANNOTATION_CONFIG) => {
  try {
    const { padding, lineHeight, verticalSpacing, textColor } = config;
    let currentY = padding;

    // Draw header background
    drawHeaderBox(canvas, canvasWidth, config.headerHeight, config);

    // Vendor name (bold, larger)
    drawText(canvas, ocrData.vendor || 'Unknown Vendor', {
      x: padding,
      y: currentY,
      fontSize: config.vendorFontSize,
      fontWeight: 'bold',
      color: textColor,
    });
    currentY += lineHeight;

    // Date and Amount
    const dateAmountText = `${formatDate(ocrData.date)} | ${formatCurrency(ocrData.amount)}`;
    drawText(canvas, dateAmountText, {
      x: padding,
      y: currentY,
      fontSize: config.dateFontSize,
      fontWeight: 'normal',
      color: textColor,
    });
    currentY += lineHeight;

    // Invoice Number
    drawText(canvas, `Invoice: ${ocrData.invoiceNumber || 'N/A'}`, {
      x: padding,
      y: currentY,
      fontSize: config.invoiceFontSize,
      fontWeight: 'normal',
      color: textColor,
    });
    currentY += lineHeight;

    // Tax Amount
    drawText(canvas, `Tax: ${formatCurrency(ocrData.tax || 0)}`, {
      x: padding,
      y: currentY,
      fontSize: config.taxFontSize,
      fontWeight: 'normal',
      color: textColor,
    });

    console.log('✓ Complete annotation header drawn');
  } catch (error) {
    console.error('Error drawing annotation header:', error);
    throw error;
  }
};

/**
 * Formats currency value
 * @param {string|number} amount - Amount to format
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount) => {
  if (!amount) return '$0.00';
  
  const numAmount = typeof amount === 'string'
    ? parseFloat(amount.replace(/[^0-9.]/g, ''))
    : amount;
  
  return `$${isNaN(numAmount) ? '0.00' : numAmount.toFixed(2)}`;
};

/**
 * Formats date string
 * @param {string} dateStr - Date string from OCR
 * @returns {string} Formatted date
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

export default {
  drawHeaderBox,
  drawText,
  drawAnnotationHeader,
  formatCurrency,
  formatDate,
  ANNOTATION_CONFIG,
};
