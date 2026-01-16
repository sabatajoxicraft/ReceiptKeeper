import RNFS from 'react-native-fs';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { getReceipts } from '../database/database';

/**
 * Monthly Receipt PDF Generator Service using HTML-to-PDF
 */

const PDF_OUTPUT_DIR = `${RNFS.DocumentDirectoryPath}/ReceiptKeeper/PDFs`;
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ensureDirectoryExists = async () => {
  try {
    const exists = await RNFS.exists(PDF_OUTPUT_DIR);
    if (!exists) {
      await RNFS.mkdir(PDF_OUTPUT_DIR, { NSURLIsExcludedFromBackupKey: false });
      console.log('📁 Created PDF directory:', PDF_OUTPUT_DIR);
    }
  } catch (error) {
    console.error('Error creating PDF directory:', error);
    throw error;
  }
};

const formatCurrency = (amount, currency = 'USD') => {
  const symbols = { USD: '$', EUR: '€', GBP: '£' };
  const symbol = symbols[currency] || '$';
  return `${symbol}${parseFloat(amount || 0).toFixed(2)}`;
};

/**
 * Generate HTML template for monthly PDF
 */
const generateHTML = (year, month, receipts) => {
  const monthName = MONTH_NAMES[month - 1];
  let totalAmount = 0;
  
  const summaryRows = receipts.map((receipt, idx) => {
    const date = new Date(receipt.date_captured || receipt.extracted_at).toLocaleDateString();
    const vendor = (receipt.vendor_name || 'Unknown').substring(0, 30);
    const amount = receipt.total_amount || 0;
    const invoiceNum = (receipt.invoice_number || 'N/A').substring(0, 15);
    totalAmount += amount;
    
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${date}</td>
        <td>${vendor}</td>
        <td style="text-align: right">${formatCurrency(amount, receipt.currency)}</td>
        <td>${invoiceNum}</td>
      </tr>
    `;
  }).join('');
  
  const receiptPages = receipts.map((receipt, idx) => {
    const date = new Date(receipt.date_captured || receipt.extracted_at).toLocaleDateString();
    const imgPath = receipt.file_path ? `file://${receipt.file_path}` : '';
    
    return `
      <div style="page-break-before: always; padding: 20px;">
        <h2>Receipt #${idx + 1}</h2>
        <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
          <tr><td><strong>Vendor:</strong></td><td>${receipt.vendor_name || 'Unknown'}</td></tr>
          <tr><td><strong>Date:</strong></td><td>${date}</td></tr>
          <tr><td><strong>Amount:</strong></td><td>${formatCurrency(receipt.total_amount, receipt.currency)}</td></tr>
          ${receipt.tax_amount ? `<tr><td><strong>Tax:</strong></td><td>${formatCurrency(receipt.tax_amount, receipt.currency)}</td></tr>` : ''}
          ${receipt.invoice_number ? `<tr><td><strong>Invoice:</strong></td><td>${receipt.invoice_number}</td></tr>` : ''}
          ${receipt.category ? `<tr><td><strong>Category:</strong></td><td>${receipt.category}</td></tr>` : ''}
        </table>
        ${imgPath ? `<img src="${imgPath}" style="max-width: 100%; height: auto;" />` : '<p>Image not available</p>'}
      </div>
    `;
  }).join('');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #007bff; color: white; }
        .total-row { font-weight: bold; background-color: #f0f0f0; }
      </style>
    </head>
    <body>
      <h1>Receipt Summary - ${monthName} ${year}</h1>
      
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Vendor</th>
            <th style="text-align: right">Amount</th>
            <th>Invoice #</th>
          </tr>
        </thead>
        <tbody>
          ${summaryRows}
          <tr class="total-row">
            <td colspan="3" style="text-align: right">TOTAL:</td>
            <td style="text-align: right">${formatCurrency(totalAmount)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
      
      ${receiptPages}
    </body>
    </html>
  `;
};

/**
 * Generate monthly receipt PDF
 */
export const generateMonthlyReceiptPDF = async (year, month) => {
  try {
    console.log(`📄 Generating PDF for ${MONTH_NAMES[month - 1]} ${year}...`);
    
    await ensureDirectoryExists();

    const allReceipts = await getReceipts(1000);
    const monthReceipts = allReceipts.filter(receipt => {
      const receiptDate = new Date(receipt.date_captured || receipt.extracted_at);
      return receiptDate.getFullYear() === year && receiptDate.getMonth() === month - 1;
    });

    if (monthReceipts.length === 0) {
      throw new Error(`No receipts found for ${MONTH_NAMES[month - 1]} ${year}`);
    }

    console.log(`✅ Found ${monthReceipts.length} receipts`);

    const html = generateHTML(year, month, monthReceipts);
    const filename = `${year}_${MONTH_NAMES[month - 1]}_Receipts`;

    const options = {
      html,
      fileName: filename,
      directory: PDF_OUTPUT_DIR,
      base64: false,
    };

    const file = await RNHTMLtoPDF.convert(options);
    console.log(`✅ PDF generated: ${file.filePath}`);

    return file.filePath;

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};

export const listMonthlyPDFs = async () => {
  try {
    await ensureDirectoryExists();
    const files = await RNFS.readDir(PDF_OUTPUT_DIR);
    
    return files
      .filter(file => file.name.endsWith('.pdf'))
      .map(file => ({
        name: file.name,
        path: file.path,
        size: file.size,
        modified: file.mtime,
      }))
      .sort((a, b) => b.modified - a.modified);
  } catch (error) {
    console.error('Error listing PDFs:', error);
    return [];
  }
};

export const deleteMonthlyPDF = async (filename) => {
  try {
    const filePath = `${PDF_OUTPUT_DIR}/${filename}`;
    if (await RNFS.exists(filePath)) {
      await RNFS.unlink(filePath);
      console.log(`🗑️ Deleted PDF: ${filename}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting PDF:', error);
    throw error;
  }
};

export default {
  generateMonthlyReceiptPDF,
  listMonthlyPDFs,
  deleteMonthlyPDF,
};
