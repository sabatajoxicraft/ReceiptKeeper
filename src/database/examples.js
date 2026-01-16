/**
 * Example: Using the OCR Data Storage System
 * 
 * This file demonstrates how to use the OCR fields added by the migration.
 * For reference only - do not include in production code.
 */

import { saveReceipt, saveOCRData, getReceipts, getDatabaseMigrationStatus } from './database.js';

/**
 * Example 1: Save a receipt with OCR data
 */
export async function exampleSaveReceiptWithOCR() {
  try {
    // First, save the receipt
    const receiptData = {
      filename: 'starbucks_receipt.jpg',
      filePath: '/path/to/starbucks_receipt.jpg',
      onedrivePath: 'https://onedrive.com/...',
      paymentMethod: 'credit_card',
      cardName: 'Chase Sapphire',
      year: '2024',
      month: '01',
    };

    const receiptId = await saveReceipt(receiptData);
    console.log(`Receipt saved with ID: ${receiptId}`);

    // Then, add OCR-extracted data
    const ocrData = {
      vendorName: 'Starbucks Coffee',
      totalAmount: 8.45,
      taxAmount: 0.68,
      invoiceNumber: 'TXN123456',
      category: 'Food & Beverage',
      currency: 'USD',
      rawOcrText: `
        STARBUCKS COFFEE
        2024-01-15 14:32
        GRANDE LATTE        6.95
        TAX                 0.68
        TOTAL               7.63
        
        Thank you for your visit!
      `,
      ocrConfidence: 0.96,
    };

    await saveOCRData(receiptId, ocrData);
    console.log('OCR data saved successfully');

    return receiptId;
  } catch (error) {
    console.error('Error saving receipt with OCR data:', error);
  }
}

/**
 * Example 2: Retrieve receipts with OCR data
 */
export async function exampleRetrieveReceiptsWithOCR() {
  try {
    const receipts = await getReceipts(10);

    receipts.forEach((receipt) => {
      console.log(`\nReceipt ID: ${receipt.id}`);
      console.log(`Filename: ${receipt.filename}`);
      
      // OCR fields (will be null if not yet processed)
      if (receipt.vendor_name) {
        console.log(`  Vendor: ${receipt.vendor_name}`);
        console.log(`  Amount: ${receipt.total_amount} ${receipt.currency}`);
        console.log(`  Tax: ${receipt.tax_amount}`);
        console.log(`  Invoice #: ${receipt.invoice_number}`);
        console.log(`  Category: ${receipt.category}`);
        console.log(`  OCR Confidence: ${(receipt.ocr_confidence * 100).toFixed(1)}%`);
        console.log(`  Extracted: ${receipt.extracted_at}`);
      } else {
        console.log('  (OCR data not yet processed)');
      }
    });
  } catch (error) {
    console.error('Error retrieving receipts:', error);
  }
}

/**
 * Example 3: Check migration status
 */
export async function exampleCheckMigrationStatus() {
  try {
    const status = await getDatabaseMigrationStatus();

    console.log('Applied Migrations:');
    if (status.length === 0) {
      console.log('  (none)');
      return;
    }

    status.forEach((migration) => {
      console.log(`  ✓ ${migration.id}: ${migration.name}`);
      console.log(`    Applied: ${migration.applied_at}`);
      console.log(`    Version: ${migration.version}`);
    });
  } catch (error) {
    console.error('Error checking migration status:', error);
  }
}

/**
 * Example 4: Process OCR with confidence filtering
 */
export async function exampleProcessOCRWithConfidenceCheck() {
  try {
    const receipts = await getReceipts(50);

    // Filter receipts by OCR confidence
    const highConfidenceReceipts = receipts.filter(
      (r) => r.ocr_confidence && r.ocr_confidence >= 0.85
    );

    const lowConfidenceReceipts = receipts.filter(
      (r) => r.ocr_confidence && r.ocr_confidence < 0.85
    );

    console.log(`High confidence receipts (≥85%): ${highConfidenceReceipts.length}`);
    console.log(`Low confidence receipts (<85%): ${lowConfidenceReceipts.length}`);
    console.log(`Unprocessed receipts: ${receipts.filter((r) => !r.ocr_confidence).length}`);
  } catch (error) {
    console.error('Error processing OCR data:', error);
  }
}

