import RNFS from 'react-native-fs';
import PDFLib from 'react-native-pdf-lib';
import { getDatabase } from '../database/database';

/**
 * PDF Generator Service for Monthly Receipt Reports
 * 
 * This service generates comprehensive monthly receipt PDF reports that can be uploaded to OneDrive.
 * Each PDF includes:
 * - Page 1: Summary table of all receipts with key information
 * - Pages 2+: Full-page receipt details with header and image
 * 
 * Features:
 * - Queries database for receipts with OCR data
 * - Handles missing/empty months gracefully
 * - Comprehensive error handling and logging
 * - Ready for OneDrive upload integration
 */

// ==================== CONSTANTS ====================

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const PDF_OUTPUT_DIR = `${RNFS.DocumentDirectoryPath}/ReceiptKeeper/PDFs`;

// Page dimensions (8.5" x 11" in points)
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - (2 * MARGIN);

// Colors
const COLORS = {
  text: '#000000',
  lightGray: '#E8E8E8',
  darkGray: '#555555',
  blue: '#0066CC',
  green: '#008000',
  red: '#CC0000',
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get month name from month number (01-12)
 * @param {string|number} monthNum - Month number (01-12 or 1-12)
 * @returns {string} - Month name
 */
const getMonthName = (monthNum) => {
  const index = parseInt(monthNum, 10) - 1;
  if (index < 0 || index > 11) {
    throw new Error(`Invalid month number: ${monthNum}`);
  }
  return MONTH_NAMES[index];
};

/**
 * Format currency amount
 * @param {number|string} amount - Amount to format
 * @returns {string} - Formatted amount (e.g., "$123.45")
 */
const formatCurrency = (amount) => {
  if (!amount) return '$0.00';
  return `$${parseFloat(amount).toFixed(2)}`;
};

/**
 * Format date to readable format
 * @param {string} dateStr - Date string from database (ISO format)
 * @returns {string} - Formatted date (e.g., "03/15/2024")
 */
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  } catch (error) {
    console.warn(`Failed to format date: ${dateStr}`, error);
    return 'N/A';
  }
};

/**
 * Ensure PDF output directory exists
 * @returns {Promise<string>} - Full path to PDF directory
 */
const ensurePDFDirectory = async () => {
  try {
    const dirExists = await RNFS.exists(PDF_OUTPUT_DIR);
    if (!dirExists) {
      await RNFS.mkdir(PDF_OUTPUT_DIR, { NSURLIsExcludedFromBackupKey: false });
      console.log(`Created PDF directory: ${PDF_OUTPUT_DIR}`);
    }
    return PDF_OUTPUT_DIR;
  } catch (error) {
    console.error('Error ensuring PDF directory exists:', error);
    throw new Error(`Failed to create PDF directory: ${error.message}`);
  }
};

/**
 * Query database for receipts in a specific month
 * @param {string} year - Year (YYYY format)
 * @param {string} month - Month (01-12 format)
 * @returns {Promise<Array>} - Array of receipt objects with OCR data
 */
const getMonthlyReceipts = async (year, month) => {
  try {
    const db = getDatabase();
    
    // Validate inputs
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);
    
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      throw new Error(`Invalid year: ${year}`);
    }
    
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      throw new Error(`Invalid month: ${month}`);
    }
    
    // Format month to 2 digits for consistency
    const formattedMonth = String(monthNum).padStart(2, '0');
    
    // Query database for receipts in the specified month
    // Include all OCR-extracted data for display
    const results = await db.executeSql(
      `SELECT 
        id,
        filename,
        file_path,
        date_captured,
        vendor_name,
        total_amount,
        tax_amount,
        invoice_number,
        category,
        currency,
        ocr_confidence,
        payment_method,
        card_name,
        created_at
      FROM receipts 
      WHERE year = ? AND month = ?
      ORDER BY date_captured ASC`,
      [year, formattedMonth]
    );
    
    const receipts = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      receipts.push(results[0].rows.item(i));
    }
    
    console.log(`Found ${receipts.length} receipts for ${year}-${formattedMonth}`);
    return receipts;
  } catch (error) {
    console.error('Error querying monthly receipts:', error);
    throw error;
  }
};

/**
 * Calculate summary statistics for receipts
 * @param {Array} receipts - Array of receipt objects
 * @returns {Object} - Statistics object
 */
