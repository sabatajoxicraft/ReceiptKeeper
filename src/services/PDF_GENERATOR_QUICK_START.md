# PDF Generator Quick Start Guide

## Installation

The PDF generator is already integrated into ReceiptKeeper. No additional installation needed.

**Required dependencies (already in package.json):**
- `react-native-pdf-lib` - PDF generation
- `react-native-fs` - File system operations
- `react-native-sqlite-storage` - Database queries

## Basic Usage

### Generate a Monthly PDF Report

```javascript
import { generateMonthlyReceiptPDF } from './src/services/pdfGeneratorService';

// Generate March 2024 report
const result = await generateMonthlyReceiptPDF('2024', '03');

if (result.success) {
  console.log('PDF created:', result.fileName);
  console.log('Receipts:', result.receiptsCount);
  console.log('Total:', result.totalAmount);
  // Use result.filePath for uploading to OneDrive
} else {
  console.error('Error:', result.error);
}
```

### Upload to OneDrive (After Generating)

```javascript
import { generateMonthlyReceiptPDF } from './src/services/pdfGeneratorService';
import { uploadFileToOneDrive } from './src/services/onedriveService';

const pdfResult = await generateMonthlyReceiptPDF('2024', '03');

if (pdfResult.success) {
  const uploadResult = await uploadFileToOneDrive(
    pdfResult.filePath,
    `/ReceiptKeeper/Reports/${pdfResult.fileName}`
  );
  
  if (uploadResult.success) {
    console.log('Uploaded to OneDrive!');
  }
}
```

## Common Tasks

### 1. List Available Months

See which months have receipt data:

```javascript
import { getAvailableMonths } from './src/services/pdfGeneratorService';

const months = await getAvailableMonths();
// Returns: [
//   { year: "2024", month: "03", monthName: "March", displayName: "March 2024" },
//   { year: "2024", month: "02", monthName: "February", displayName: "February 2024" },
//   ...
// ]
```

### 2. Check if Month Has Data

Before generating:

```javascript
import { monthHasReceipts } from './src/services/pdfGeneratorService';

const hasData = await monthHasReceipts('2024', '03');
if (hasData) {
  // Safe to generate PDF
}
```

### 3. Delete Generated PDF

Remove a PDF file:

```javascript
import { deleteGeneratedPDF } from './src/services/pdfGeneratorService';

await deleteGeneratedPDF('2024_March_Receipts.pdf');
```

### 4. List Generated PDFs

See all created PDF files:

```javascript
import { getGeneratedPDFs } from './src/services/pdfGeneratorService';

const pdfs = await getGeneratedPDFs();
pdfs.forEach(pdf => {
  console.log(`${pdf.name} (${(pdf.size / 1024).toFixed(2)} KB)`);
});
```

## React Component Example

### Functional Component with Hooks

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import { generateMonthlyReceiptPDF, getAvailableMonths } from '../services/pdfGeneratorService';