/**
 * Example 5: Generate expense report from OCR data
 */
export async function exampleGenerateExpenseReport() {
  try {
    const receipts = await getReceipts(100);

    // Group by category
    const byCategory = {};
    let totalExpenses = 0;

    receipts.forEach((receipt) => {
      if (receipt.total_amount && receipt.vendor_name) {
        const category = receipt.category || 'Uncategorized';
        if (!byCategory[category]) {
          byCategory[category] = {
            count: 0,
            total: 0,
            vendors: [],
          };
        }
        byCategory[category].count++;
        byCategory[category].total += receipt.total_amount;
        byCategory[category].vendors.push(receipt.vendor_name);
        totalExpenses += receipt.total_amount;
      }
    });

    console.log('\nExpense Report by Category:');
    console.log('='.repeat(50));
    
    Object.entries(byCategory).forEach(([category, data]) => {
      console.log(`\n${category}:`);
      console.log(`  Count: ${data.count}`);
      console.log(`  Total: $${data.total.toFixed(2)}`);
      console.log(`  Vendors: ${[...new Set(data.vendors)].join(', ')}`);
    });

    console.log('\n' + '='.repeat(50));
    console.log(`Total Expenses: $${totalExpenses.toFixed(2)}`);
  } catch (error) {
    console.error('Error generating expense report:', error);
  }
}

/**
 * Example 6: Search for receipts by vendor
 */
export async function exampleSearchByVendor(vendorName) {
  try {
    const receipts = await getReceipts(100);
    const matches = receipts.filter(
      (r) => r.vendor_name && r.vendor_name.toLowerCase().includes(vendorName.toLowerCase())
    );

    console.log(`Found ${matches.length} receipt(s) for "${vendorName}":`);
    matches.forEach((receipt) => {
      console.log(`  - ${receipt.filename}: $${receipt.total_amount} (${receipt.category})`);
    });
  } catch (error) {
    console.error('Error searching for vendor:', error);
  }
}

/**
 * Example 7: Monthly expense summary
 */
export async function exampleMonthlySummary(year, month) {
  try {
    const receipts = await getReceipts(200);
    const filtered = receipts.filter(
      (r) => r.year === year && r.month === month && r.total_amount
    );

    if (filtered.length === 0) {
      console.log(`No receipts found for ${month}/${year}`);
      return;
    }

    const totalAmount = filtered.reduce((sum, r) => sum + r.total_amount, 0);
    const totalTax = filtered.reduce((sum, r) => sum + (r.tax_amount || 0), 0);
    const avgAmount = totalAmount / filtered.length;

    console.log(`\nSummary for ${month}/${year}:`);
    console.log(`  Receipt Count: ${filtered.length}`);
    console.log(`  Total Amount: $${totalAmount.toFixed(2)}`);
    console.log(`  Total Tax: $${totalTax.toFixed(2)}`);
    console.log(`  Average: $${avgAmount.toFixed(2)}`);

    // Top expenses
    const sorted = [...filtered].sort((a, b) => b.total_amount - a.total_amount);
    console.log(`\nTop 5 Expenses:`);
    sorted.slice(0, 5).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.vendor_name}: $${r.total_amount.toFixed(2)}`);
    });
  } catch (error) {
    console.error('Error generating monthly summary:', error);
  }
}

// Export all examples for use in development
export default {
  exampleSaveReceiptWithOCR,
  exampleRetrieveReceiptsWithOCR,
  exampleCheckMigrationStatus,
  exampleProcessOCRWithConfidenceCheck,
  exampleGenerateExpenseReport,
  exampleSearchByVendor,
  exampleMonthlySummary,
};