const calculateSummaryStats = (receipts) => {
  const stats = {
    totalCount: receipts.length,
    totalAmount: 0,
    totalTax: 0,
    byCategory: {},
    byPaymentMethod: {},
  };

  receipts.forEach((receipt) => {
    // Sum amounts
    stats.totalAmount += parseFloat(receipt.total_amount) || 0;
    stats.totalTax += parseFloat(receipt.tax_amount) || 0;

    // Count by category
    const category = receipt.category || 'Uncategorized';
    stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

    // Count by payment method
    const method = receipt.payment_method || 'Unknown';
    stats.byPaymentMethod[method] = (stats.byPaymentMethod[method] || 0) + 1;
  });

  return stats;
};

// ==================== PDF GENERATION FUNCTIONS ====================

/**
 * Create summary page with table of all receipts
 * @param {Array} receipts - Array of receipt objects
 * @param {string} year - Year
 * @param {string} month - Month
 * @returns {Promise<string>} - PDF content as base64
 */
const createSummaryPage = async (receipts, year, month) => {
  try {
    const monthName = getMonthName(month);
    const stats = calculateSummaryStats(receipts);

    // Start PDF with summary page
    const pdf = PDFLib.PDFDocument.create();
    const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

    // Title
    page.drawText(`Monthly Receipt Summary - ${monthName} ${year}`, {
      x: MARGIN,
      y: PAGE_HEIGHT - MARGIN - 30,
      fontSize: 24,
      fontColor: COLORS.blue,
    });

    // Summary statistics box
    let yPos = PAGE_HEIGHT - MARGIN - 70;

    // Statistics header
    page.drawText('Summary Statistics', {
      x: MARGIN,
      y: yPos,
      fontSize: 14,
      fontColor: COLORS.darkGray,
    });
    yPos -= 25;

    // Draw stats table
    const statsData = [
      ['Total Receipts', receipts.length.toString()],
      ['Total Amount', formatCurrency(stats.totalAmount)],
      ['Total Tax', formatCurrency(stats.totalTax)],
      ['Net Amount', formatCurrency(stats.totalAmount - stats.totalTax)],
    ];

    statsData.forEach(([label, value]) => {
      page.drawText(label, {
        x: MARGIN + 10,
        y: yPos,
        fontSize: 11,
      });
      page.drawText(value, {
        x: MARGIN + 250,
        y: yPos,
        fontSize: 11,
        fontColor: COLORS.blue,
      });
      yPos -= 20;
    });

    // Detailed receipts table
    yPos -= 20;
    page.drawText('Receipt Details', {
      x: MARGIN,
      y: yPos,
      fontSize: 14,
      fontColor: COLORS.darkGray,
    });
    yPos -= 25;

    // Table header
    const tableHeaders = ['Date', 'Vendor', 'Amount', 'Tax', 'Invoice#'];
    const colWidths = [80, 200, 80, 70, 100];
    let xPos = MARGIN;

    tableHeaders.forEach((header, index) => {
      page.drawText(header, {
        x: xPos,
        y: yPos,
        fontSize: 10,
        fontColor: '#FFFFFF',
      });
      
      // Draw background for header
      page.drawRect({
        x: xPos - 5,
        y: yPos - 15,
        width: colWidths[index],
        height: 15,
        color: COLORS.lightGray,
        borderColor: COLORS.darkGray,
        borderWidth: 0.5,
      });

      xPos += colWidths[index];
    });

    yPos -= 25;

    // Table rows
    receipts.forEach((receipt, index) => {
      // Alternate row colors for readability
      if (index % 2 === 0) {
        page.drawRect({
          x: MARGIN,
          y: yPos - 12,
          width: CONTENT_WIDTH,
          height: 18,
          color: '#F5F5F5',
        });
      }

      const rowData = [
        formatDate(receipt.date_captured),
        receipt.vendor_name || 'N/A',
        formatCurrency(receipt.total_amount),
        formatCurrency(receipt.tax_amount),
        receipt.invoice_number || 'N/A',
      ];

      xPos = MARGIN;
      rowData.forEach((data, colIndex) => {
        page.drawText(data, {
          x: xPos + 5,
          y: yPos - 8,
          fontSize: 9,
        });
        xPos += colWidths[colIndex];
      });

      yPos -= 20;

      // Check if we need a new page for the table
      if (yPos < MARGIN + 50) {
        // Continue on next page if needed
        yPos = PAGE_HEIGHT - MARGIN;
      }
    });

    return await pdf.write();
  } catch (error) {
    console.error('Error creating summary page:', error);
    throw new Error(`Failed to create summary page: ${error.message}`);
  }
};

