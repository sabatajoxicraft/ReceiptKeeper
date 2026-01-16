# PDF Generation Testing Guide

This guide explains how to test the PDF generation functionality of ReceiptKeeper.

## Overview

The PDF generation system creates monthly receipt reports from receipts stored in the database. The test script validates the entire workflow:

1. ✅ Database connectivity and receipt retrieval
2. ✅ Mock data creation for testing
3. ✅ PDF generation with proper formatting
4. ✅ File creation and verification
5. ✅ Summary statistics calculation

## Quick Start

### Basic Test (Current Month)

```bash
node scripts/testPdfGeneration.js
```

This will test PDF generation for the current month with auto-generated mock data.

### Test Specific Month

```bash
node scripts/testPdfGeneration.js 2024 03
```

This tests March 2024. Use format `YYYY MM` where:
- `YYYY` = Year (e.g., 2024)
- `MM` = Month number 01-12 (e.g., 03 for March)

### Verbose Output

```bash
node scripts/testPdfGeneration.js --verbose
```

or

```bash
node scripts/testPdfGeneration.js 2024 01 -v
```

Detailed logging for troubleshooting.

## What the Test Does

### 1. Environment Validation
- ✓ Verifies project structure exists
- ✓ Confirms source directories are accessible
- ✓ Validates database files are in place

### 2. Test Configuration
- Displays the year and month being tested
- Shows current date information
- Reports verbose mode status

### 3. Mock Data Creation
The test automatically creates 8 mock receipt records with:
- Realistic vendor names (Whole Foods, Staples, etc.)
- Random amounts between $10-$210
- Realistic tax amounts (0-20%)
- Various payment methods
- Different receipt categories
- Random invoice numbers
- High OCR confidence scores (60-100%)

### 4. PDF Generation
- Simulates the actual PDF generation process
- Calculates summary statistics
- Creates a test PDF file in `scripts/__mock_pdfs__/`

### 5. Results Reporting
Displays comprehensive results:
- ✅ File name and location
- ✅ Number of receipts processed
- ✅ Total and average amounts
- ✅ Total tax collected
- ✅ File size information
- ✅ Generation timestamp

## Output Example

```
======================================================================
📄 PDF Generation Test Script
======================================================================

✓ Project root directory: /home/user/ReceiptKeeper
✓ Source directory: /home/user/ReceiptKeeper/src
✓ Database directory: /home/user/ReceiptKeeper/src/database

======================================================================
Test Configuration
======================================================================

ℹ Year: 2024
ℹ Month: 01
ℹ Verbose mode: disabled
ℹ Testing with: January 2024 (current month)

======================================================================
Mock Data Setup
======================================================================

✓ Mock database created: /home/user/ReceiptKeeper/scripts/__mock_db__.json
ℹ Mock records: 8

======================================================================
PDF Generation Results
======================================================================

✓ PDF generated successfully!

Generated PDF Details:
  File Name:        2024_January_Receipts.pdf
  File Path:        /home/user/ReceiptKeeper/scripts/__mock_pdfs__/2024_January_Receipts.pdf
  File Size:        156 bytes
  Receipts:         8
  Total Amount:     $854.32
  Total Tax:        $78.45
  Average Amount:   $106.79
  Generated At:     1/15/2024, 2:30:45 PM
```

## Real Database Testing

To test with **actual receipts** from your database:

### In React Native App

The actual PDF generation in the React Native app uses real database data:

```javascript
import { generateMonthlyReceiptPDF } from './src/services/pdfGeneratorService';

// Generate PDF for March 2024
const result = await generateMonthlyReceiptPDF('2024', '03');

if (result.success) {
  console.log(`PDF saved to: ${result.filePath}`);
  console.log(`Receipts processed: ${result.receiptsCount}`);
} else {
  console.error(`Error: ${result.error}`);
}
```

### Direct Testing

To test PDF generation directly in Node.js with your actual database:

```javascript
const { initDatabase } = require('./src/database/database');
const { generateMonthlyReceiptPDF } = require('./src/services/pdfGeneratorService');

(async () => {
  try {
    // Initialize the actual database
    await initDatabase();
    
    // Generate PDF for current month
    const result = await generateMonthlyReceiptPDF('2024', '01');
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
})();
```

## Mock Files

The test script creates temporary mock files in the `scripts/` directory:

### `__mock_db__.json`
Contains simulated receipt data used for testing. Format:
```json
{
  "receipts": [
    {
      "id": 12345,
      "filename": "receipt_1_1234567890.jpg",
      "file_path": "/mock/path/receipt_1.jpg",
      "vendor_name": "Whole Foods Market",
      "total_amount": "87.53",
      "tax_amount": "6.45",
      "invoice_number": "INV-ABC123",
      "category": "Groceries",
      "currency": "USD",
      "ocr_confidence": "0.89",
      "payment_method": "Credit Card",
      "card_name": "Test Card",
      "date_captured": "2024-01-15T10:30:00.000Z",
      "year": "2024",
      "month": "01"
    }
  ],
  "timestamp": "2024-01-15T15:30:45.000Z"
}
```

### `__mock_pdfs__/` Directory
Contains generated test PDF files. The actual PDF generation would create real PDF files here.

## Cleanup

To remove test files:

```bash
# Remove mock database
rm -f scripts/__mock_db__.json

# Remove mock PDFs
rm -rf scripts/__mock_pdfs__/

# Remove both
rm -f scripts/__mock_db__.json && rm -rf scripts/__mock_pdfs__/
```

## Troubleshooting

### No Receipts Found Error

**Error:**
```
✗ No receipts available for PDF generation
```

**Solution:**
- The test script creates mock receipts automatically
- If you want to use actual database receipts, ensure they exist in the database
- Check that OCR processing is complete before generating PDFs

### Invalid Month Error

**Error:**
```
✗ Invalid month: 13
```

**Solution:**
- Month must be between 01-12
- Use format: `node scripts/testPdfGeneration.js 2024 03` for March 2024

### Environment Validation Failed

**Error:**
```
✗ Source directory not found: /path/to/src
```

**Solution:**
- Run the script from the project root directory
- Ensure the project structure is intact
- Verify source files haven't been moved

### Script Not Executable

**Error:**
```
bash: ./scripts/testPdfGeneration.js: Permission denied
```

**Solution:**
```bash
chmod +x scripts/testPdfGeneration.js
```

## Integration with CI/CD

To add this test to your CI/CD pipeline (GitHub Actions, etc.):

```yaml
name: Test PDF Generation

on: [push, pull_request]

jobs:
  test-pdf:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: node scripts/testPdfGeneration.js --verbose
```

## Advanced Usage

### Custom Mock Data Count

To modify the number of mock receipts in testing, edit `testPdfGeneration.js`:

```javascript
// Change from 8 to your preferred number
const mockReceipts = createMockReceipts(15); // Creates 15 mock receipts
```

### Custom Output Directory

To change where PDFs are generated:

```javascript
// In testPdfGeneration.js, update:
const pdfDir = path.join(CONFIG.PROJECT_ROOT, 'your-custom-path');
```

## Performance Metrics

The test script measures and reports:
- **Execution Time**: Total time from start to completion
- **Processing Time**: Time to generate PDF
- **File Size**: Size of generated PDF in bytes

Example:
```
✓ Test completed in 1.45 seconds
```

## Related Documentation

- [PDF Generator Service](../src/services/pdfGeneratorService.js) - Main implementation
- [Database Documentation](../src/database/README_MIGRATIONS.md) - Database schema
- [Project Setup](../SETUP_GUIDE.md) - Project initialization

## Support

For issues or questions:

1. **Check logs**: Run with `--verbose` flag for detailed output
2. **Verify setup**: Ensure project is properly initialized with `npm install`
3. **Check database**: Verify database file exists and has receipts
4. **Review errors**: Read error messages carefully for troubleshooting hints

---

**Last Updated:** January 2024
**Test Script Version:** 1.0.0
