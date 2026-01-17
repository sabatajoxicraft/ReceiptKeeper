import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { APP_COLORS } from '../config/constants';
import { getDatabase } from '../database/database';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

const PDFExportModal = ({ visible, onClose, receipts = [] }) => {
  const [selectedReceipts, setSelectedReceipts] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  const toggleReceiptSelection = (receiptId) => {
    setSelectedReceipts((prev) =>
      prev.includes(receiptId)
        ? prev.filter((id) => id !== receiptId)
        : [...prev, receiptId]
    );
  };

  const selectAll = () => {
    if (selectedReceipts.length === receipts.length) {
      setSelectedReceipts([]);
    } else {
      setSelectedReceipts(receipts.map((r) => r.id));
    }
  };

  const formatCurrency = (amount, currency = 'ZAR') => {
    return `R ${parseFloat(amount || 0).toFixed(2)}`;
  };

  const generateHTMLContent = (receiptData) => {
    let totalAmount = 0;
    
    const summaryRows = receiptData
      .map((receipt, idx) => {
        const date = new Date(receipt.date_captured).toLocaleDateString('en-ZA');
        const vendor = (receipt.vendor_name || 'Unknown').substring(0, 40);
        const amount = receipt.total_amount || 0;
        const invoiceNum = (receipt.invoice_number || 'N/A').substring(0, 20);
        const category = receipt.category || 'Uncategorized';
        totalAmount += parseFloat(amount);

        return `
          <tr>
            <td>${idx + 1}</td>
            <td>${date}</td>
            <td>${vendor}</td>
            <td>${category}</td>
            <td style="text-align: right">${formatCurrency(amount)}</td>
            <td>${invoiceNum}</td>
          </tr>
        `;
      })
      .join('');

    const receiptPages = receiptData
      .map((receipt, idx) => {
        const date = new Date(receipt.date_captured).toLocaleDateString('en-ZA');
        const imgPath = receipt.file_path ? `file://${receipt.file_path}` : '';

        return `
          <div style="page-break-before: ${idx > 0 ? 'always' : 'auto'}; padding: 30px;">
            <h2 style="color: #2E7D32; border-bottom: 2px solid #2E7D32; padding-bottom: 10px;">
              Receipt #${idx + 1}
            </h2>
            <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; width: 30%;">
                  Vendor:
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                  ${receipt.vendor_name || 'Not specified'}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">
                  Date:
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${date}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">
                  Total Amount:
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-size: 18px; font-weight: bold; color: #2E7D32;">
                  ${formatCurrency(receipt.total_amount)}
                </td>
              </tr>
              ${
                receipt.tax_amount
                  ? `<tr>
                      <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Tax (VAT):</td>
                      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatCurrency(receipt.tax_amount)}</td>
                    </tr>`
                  : ''
              }
              ${
                receipt.invoice_number
                  ? `<tr>
                      <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Invoice #:</td>
                      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${receipt.invoice_number}</td>
                    </tr>`
                  : ''
              }
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Category:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                  <span style="background-color: #2E7D32; color: white; padding: 4px 12px; border-radius: 12px; font-size: 14px;">
                    ${receipt.category || 'Uncategorized'}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Payment Method:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                  ${receipt.payment_method === 'cash' ? 'Cash' : receipt.card_name || 'Card'}
                </td>
              </tr>
            </table>
            
            <div style="margin-top: 20px;">
              <h3 style="color: #666; margin-bottom: 10px;">Receipt Image:</h3>
              ${
                imgPath
                  ? `<img src="${imgPath}" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px;" />`
                  : '<p style="color: #999; font-style: italic;">Image not available</p>'
              }
            </div>
          </div>
        `;
      })
      .join('');

    const currentDate = new Date().toLocaleDateString('en-ZA');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Receipt Export - SARS Compliant</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 30px;
            color: #333;
          }
          h1 {
            color: #2E7D32;
            border-bottom: 3px solid #2E7D32;
            padding-bottom: 15px;
            margin-bottom: 10px;
          }
          .header-info {
            color: #666;
            font-size: 14px;
            margin-bottom: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th {
            background-color: #2E7D32;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
          }
          td {
            padding: 10px;
            border-bottom: 1px solid #eee;
          }
          .total-row {
            font-weight: bold;
            background-color: #f5f5f5;
            font-size: 18px;
          }
          .total-row td {
            border-top: 2px solid #2E7D32;
            padding: 15px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #999;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <h1>📋 Receipt Export Report</h1>
        <div class="header-info">
          <strong>Generated:</strong> ${currentDate}<br>
          <strong>Total Receipts:</strong> ${receiptData.length}<br>
          <strong>Document Type:</strong> SARS-Compliant Receipt Summary
        </div>

        <h2 style="color: #2E7D32; margin-top: 30px;">Summary</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Vendor</th>
              <th>Category</th>
              <th style="text-align: right">Amount</th>
              <th>Invoice #</th>
            </tr>
          </thead>
          <tbody>
            ${summaryRows}
            <tr class="total-row">
              <td colspan="4" style="text-align: right">TOTAL:</td>
              <td style="text-align: right; color: #2E7D32;">${formatCurrency(totalAmount)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <h2 style="color: #2E7D32; margin-top: 50px; page-break-before: always;">
          Detailed Receipts
        </h2>
        ${receiptPages}

        <div class="footer">
          Generated by ReceiptKeeper - SARS-Compliant Business Receipt Management<br>
          This document contains ${receiptData.length} receipt(s) with supporting images for tax purposes.
        </div>
      </body>
      </html>
    `;
  };

  const exportToPDF = async () => {
    if (selectedReceipts.length === 0) {
      Alert.alert('No Selection', 'Please select at least one receipt to export.');
      return;
    }

    setIsExporting(true);

    try {
      const db = getDatabase();
      const receiptData = [];

      for (const receiptId of selectedReceipts) {
        const result = await db.executeSql('SELECT * FROM receipts WHERE id = ?', [
          receiptId,
        ]);
        if (result[0].rows.length > 0) {
          receiptData.push(result[0].rows.item(0));
        }
      }

      const htmlContent = generateHTMLContent(receiptData);
      const timestamp = new Date().getTime();
      const htmlPath = `${RNFS.CachesDirectoryPath}/receipt_export_${timestamp}.html`;
      
      await RNFS.writeFile(htmlPath, htmlContent, 'utf8');

      // Share HTML file (user can print to PDF from browser)
      await Share.open({
        url: `file://${htmlPath}`,
        type: 'text/html',
        title: 'Export Receipts',
        subject: `Receipt Export - ${receiptData.length} receipts`,
        message: 'Open in browser and print to PDF for SARS-compliant document',
      });

      Alert.alert(
        'Export Ready',
        'HTML file created. Open in a browser and use "Print to PDF" to create a PDF document.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', `Could not export receipts: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Export to PDF</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Select receipts to include in the export
          </Text>

          <TouchableOpacity style={styles.selectAllButton} onPress={selectAll}>
            <Text style={styles.selectAllButtonText}>
              {selectedReceipts.length === receipts.length
                ? '☑ Deselect All'
                : '☐ Select All'}
            </Text>
          </TouchableOpacity>

          <ScrollView style={styles.receiptList} showsVerticalScrollIndicator={false}>
            {receipts.map((receipt) => (
              <TouchableOpacity
                key={receipt.id}
                style={[
                  styles.receiptItem,
                  selectedReceipts.includes(receipt.id) && styles.receiptItemSelected,
                ]}
                onPress={() => toggleReceiptSelection(receipt.id)}
              >
                <Text style={styles.checkbox}>
                  {selectedReceipts.includes(receipt.id) ? '☑' : '☐'}
                </Text>
                <View style={styles.receiptItemContent}>
                  <Text style={styles.receiptVendor} numberOfLines={1}>
                    {receipt.vendor_name || receipt.filename}
                  </Text>
                  <Text style={styles.receiptDetails}>
                    {new Date(receipt.date_captured).toLocaleDateString()} •{' '}
                    {receipt.total_amount
                      ? formatCurrency(receipt.total_amount)
                      : 'No amount'}
                  </Text>
                  {receipt.category && (
                    <Text style={styles.receiptCategory}>{receipt.category}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Text style={styles.selectionCount}>
              {selectedReceipts.length} of {receipts.length} selected
            </Text>
            <TouchableOpacity
              style={[
                styles.exportButton,
                (selectedReceipts.length === 0 || isExporting) &&
                  styles.exportButtonDisabled,
              ]}
              onPress={exportToPDF}
              disabled={selectedReceipts.length === 0 || isExporting}
            >
              {isExporting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.exportButtonText}>
                  📄 Export {selectedReceipts.length > 0 ? `(${selectedReceipts.length})` : ''}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: APP_COLORS.text,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: APP_COLORS.textSecondary,
  },
  subtitle: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    marginBottom: 15,
  },
  selectAllButton: {
    padding: 12,
    backgroundColor: APP_COLORS.background,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  selectAllButtonText: {
    fontSize: 16,
    color: APP_COLORS.text,
    fontWeight: '600',
  },
  receiptList: {
    maxHeight: 300,
    marginBottom: 15,
  },
  receiptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  receiptItemSelected: {
    backgroundColor: APP_COLORS.primary + '15',
    borderColor: APP_COLORS.primary,
    borderWidth: 2,
  },
  checkbox: {
    fontSize: 24,
    marginRight: 12,
    color: APP_COLORS.primary,
  },
  receiptItemContent: {
    flex: 1,
  },
  receiptVendor: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 4,
  },
  receiptDetails: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
  },
  receiptCategory: {
    fontSize: 12,
    color: APP_COLORS.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.border,
    paddingTop: 15,
  },
  selectionCount: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  exportButton: {
    backgroundColor: APP_COLORS.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  exportButtonDisabled: {
    backgroundColor: APP_COLORS.textSecondary,
    opacity: 0.5,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PDFExportModal;