/**
 * Create detail pages for each receipt with image
 * @param {Array} receipts - Array of receipt objects
 * @returns {Promise<string>} - PDF content as base64
 */
const createDetailPages = async (receipts) => {
  try {
    const pdf = PDFLib.PDFDocument.create();

    for (const receipt of receipts) {
      const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

      // Header section with receipt information
      // Background box
      page.drawRect({
        x: MARGIN,
        y: PAGE_HEIGHT - MARGIN - 120,
        width: CONTENT_WIDTH,
        height: 110,
        color: COLORS.lightGray,
        borderColor: COLORS.darkGray,
        borderWidth: 1,
      });

      let yPos = PAGE_HEIGHT - MARGIN - 35;

      // Receipt info in two columns
      const leftColX = MARGIN + 15;
      const rightColX = MARGIN + CONTENT_WIDTH / 2;
      const fieldSpacing = 22;

      // Left column
      page.drawText('VENDOR', {
        x: leftColX,
        y: yPos,
        fontSize: 9,
        fontColor: COLORS.darkGray,
      });
      page.drawText(receipt.vendor_name || 'N/A', {
        x: leftColX,
        y: yPos - 15,
        fontSize: 12,
        fontColor: COLORS.blue,
      });

      yPos -= fieldSpacing;

      page.drawText('DATE', {
        x: leftColX,
        y: yPos,
        fontSize: 9,
        fontColor: COLORS.darkGray,
      });
      page.drawText(formatDate(receipt.date_captured), {
        x: leftColX,
        y: yPos - 15,
        fontSize: 12,
        fontColor: COLORS.text,
      });

      yPos -= fieldSpacing;

      page.drawText('CATEGORY', {
        x: leftColX,
        y: yPos,
        fontSize: 9,
        fontColor: COLORS.darkGray,
      });
      page.drawText(receipt.category || 'N/A', {
        x: leftColX,
        y: yPos - 15,
        fontSize: 11,
        fontColor: COLORS.text,
      });

      // Right column
      yPos = PAGE_HEIGHT - MARGIN - 35;

      page.drawText('AMOUNT', {
        x: rightColX,
        y: yPos,
        fontSize: 9,
        fontColor: COLORS.darkGray,
      });
      page.drawText(formatCurrency(receipt.total_amount), {
        x: rightColX,
        y: yPos - 15,
        fontSize: 14,
        fontColor: COLORS.green,
      });

      yPos -= fieldSpacing;

      page.drawText('TAX', {
        x: rightColX,
        y: yPos,
        fontSize: 9,
        fontColor: COLORS.darkGray,
      });
      page.drawText(formatCurrency(receipt.tax_amount), {
        x: rightColX,
        y: yPos - 15,
        fontSize: 12,
        fontColor: COLORS.text,
      });

      yPos -= fieldSpacing;

      page.drawText('INVOICE#', {
        x: rightColX,
        y: yPos,
        fontSize: 9,
        fontColor: COLORS.darkGray,
      });
      page.drawText(receipt.invoice_number || 'N/A', {
        x: rightColX,
        y: yPos - 15,
        fontSize: 12,
        fontColor: COLORS.text,
      });

      // Add metadata line
      const metadata = `Payment: ${receipt.payment_method || 'N/A'} | Card: ${receipt.card_name || 'N/A'} | Confidence: ${receipt.ocr_confidence || 'N/A'}%`;
      page.drawText(metadata, {
        x: MARGIN + 10,
        y: PAGE_HEIGHT - MARGIN - 128,
        fontSize: 8,
        fontColor: COLORS.darkGray,
      });

      // Receipt image section
      try {
        if (receipt.file_path) {
          const fileExists = await RNFS.exists(receipt.file_path);
          if (fileExists) {
            // Read image as base64
            const imageData = await RNFS.readFile(receipt.file_path, 'base64');
            
            // Determine image dimensions to fit the page
            const imageMaxWidth = CONTENT_WIDTH;
            const imageMaxHeight = PAGE_HEIGHT - MARGIN - 180; // Leave space for header

            // Add image to page - PDFLib will handle scaling
            const image = await pdf.embedPng(`data:image/png;base64,${imageData}`);
            
            // Calculate aspect ratio and dimensions
            const { width: imgWidth, height: imgHeight } = image;
            const aspectRatio = imgWidth / imgHeight;
            
            let finalWidth = imageMaxWidth;
            let finalHeight = finalWidth / aspectRatio;

            if (finalHeight > imageMaxHeight) {
              finalHeight = imageMaxHeight;
              finalWidth = finalHeight * aspectRatio;
            }

            // Center image horizontally
            const imageX = MARGIN + (CONTENT_WIDTH - finalWidth) / 2;
            const imageY = MARGIN + 20;

            page.drawImage(image, {
              x: imageX,
              y: imageY,
              width: finalWidth,
              height: finalHeight,
            });

            console.log(`Added receipt image: ${receipt.filename}`);
          } else {
            page.drawText(`[Image not found: ${receipt.file_path}]`, {
              x: MARGIN + 20,
              y: PAGE_HEIGHT - 300,
              fontSize: 10,
              fontColor: COLORS.red,
            });
          }
        }
      } catch (imageError) {
        console.warn(`Failed to add receipt image for ${receipt.filename}:`, imageError);
        page.drawText(`[Failed to load image: ${imageError.message}]`, {
          x: MARGIN + 20,
          y: PAGE_HEIGHT - 300,
          fontSize: 9,
          fontColor: COLORS.red,
        });
      }

      // Footer with page info
      page.drawText(`Receipt ID: ${receipt.id} | File: ${receipt.filename}`, {
        x: MARGIN,
        y: MARGIN,
        fontSize: 8,
        fontColor: COLORS.darkGray,
      });
    }

    return await pdf.write();
  } catch (error) {
    console.error('Error creating detail pages:', error);
    throw new Error(`Failed to create detail pages: ${error.message}`);
  }
};

