/**
 * PDF Generator Integration Examples
 * 
 * This file demonstrates how to integrate the pdfGeneratorService with
 * the rest of the ReceiptKeeper app, particularly for OneDrive uploads.
 * 
 * Copy and adapt these examples for your specific use cases.
 */

import {
  generateMonthlyReceiptPDF,
  getAvailableMonths,
  monthHasReceipts,
  deleteGeneratedPDF,
  getGeneratedPDFs,
} from './pdfGeneratorService';
import { uploadFileToOneDrive } from './onedriveService';

// ============================================================
// EXAMPLE 1: Generate and Upload Single Month to OneDrive
// ============================================================

export const generateAndUploadMonthlyReport = async (year, month) => {
  try {
    console.log(`\nGenerating PDF for ${year}-${month}...`);

    // Step 1: Generate the PDF
    const pdfResult = await generateMonthlyReceiptPDF(year, month);

    if (!pdfResult.success) {
      console.error(`PDF generation failed: ${pdfResult.error}`);
      return {
        success: false,
        error: pdfResult.error,
      };
    }

    console.log(`✓ PDF generated: ${pdfResult.fileName}`);
    console.log(`  Total receipts: ${pdfResult.receiptsCount}`);
    console.log(`  Total amount: $${pdfResult.totalAmount.toFixed(2)}`);

    // Step 2: Upload to OneDrive
    console.log(`\nUploading to OneDrive...`);

    const onedrivePath = `/ReceiptKeeper/Reports/${year}/${pdfResult.fileName}`;

    const uploadResult = await uploadFileToOneDrive(
      pdfResult.filePath,
      onedrivePath,
      {
        description: `Monthly receipt report for ${month}/${year}`,
        tags: ['receipt', 'monthly', 'report', year, month],
      }
    );

    if (uploadResult.success) {
      console.log(`✓ Uploaded to OneDrive: ${onedrivePath}`);
      return {
        success: true,
        pdf: pdfResult,
        upload: uploadResult,
      };
    } else {
      console.error(`✗ OneDrive upload failed: ${uploadResult.error}`);
      return {
        success: false,
        error: uploadResult.error,
        pdf: pdfResult, // PDF was created, just upload failed
      };
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ============================================================
// EXAMPLE 2: Batch Generate & Upload All Months
// ============================================================

export const generateAndUploadAllMonthlyReports = async (options = {}) => {
  const {
    skipExisting = true,      // Don't regenerate existing PDFs
    uploadToOneDrive = true,   // Upload to cloud
    deleteLocalAfterUpload = false, // Delete local file after upload
  } = options;

  const results = {
    success: [],
    failed: [],
    skipped: [],
  };

  try {
    // Get all months with receipts
    const months = await getAvailableMonths();
    console.log(`\nFound ${months.length} months with receipts`);

    // Get existing PDFs if skipping
    const existingPDFs = skipExisting ? await getGeneratedPDFs() : [];
    const existingNames = new Set(existingPDFs.map(p => p.name));

    // Process each month
    for (const month of months) {
      const monthKey = `${month.year}_${month.monthName}`;
      const expectedFileName = `${month.year}_${month.monthName}_Receipts.pdf`;

      console.log(`\n${'─'.repeat(60)}`);
      console.log(`Processing: ${month.displayName}`);

      // Skip if already exists
      if (skipExisting && existingNames.has(expectedFileName)) {
        console.log(`⊘ Skipped (already exists)`);
        results.skipped.push(month);
        continue;
      }

      try {
        // Generate PDF
        const pdfResult = await generateMonthlyReceiptPDF(
          month.year,
          month.month
        );

        if (!pdfResult.success) {
          console.error(`✗ Generation failed: ${pdfResult.error}`);
          results.failed.push({
            month,
            error: pdfResult.error,
          });
          continue;
        }

        console.log(`✓ PDF generated (${pdfResult.receiptsCount} receipts)`);

        // Upload if requested
        if (uploadToOneDrive) {
          const onedrivePath = `/ReceiptKeeper/Reports/${pdfResult.fileName}`;

          const uploadResult = await uploadFileToOneDrive(
            pdfResult.filePath,
            onedrivePath,
            {
              description: `Monthly receipt report for ${month.month}/${month.year}`,
              tags: ['receipt', 'monthly', 'report'],
            }
          );

          if (uploadResult.success) {
            console.log(`✓ Uploaded to OneDrive`);

            // Delete local copy if requested
            if (deleteLocalAfterUpload) {
              await deleteGeneratedPDF(pdfResult.fileName);
              console.log(`✓ Local file deleted`);
            }
          } else {
            console.warn(`⚠ Upload failed: ${uploadResult.error}`);
          }
        }

        results.success.push({
          month,
          pdf: pdfResult,
        });
      } catch (error) {
        console.error(`✗ Error: ${error.message}`);
        results.failed.push({
          month,
          error: error.message,
        });
      }
    }

    // Summary
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`BATCH PROCESSING COMPLETE`);
    console.log(`${'═'.repeat(60)}`);
    console.log(`✓ Generated: ${results.success.length}`);
    console.log(`✗ Failed: ${results.failed.length}`);
    console.log(`⊘ Skipped: ${results.skipped.length}`);
    console.log(`${'═'.repeat(60)}\n`);

    return results;
  } catch (error) {
    console.error('Batch processing error:', error);
    results.failed.push({
      error: error.message,
    });
    return results;
  }
};

// ============================================================
// EXAMPLE 3: Generate for Date Range
// ============================================================

export const generateMonthlyReportsForDateRange = async (
  startYear,
  startMonth,
  endYear,
  endMonth
) => {
  const results = [];

  try {
    let year = parseInt(startYear);
    let month = parseInt(startMonth);

    while (year < endYear || (year === endYear && month <= parseInt(endMonth))) {
      const hasReceipts = await monthHasReceipts(year.toString(), month.toString());

      if (hasReceipts) {
        console.log(`Generating for ${year}-${String(month).padStart(2, '0')}...`);

        const result = await generateMonthlyReceiptPDF(
          year.toString(),
          String(month).padStart(2, '0')
        );

        results.push({
          year,
          month,
          success: result.success,
          fileName: result.fileName,
        });
      }

      // Move to next month
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }

    return results;
  } catch (error) {
    console.error('Date range generation error:', error);
    return results;
  }
};

// ============================================================
// EXAMPLE 4: Generate and Create Share Link
// ============================================================

export const generateAndShareReport = async (year, month) => {
  try {
    // Generate PDF
    const pdfResult = await generateMonthlyReceiptPDF(year, month);

    if (!pdfResult.success) {
      throw new Error(pdfResult.error);
    }

    // Upload to OneDrive
    const onedrivePath = `/ReceiptKeeper/Reports/Shared/${pdfResult.fileName}`;

    const uploadResult = await uploadFileToOneDrive(
      pdfResult.filePath,
      onedrivePath,
      {
        description: `Monthly report - ${month}/${year}`,
        shareWithPublic: true, // Make publicly accessible if supported
      }
    );

    if (!uploadResult.success) {
      throw new Error(uploadResult.error);
    }

    // Create share link (pseudo-code - adapt to your OneDrive API)
    const shareLink = `https://onedrive.live.com/?cid=...&id=${uploadResult.fileId}`;

    return {
      success: true,
      pdf: pdfResult,
      shareLink,
      downloadUrl: shareLink,
    };
  } catch (error) {
    console.error('Share generation failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ============================================================
// EXAMPLE 5: Generate with Email Notification
// ============================================================

export const generateAndEmailReport = async (year, month, recipientEmail) => {
  try {
    // Generate PDF
    const pdfResult = await generateMonthlyReceiptPDF(year, month);

    if (!pdfResult.success) {
      throw new Error(pdfResult.error);
    }

    // Upload to OneDrive
    const onedrivePath = `/ReceiptKeeper/Reports/${pdfResult.fileName}`;

    const uploadResult = await uploadFileToOneDrive(
      pdfResult.filePath,
      onedrivePath,
      {
        description: `Monthly report - ${month}/${year}`,
      }
    );

    if (!uploadResult.success) {
      throw new Error(uploadResult.error);
    }

    // Send email notification (pseudo-code - integrate with your email service)
    const emailContent = {
      to: recipientEmail,
      subject: `Monthly Receipt Report - ${month}/${year}`,
      body: `
        Hi,

        Your monthly receipt report for ${month}/${year} has been generated and uploaded.

        Summary:
        • Receipts: ${pdfResult.receiptsCount}
        • Total Amount: $${pdfResult.totalAmount.toFixed(2)}
        • Generated: ${pdfResult.generatedAt}
        • File: ${pdfResult.fileName}

        The PDF is available in your OneDrive: ${onedrivePath}

        Best regards,
        ReceiptKeeper
      `,
      attachmentPath: pdfResult.filePath, // Optional: include PDF as attachment
    };

    // Send email (integrate with your email service)
    // await sendEmail(emailContent);

    return {
      success: true,
      pdf: pdfResult,
      email: emailContent,
    };
  } catch (error) {
    console.error('Email report generation failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ============================================================
// EXAMPLE 6: Monitor Generation Progress
// ============================================================

export const generateWithProgress = async (year, month, onProgress) => {
  try {
    // Report starting
    onProgress?.({
      stage: 'querying',
      message: 'Querying database for receipts...',
      percent: 10,
    });

    // Generate PDF with progress updates
    const startTime = Date.now();

    const pdfResult = await generateMonthlyReceiptPDF(year, month);

    const duration = (Date.now() - startTime) / 1000;

    if (pdfResult.success) {
      onProgress?.({
        stage: 'uploading',
        message: 'Uploading to OneDrive...',
        percent: 80,
      });

      // Upload
      const onedrivePath = `/ReceiptKeeper/Reports/${pdfResult.fileName}`;
      const uploadResult = await uploadFileToOneDrive(
        pdfResult.filePath,
        onedrivePath
      );

      onProgress?.({
        stage: 'complete',
        message: 'Report generated and uploaded successfully',
        percent: 100,
        result: {
          success: true,
          file: pdfResult.fileName,
          receipts: pdfResult.receiptsCount,
          total: pdfResult.totalAmount,
          duration: `${duration.toFixed(1)}s`,
        },
      });

      return { success: true, pdf: pdfResult, upload: uploadResult };
    } else {
      onProgress?.({
        stage: 'error',
        message: `Generation failed: ${pdfResult.error}`,
        percent: 0,
      });

      return { success: false, error: pdfResult.error };
    }
  } catch (error) {
    onProgress?.({
      stage: 'error',
      message: `Unexpected error: ${error.message}`,
      percent: 0,
    });

    return { success: false, error: error.message };
  }
};

// ============================================================
// EXAMPLE 7: Scheduled Generation (Background Task)
// ============================================================

import BackgroundJob from 'react-native-background-actions'; // If using background tasks

export const scheduleMonthlyReportGeneration = async (options = {}) => {
  const {
    dayOfMonth = 1,      // Generate on 1st of month
    time = '08:00',       // At 8:00 AM
    uploadToOneDrive = true,
  } = options;

  const backgroundTask = async (taskData) => {
    try {
      // Determine the previous month (for monthly reports)
      const now = new Date();
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1);

      const year = prevMonth.getFullYear().toString();
      const month = String(prevMonth.getMonth() + 1).padStart(2, '0');

      console.log(`Background task: Generating report for ${year}-${month}`);

      // Generate report
      const result = await generateMonthlyReceiptPDF(year, month);

      if (result.success && uploadToOneDrive) {
        // Also upload
        await uploadFileToOneDrive(
          result.filePath,
          `/ReceiptKeeper/Reports/${result.fileName}`
        );
      }

      console.log('Background task completed successfully');
    } catch (error) {
      console.error('Background task failed:', error);
    }
  };

  // Schedule the task (pseudo-code - actual implementation depends on platform)
  // await BackgroundJob.start(backgroundTask, {
  //   taskName: 'GenerateMonthlyReport',
  //   taskTitle: 'Generating monthly receipt report',
  //   taskDesc: 'Processing receipts and creating PDF',
  //   taskIcon: { name: 'ic_launcher' },
  //   color: '#ff00ff',
  //   linkingURI: 'receiptkeeper://reports',
  //   parameters: {
  //     delay: calculateDelayUntil(dayOfMonth, time),
  //   },
  // });
};

// ============================================================
// EXAMPLE 8: Error Recovery and Retry Logic
// ============================================================

export const generateWithRetry = async (
  year,
  month,
  maxRetries = 3,
  retryDelay = 1000
) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}...`);

      const result = await generateMonthlyReceiptPDF(year, month);

      if (result.success) {
        console.log(`✓ Success on attempt ${attempt}`);
        return result;
      }

      lastError = result.error;

      if (attempt < maxRetries) {
        console.warn(`⚠ Attempt ${attempt} failed: ${result.error}`);
        console.log(`Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryDelay *= 2; // Exponential backoff
      }
    } catch (error) {
      lastError = error.message;

      if (attempt < maxRetries) {
        console.warn(`⚠ Attempt ${attempt} error: ${error.message}`);
        console.log(`Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryDelay *= 2;
      }
    }
  }

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts: ${lastError}`,
  };
};

// ============================================================
// EXAMPLE 9: Clean Up Old PDFs
// ============================================================

export const cleanupOldPDFs = async (maxAgeMonths = 12) => {
  try {
    const pdfs = await getGeneratedPDFs();
    const now = Date.now();
    const maxAge = maxAgeMonths * 30 * 24 * 60 * 60 * 1000; // Convert months to ms

    let deletedCount = 0;
    let totalSpaceFreed = 0;

    for (const pdf of pdfs) {
      const age = now - pdf.mtime;

      if (age > maxAge) {
        const deleted = await deleteGeneratedPDF(pdf.name);
        if (deleted) {
          deletedCount++;
          totalSpaceFreed += pdf.size;
          console.log(`Deleted old PDF: ${pdf.name}`);
        }
      }
    }

    const spaceMB = (totalSpaceFreed / (1024 * 1024)).toFixed(2);
    console.log(`Cleanup complete: ${deletedCount} files deleted, ${spaceMB} MB freed`);

    return {
      success: true,
      deletedCount,
      spaceMBFreed: spaceMB,
    };
  } catch (error) {
    console.error('Cleanup failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ============================================================
// EXAMPLE 10: Export Receipts in Multiple Formats
// ============================================================

export const generateAndExportReport = async (year, month, formats = ['pdf']) => {
  const results = {};

  try {
    // Generate PDF
    if (formats.includes('pdf')) {
      const pdfResult = await generateMonthlyReceiptPDF(year, month);
      results.pdf = pdfResult;
    }

    // Could add CSV export
    if (formats.includes('csv')) {
      // Pseudo-code - implement CSV generation
      // const csvResult = await generateMonthlyReceiptCSV(year, month);
      // results.csv = csvResult;
    }

    // Could add Excel export
    if (formats.includes('xlsx')) {
      // Pseudo-code - implement Excel generation
      // const xlsxResult = await generateMonthlyReceiptExcel(year, month);
      // results.xlsx = xlsxResult;
    }

    return {
      success: true,
      formats: results,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

export default {
  generateAndUploadMonthlyReport,
  generateAndUploadAllMonthlyReports,
  generateMonthlyReportsForDateRange,
  generateAndShareReport,
  generateAndEmailReport,
  generateWithProgress,
  scheduleMonthlyReportGeneration,
  generateWithRetry,
  cleanupOldPDFs,
  generateAndExportReport,
};