export default function PDFGeneratorScreen() {
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Load available months on mount
  useEffect(() => {
    loadMonths();
  }, []);

  const loadMonths = async () => {
    const availableMonths = await getAvailableMonths();
    setMonths(availableMonths);
    if (availableMonths.length > 0) {
      setSelectedMonth(availableMonths[0]);
    }
  };

  const handleGenerate = async () => {
    if (!selectedMonth) return;

    setLoading(true);
    setResult(null);

    const pdfResult = await generateMonthlyReceiptPDF(
      selectedMonth.year,
      selectedMonth.month
    );

    setResult(pdfResult);
    setLoading(false);
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
        Generate Monthly Report
      </Text>

      {/* Month Selection */}
      <Text style={{ marginBottom: 10 }}>Select Month:</Text>
      {months.length > 0 ? (
        <View style={{ marginBottom: 20 }}>
          {months.map((month) => (
            <Button
              key={`${month.year}-${month.month}`}
              title={month.displayName}
              onPress={() => setSelectedMonth(month)}
              color={selectedMonth?.month === month.month ? 'green' : 'gray'}
            />
          ))}
        </View>
      ) : (
        <Text>No receipts found</Text>
      )}

      {/* Generate Button */}
      <Button
        title={loading ? 'Generating...' : 'Generate PDF'}
        onPress={handleGenerate}
        disabled={loading || !selectedMonth}
      />

      {loading && <ActivityIndicator size="large" color="#0000ff" />}

      {/* Result Display */}
      {result && (
        <View style={{ marginTop: 20, padding: 15, backgroundColor: '#f0f0f0' }}>
          {result.success ? (
            <>
              <Text style={{ color: 'green', fontWeight: 'bold' }}>✓ Success!</Text>
              <Text>File: {result.fileName}</Text>
              <Text>Receipts: {result.receiptsCount}</Text>
              <Text>Total: ${result.totalAmount.toFixed(2)}</Text>
              <Text style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
                {result.filePath}
              </Text>
            </>
          ) : (
            <>
              <Text style={{ color: 'red', fontWeight: 'bold' }}>✗ Failed</Text>
              <Text>{result.error}</Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}
```

## File Locations

```
DocumentDirectoryPath/ReceiptKeeper/PDFs/
├── 2024_January_Receipts.pdf
├── 2024_February_Receipts.pdf
├── 2024_March_Receipts.pdf
└── ...
```

## PDF Contents

Each generated PDF includes:

**Page 1: Summary Page**
- Title with month and year
- Summary statistics (count, total, tax)
- Category breakdown
- Table with all receipts (date, vendor, amount, tax, invoice)

**Pages 2+: Receipt Details**
- Header box with receipt info (vendor, date, amount, tax, invoice)
- Payment method and card information
- OCR confidence score
- Actual receipt image
- Footer with receipt ID and metadata

## Troubleshooting

### "No receipts found" Error

✓ **Check database:**
```javascript
import { getAvailableMonths } from './src/services/pdfGeneratorService';
const months = await getAvailableMonths();
console.log(months); // See which months have data
```

✓ **Verify month format:** Use MM (01-12), not (1-12)
```javascript
// ✓ Correct
await generateMonthlyReceiptPDF('2024', '03');

// ✗ Wrong
await generateMonthlyReceiptPDF('2024', '3');
```

### PDF Shows Blank Images

✓ **Check file paths:** Ensure receipt images still exist
```javascript
import RNFS from 'react-native-fs';
const exists = await RNFS.exists(filePath);
console.log('File exists:', exists);
```

### Generation Is Slow

✓ **Check receipt count:** More receipts = longer generation
✓ **Check image size:** Larger images = slower processing
✓ **Use background task:** Run on separate thread to avoid blocking UI

## Integration with OneDrive

Once PDF is generated, upload it:

```javascript
import { uploadFileToOneDrive } from './src/services/onedriveService';

// After generateMonthlyReceiptPDF succeeds
const uploadResult = await uploadFileToOneDrive(
  pdfResult.filePath,
  `/ReceiptKeeper/Reports/${pdfResult.fileName}`
);

if (uploadResult.success) {
  console.log('Ready to share!');
  // optionally delete local file to save space
  await deleteGeneratedPDF(pdfResult.fileName);
}
```

## Tips & Best Practices

1. **Before generating**, check month has data:
   ```javascript
   if (await monthHasReceipts('2024', '03')) {
     await generateMonthlyReceiptPDF('2024', '03');
   }
   ```

2. **Generate on a background thread** to avoid freezing UI:
   ```javascript
   import { useState } from 'react';
   
   const [generating, setGenerating] = useState(false);
   
   const handleGenerate = async () => {
     setGenerating(true);
     try {
       const result = await generateMonthlyReceiptPDF('2024', '03');
       // Handle result...
     } finally {
       setGenerating(false);
     }
   };
   ```

3. **Batch generate multiple months** with retry logic:
   ```javascript
   import { generateWithRetry } from './services/pdfGeneratorIntegration.example';
   
   for (const month of monthsList) {
     const result = await generateWithRetry(
       month.year,
       month.month,
       3 // max retries
     );
   }
   ```

4. **Clean up old PDFs** to save storage:
   ```javascript
   import { cleanupOldPDFs } from './services/pdfGeneratorIntegration.example';
   
   await cleanupOldPDFs(12); // Delete PDFs older than 12 months
   ```

5. **Show progress** to user:
   ```javascript
   import { generateWithProgress } from './services/pdfGeneratorIntegration.example';
   
   await generateWithProgress('2024', '03', (progress) => {
     console.log(`${progress.percent}% - ${progress.message}`);
     // Update UI progress bar
   });
   ```

## API Reference Summary

| Function | Purpose | Returns |
|----------|---------|---------|
| `generateMonthlyReceiptPDF(year, month)` | Generate PDF for a month | `Promise<Object>` with `success`, `filePath`, etc. |
| `getAvailableMonths()` | List months with receipts | `Promise<Array>` of months |
| `monthHasReceipts(year, month)` | Check if month has data | `Promise<boolean>` |
| `deleteGeneratedPDF(fileName)` | Delete a PDF file | `Promise<boolean>` |
| `getGeneratedPDFs()` | List generated PDFs | `Promise<Array>` of PDF objects |

## More Examples

For advanced examples like:
- Batch processing multiple months
- Scheduling automated generation
- Sharing with email
- Retry logic
- Progress tracking

See: `pdfGeneratorIntegration.example.js`

## Support

For issues:
1. Check console logs (they're very detailed)
2. Verify month/year format (YYYY/MM)
3. Ensure receipts exist with `getAvailableMonths()`
4. Check device storage space
5. Review error messages in returned `result.error`

---

**Need help?** Check the full documentation in `PDF_GENERATOR_README.md`