/**
 * Combine summary and detail pages into final PDF
 * Note: Since PDFLib doesn't natively support merging PDFs, we generate all pages
 * in a single PDF object. The summary is created as the first page.
 * 
 * @param {Array} receipts - Array of receipt objects
 * @param {string} year - Year
 * @param {string} month - Month
 * @returns {Promise<Buffer>} - Combined PDF as buffer
 */
const combinePDFPages = async (receipts, year, month) => {
  try {
    const monthName = getMonthName(month);

    // Create a single PDF with all pages
    const pdf = PDFLib.PDFDocument.create();

    // ========== PAGE 1: SUMMARY ==========
    const summaryPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    
    // Title
    summaryPage.drawText(`Monthly Receipt Summary - ${monthName} ${year}`, {
      x: MARGIN,
      y: PAGE_HEIGHT - MARGIN - 30,
      fontSize: 24,
      fontColor: COLORS.blue,
    });

    // Summary statistics box
    let yPos = PAGE_HEIGHT - MARGIN - 70;

    // Statistics header
    summaryPage.drawText('Summary Statistics', {
      x: MARGIN,
      y: yPos,
      fontSize: 14,
      fontColor: COLORS.darkGray,
    });
    yPos -= 25;

    // Calculate stats
    const stats = calculateSummaryStats(receipts);

    // Draw stats table
    const statsData = [
      ['Total Receipts', receipts.length.toString()],
      ['Total Amount', formatCurrency(stats.totalAmount)],
      ['Total Tax', formatCurrency(stats.totalTax)],
      ['Net Amount', formatCurrency(stats.totalAmount - stats.totalTax)],
    ];

    statsData.forEach(([label, value]) => {
      summaryPage.drawText(label, {
        x: MARGIN + 10,
        y: yPos,
        fontSize: 11,
      });
      summaryPage.drawText(value, {
        x: MARGIN + 250,
        y: yPos,
        fontSize: 11,
        fontColor: COLORS.blue,
      });
      yPos -= 20;
    });

    // Category breakdown
    if (Object.keys(stats.byCategory).length > 0) {
      yPos -= 15;
      summaryPage.drawText('By Category:', {
        x: MARGIN,
        y: yPos,
        fontSize: 11,
        fontColor: COLORS.darkGray,
      });
      yPos -= 18;

      Object.entries(stats.byCategory).forEach(([category, count]) => {
        summaryPage.drawText(`${category}:`, {
          x: MARGIN + 15,
          y: yPos,
          fontSize: 10,
        });
        summaryPage.drawText(count.toString(), {
          x: MARGIN + 200,
          y: yPos,
          fontSize: 10,
          fontColor: COLORS.blue,
        });
        yPos -= 16;
      });
    }

    // Detailed receipts table
    yPos -= 15;
    summaryPage.drawText('Receipt Details', {
      x: MARGIN,
      y: yPos,
      fontSize: 14,
      fontColor: COLORS.darkGray,
    });
    yPos -= 25;

    // Table header background
    summaryPage.drawRect({
      x: MARGIN,
      y: yPos - 18,
      width: CONTENT_WIDTH,
      height: 18,
      color: '#333333',
    });

    // Table header
    const tableHeaders = ['Date', 'Vendor', 'Amount', 'Tax', 'Invoice#'];
    const colWidths = [80, 200, 80, 70, 100];
    let xPos = MARGIN;

    tableHeaders.forEach((header, index) => {
      summaryPage.drawText(header, {
        x: xPos + 5,
        y: yPos - 12,
        fontSize: 10,
        fontColor: '#FFFFFF',
      });
      xPos += colWidths[index];
    });

    yPos -= 25;

    // Table rows
    receipts.forEach((receipt, index) => {
      // Alternate row colors for readability
      if (index % 2 === 0) {
        summaryPage.drawRect({
          x: MARGIN,
          y: yPos - 12,
          width: CONTENT_WIDTH,
          height: 18,
          color: '#F9F9F9',
        });
      }

      const rowData = [
        formatDate(receipt.date_captured),
        (receipt.vendor_name || 'N/A').substring(0, 25),
        formatCurrency(receipt.total_amount),
        formatCurrency(receipt.tax_amount),
        (receipt.invoice_number || 'N/A').substring(0, 12),
      ];

      xPos = MARGIN;
      rowData.forEach((data, colIndex) => {
        summaryPage.drawText(data, {
          x: xPos + 5,
          y: yPos - 8,
          fontSize: 9,
        });
        xPos += colWidths[colIndex];
      });

      yPos -= 18;

      // Add page break if needed (leave space for footer)
      if (yPos < MARGIN + 30) {
        // Create new summary continuation page if needed
        const continuePage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        yPos = PAGE_HEIGHT - MARGIN - 30;

        // Add header to continuation page
        continuePage.drawText('Receipt Details (continued)', {
          x: MARGIN,
          y: yPos,
          fontSize: 12,
          fontColor: COLORS.darkGray,
        });
        yPos -= 25;
      }
    });

    // Footer for summary page
    summaryPage.drawText('This is a summary page. See following pages for individual receipt details.', {
      x: MARGIN,
      y: MARGIN,
      fontSize: 8,
      fontColor: COLORS.darkGray,
    });

    // ========== PAGES 2+: RECEIPT DETAILS ==========
    for (const receipt of receipts) {
      const detailPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

      // Header section with receipt information
      // Background box
      detailPage.drawRect({
        x: MARGIN,
        y: PAGE_HEIGHT - MARGIN - 120,
        width: CONTENT_WIDTH,
        height: 110,
        color: '#F0F0F0',
        borderColor: COLORS.darkGray,
        borderWidth: 1,
      });

      let detailYPos = PAGE_HEIGHT - MARGIN - 35;

      // Receipt info in two columns
      const leftColX = MARGIN + 15;
      const rightColX = MARGIN + CONTENT_WIDTH / 2;
      const fieldSpacing = 22;

      // Left column
      detailPage.drawText('VENDOR', {
        x: leftColX,
        y: detailYPos,
        fontSize: 9,
        fontColor: COLORS.darkGray,
      });
      detailPage.drawText(receipt.vendor_name || 'N/A', {
        x: leftColX,
        y: detailYPos - 15,
        fontSize: 12,
        fontColor: COLORS.blue,
      });

      detailYPos -= fieldSpacing;

      detailPage.drawText('DATE', {
        x: leftColX,
        y: detailYPos,
        fontSize: 9,
        fontColor: COLORS.darkGray,
      });
      detailPage.drawText(formatDate(receipt.date_captured), {
        x: leftColX,
        y: detailYPos - 15,
        fontSize: 12,
        fontColor: COLORS.text,
      });

      detailYPos -= fieldSpacing;

      detailPage.drawText('CATEGORY', {
        x: leftColX,
        y: detailYPos,
        fontSize: 9,
        fontColor: COLORS.darkGray,
      });
      detailPage.drawText(receipt.category || 'N/A', {
        x: leftColX,
        y: detailYPos - 15,
        fontSize: 11,
        fontColor: COLORS.text,
      });

      // Right column
      detailYPos = PAGE_HEIGHT - MARGIN - 35;

      detailPage.drawText('AMOUNT', {
        x: rightColX,
        y: detailYPos,
        fontSize: 9,
        fontColor: COLORS.darkGray,
      });
      detailPage.drawText(formatCurrency(receipt.total_amount), {
        x: rightColX,
        y: detailYPos - 15,
        fontSize: 14,
        fontColor: COLORS.green,
      });

      detailYPos -= fieldSpacing;

      detailPage.drawText('TAX', {
        x: rightColX,
        y: detailYPos,
        fontSize: 9,
        fontColor: COLORS.darkGray,
      });
      detailPage.drawText(formatCurrency(receipt.tax_amount), {
        x: rightColX,
        y: detailYPos - 15,
        fontSize: 12,
        fontColor: COLORS.text,
      });

      detailYPos -= fieldSpacing;

      detailPage.drawText('INVOICE#', {
        x: rightColX,
        y: detailYPos,
        fontSize: 9,
        fontColor: COLORS.darkGray,
      });
      detailPage.drawText(receipt.invoice_number || 'N/A', {
        x: rightColX,
        y: detailYPos - 15,
        fontSize: 12,
        fontColor: COLORS.text,
      });

      // Add metadata line
      const paymentMethod = receipt.payment_method || 'N/A';
      const cardName = receipt.card_name || 'N/A';
      const confidence = receipt.ocr_confidence ? `${receipt.ocr_confidence}%` : 'N/A';
      const metadata = `Payment: ${paymentMethod} | Card: ${cardName} | OCR Confidence: ${confidence}`;
      
      detailPage.drawText(metadata, {
        x: MARGIN + 10,
        y: PAGE_HEIGHT - MARGIN - 128,
        fontSize: 7,
        fontColor: COLORS.darkGray,
      });

      // Receipt image section
      try {
        if (receipt.file_path) {
          const fileExists = await RNFS.exists(receipt.file_path);
          if (fileExists) {
            // Read image as base64
            const imageData = await RNFS.readFile(receipt.file_path, 'base64');
            
            // Determine image type from file extension
            const fileExt = receipt.file_path.toLowerCase().split('.').pop();
            const imageType = fileExt === 'png' ? 'png' : 'jpeg';
            
            // Determine image dimensions to fit the page
            const imageMaxWidth = CONTENT_WIDTH - 20;
            const imageMaxHeight = PAGE_HEIGHT - MARGIN - 180;

            try {
              // Embed and add image
              let image;
              if (imageType === 'png') {
                image = await pdf.embedPng(`data:image/png;base64,${imageData}`);
              } else {
                image = await pdf.embedJpg(`data:image/jpeg;base64,${imageData}`);
              }
              
              // Calculate aspect ratio and dimensions
              const { width: imgWidth, height: imgHeight } = image;
              const aspectRatio = imgWidth / imgHeight;
              
              let finalWidth = imageMaxWidth;
              let finalHeight = finalWidth / aspectRatio;

              if (finalHeight > imageMaxHeight) {
                finalHeight = imageMaxHeight;
                finalWidth = finalHeight * aspectRatio;
              }

              // Center image horizontally
              const imageX = MARGIN + 10 + (CONTENT_WIDTH - 20 - finalWidth) / 2;
              const imageY = MARGIN + 20;

              detailPage.drawImage(image, {
                x: imageX,
                y: imageY,
                width: finalWidth,
                height: finalHeight,
              });

              console.log(`Added receipt image: ${receipt.filename}`);
            } catch (imageEmbedError) {
              console.warn(`Failed to embed image for ${receipt.filename}:`, imageEmbedError);
              detailPage.drawText(`[Failed to embed image: ${imageEmbedError.message}]`, {
                x: MARGIN + 20,
                y: PAGE_HEIGHT - 300,
                fontSize: 9,
                fontColor: COLORS.red,
              });
            }
          } else {
            detailPage.drawText(`[Image file not found: ${receipt.filename}]`, {
              x: MARGIN + 20,
              y: PAGE_HEIGHT - 300,
              fontSize: 9,
              fontColor: COLORS.red,
            });
          }
        }
      } catch (imageError) {
        console.warn(`Error processing receipt image ${receipt.filename}:`, imageError);
        detailPage.drawText(`[Error loading image]`, {
          x: MARGIN + 20,
          y: PAGE_HEIGHT - 300,
          fontSize: 9,
          fontColor: COLORS.red,
        });
      }

      // Footer with page info
      const footerText = `Receipt ID: ${receipt.id} | ${receipt.filename} | Uploaded: ${formatDate(receipt.created_at)}`;
      detailPage.drawText(footerText, {
        x: MARGIN,
        y: MARGIN,
        fontSize: 7,
        fontColor: COLORS.darkGray,
      });
    }

    return await pdf.write();
  } catch (error) {
    console.error('Error combining PDF pages:', error);
    throw new Error(`Failed to combine PDF pages: ${error.message}`);
  }
};

// ==================== PUBLIC API ====================

/**
 * Generate a monthly receipt PDF report
 * 
 * This is the main public function for generating monthly PDF reports.
 * It handles the entire process from database queries to file creation.
 * 
 * @param {string|number} year - Year in YYYY format (e.g., "2024")
 * @param {string|number} month - Month in MM format (01-12)
 * @returns {Promise<Object>} - Object containing:
 *   - filePath: Full path to generated PDF
 *   - fileName: Generated filename
 *   - receiptsCount: Number of receipts in the report
 *   - totalAmount: Total amount of all receipts
 *   - success: Boolean indicating success
 * 
 * @throws {Error} - Throws error if generation fails
 * 
 * @example
 * try {
 *   const result = await generateMonthlyReceiptPDF('2024', '03');
 *   console.log(`PDF created at: ${result.filePath}`);
 *   console.log(`Total amount: ${result.totalAmount}`);
 *   // Now ready for OneDrive upload
 * } catch (error) {
 *   console.error('Failed to generate PDF:', error.message);
 * }
 */
export const generateMonthlyReceiptPDF = async (year, month) => {
  const startTime = Date.now();
  
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Starting PDF generation for ${year}-${String(month).padStart(2, '0')}`);
    console.log(`${'='.repeat(60)}`);

    // ========== VALIDATION ==========
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);
    
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      throw new Error(`Invalid year: ${year}. Expected format: YYYY (e.g., 2024)`);
    }
    
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      throw new Error(`Invalid month: ${month}. Expected format: MM (01-12)`);
    }

    const formattedYear = yearNum.toString();
    const formattedMonth = String(monthNum).padStart(2, '0');
    const monthName = getMonthName(monthNum);

    // ========== QUERY RECEIPTS ==========
    console.log(`Querying receipts for ${monthName} ${formattedYear}...`);
    const receipts = await getMonthlyReceipts(formattedYear, formattedMonth);

    // ========== HANDLE EMPTY MONTH ==========
    if (receipts.length === 0) {
      console.warn(`No receipts found for ${monthName} ${formattedYear}`);
      throw new Error(
        `No receipts available for ${monthName} ${formattedYear}. ` +
        'Please check that receipts exist for this month and OCR processing is complete.'
      );
    }

    console.log(`Found ${receipts.length} receipts`);

    // ========== ENSURE OUTPUT DIRECTORY ==========
    console.log('Preparing PDF output directory...');
    await ensurePDFDirectory();

    // ========== GENERATE PDF ==========
    console.log('Generating PDF document...');
    const pdfBuffer = await combinePDFPages(receipts, formattedYear, formattedMonth);

    // ========== SAVE PDF FILE ==========
    const fileName = `${formattedYear}_${monthName}_Receipts.pdf`;
    const filePath = `${PDF_OUTPUT_DIR}/${fileName}`;

    console.log(`Saving PDF to: ${filePath}`);
    await RNFS.writeFile(filePath, pdfBuffer, 'base64');

    // ========== VERIFY FILE ==========
    const fileExists = await RNFS.exists(filePath);
    if (!fileExists) {
      throw new Error(`PDF file was not created at ${filePath}`);
    }

    const fileStats = await RNFS.stat(filePath);
    const fileSizeKB = (fileStats.size / 1024).toFixed(2);

    // ========== CALCULATE SUMMARY ==========
    const stats = calculateSummaryStats(receipts);
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n${'✓'.repeat(60)}`);
    console.log(`PDF Generation Successful!`);
    console.log(`${'✓'.repeat(60)}`);
    console.log(`File: ${fileName}`);
    console.log(`Size: ${fileSizeKB} KB`);
    console.log(`Receipts: ${receipts.length}`);
    console.log(`Total Amount: ${formatCurrency(stats.totalAmount)}`);
    console.log(`Time: ${elapsedTime}s`);
    console.log(`Path: ${filePath}`);
    console.log(`\nReady for OneDrive upload!`);
    console.log(`${'='.repeat(60)}\n`);

    return {
      success: true,
      filePath,
      fileName,
      receiptsCount: receipts.length,
      totalAmount: stats.totalAmount,
      totalTax: stats.totalTax,
      fileSize: fileStats.size,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.error(`\n${'✗'.repeat(60)}`);
    console.error(`PDF Generation Failed!`);
    console.error(`${'✗'.repeat(60)}`);
    console.error(`Error: ${error.message}`);
    console.error(`Time: ${elapsedTime}s`);
    console.error(`${'='.repeat(60)}\n`);

    // Return error object instead of throwing for better integration
    return {
      success: false,
      error: error.message,
      filePath: null,
      fileName: null,
      receiptsCount: 0,
      totalAmount: 0,
    };
  }
};

/**
 * Get list of available months that have receipts
 * Useful for UI to show which months have data
 * 
 * @returns {Promise<Array>} - Array of objects with year and month info
 */
export const getAvailableMonths = async () => {
  try {
    const db = getDatabase();
    const results = await db.executeSql(
      `SELECT DISTINCT year, month FROM receipts ORDER BY year DESC, month DESC`
    );

    const months = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      const row = results[0].rows.item(i);
      months.push({
        year: row.year,
        month: row.month,
        monthName: getMonthName(row.month),
        displayName: `${getMonthName(row.month)} ${row.year}`,
      });
    }

    return months;
  } catch (error) {
    console.error('Error getting available months:', error);
    return [];
  }
};

/**
 * Check if a specific month has receipts
 * 
 * @param {string} year - Year in YYYY format
 * @param {string} month - Month in MM format
 * @returns {Promise<boolean>} - True if month has receipts
 */
export const monthHasReceipts = async (year, month) => {
  try {
    const db = getDatabase();
    const formattedMonth = String(parseInt(month, 10)).padStart(2, '0');
    
    const results = await db.executeSql(
      `SELECT COUNT(*) as count FROM receipts WHERE year = ? AND month = ?`,
      [year, formattedMonth]
    );

    const count = results[0].rows.item(0).count;
    return count > 0;
  } catch (error) {
    console.error('Error checking month receipts:', error);
    return false;
  }
};

/**
 * Delete a generated PDF file
 * Useful for cleanup or regeneration
 * 
 * @param {string} fileName - Filename to delete
 * @returns {Promise<boolean>} - True if deletion successful
 */
export const deleteGeneratedPDF = async (fileName) => {
  try {
    const filePath = `${PDF_OUTPUT_DIR}/${fileName}`;
    const exists = await RNFS.exists(filePath);
    
    if (exists) {
      await RNFS.unlink(filePath);
      console.log(`Deleted PDF: ${fileName}`);
      return true;
    }
    
    console.warn(`PDF file not found: ${fileName}`);
    return false;
  } catch (error) {
    console.error(`Failed to delete PDF ${fileName}:`, error);
    return false;
  }
};

/**
 * Get list of generated PDFs in the output directory
 * 
 * @returns {Promise<Array>} - Array of generated PDF files
 */
export const getGeneratedPDFs = async () => {
  try {
    const dirExists = await RNFS.exists(PDF_OUTPUT_DIR);
    if (!dirExists) {
      return [];
    }

    const files = await RNFS.readDir(PDF_OUTPUT_DIR);
    const pdfFiles = files
      .filter(file => file.isFile() && file.name.endsWith('.pdf'))
      .map(file => ({
        name: file.name,
        path: file.path,
        size: file.size,
        mtime: file.mtime,
      }))
      .sort((a, b) => b.mtime - a.mtime);

    return pdfFiles;
  } catch (error) {
    console.error('Error getting generated PDFs:', error);
    return [];
  }
};

export default {
  generateMonthlyReceiptPDF,
  getAvailableMonths,
  monthHasReceipts,
  deleteGeneratedPDF,
  getGeneratedPDFs,
};
