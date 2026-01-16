# PDF Generator Service Documentation

## Overview

The `pdfGeneratorService.js` is a comprehensive monthly receipt PDF report generator for the ReceiptKeeper app. It creates professional, printer-ready PDF documents containing receipt summaries and individual receipt details with images.

## Features

✅ **Monthly Receipt Reports**: Generate PDF reports for any month/year combination  
✅ **Summary Page**: Table with all receipts, statistics, and category breakdown  
✅ **Detail Pages**: Full-page layouts for each receipt with header info and images  
✅ **OCR Data Integration**: Displays extracted vendor names, amounts, taxes, and invoice numbers  
✅ **Image Embedding**: Includes receipt images scaled and centered on each page  
✅ **Error Handling**: Gracefully handles missing months, missing images, and invalid inputs  
✅ **OneDrive Ready**: Generates files optimized for cloud upload and sharing  
✅ **Comprehensive Logging**: Detailed console output for debugging and monitoring  

## API Reference

### Main Function

#### `generateMonthlyReceiptPDF(year, month)`

Generates a monthly receipt PDF report and saves it to device storage.

**Parameters:**
- `year` (string|number): Year in YYYY format (e.g., "2024")
- `month` (string|number): Month in MM format (01-12)

**Returns:**
```javascript
Promise<Object> {
  success: boolean,              // True if generation succeeded
  filePath: string,              // Full path to generated PDF
  fileName: string,              // Generated filename (YYYY_MonthName_Receipts.pdf)
  receiptsCount: number,         // Number of receipts in report
  totalAmount: number,           // Sum of all receipt amounts
  totalTax: number,              // Sum of all receipt taxes
  fileSize: number,              // File size in bytes
  generatedAt: string,           // ISO timestamp of generation
  error?: string,                // Error message if success is false
}
```

**Throws:**
- Throws `Error` if year or month format is invalid
- Throws `Error` if no receipts found for the specified month

**Example:**
```javascript
import { generateMonthlyReceiptPDF } from './services/pdfGeneratorService';

// Generate March 2024 report
const result = await generateMonthlyReceiptPDF('2024', '03');

if (result.success) {
  console.log(`PDF created: ${result.filePath}`);
  console.log(`Total: $${result.totalAmount.toFixed(2)}`);
  
  // Now ready for OneDrive upload
  await uploadToOneDrive(result.filePath, result.fileName);
} else {
  console.error(`Failed: ${result.error}`);
}
```

### Utility Functions

#### `getAvailableMonths()`

Returns a list of all months that have receipts in the database.

**Returns:**
```javascript
Promise<Array> [
  {
    year: string,              // e.g., "2024"
    month: string,             // e.g., "03"
    monthName: string,         // e.g., "March"
    displayName: string,       // e.g., "March 2024"
  },
  ...
]
```

**Example:**
```javascript
const months = await getAvailableMonths();
months.forEach(m => console.log(m.displayName)); // "March 2024", "February 2024", etc.
```

#### `monthHasReceipts(year, month)`

Check if a specific month has any receipts.

**Parameters:**
- `year` (string): Year in YYYY format
- `month` (string): Month in MM format

**Returns:**
```javascript
Promise<boolean> // True if month has receipts
```

**Example:**
```javascript
const hasData = await monthHasReceipts('2024', '03');
if (hasData) {
  // Safe to generate PDF
}
```

#### `deleteGeneratedPDF(fileName)`

Delete a previously generated PDF file.

**Parameters:**
- `fileName` (string): Filename to delete (e.g., "2024_March_Receipts.pdf")

**Returns:**
```javascript
Promise<boolean> // True if deletion successful
```

**Example:**
```javascript
await deleteGeneratedPDF('2024_March_Receipts.pdf');
```

#### `getGeneratedPDFs()`

Get a list of all generated PDF files in the output directory.

**Returns:**
```javascript
Promise<Array> [
  {
    name: string,              // Filename
    path: string,              // Full file path
    size: number,              // File size in bytes
    mtime: number,             // Modification time (timestamp)
  },
  ...
]
```

**Example:**
```javascript
const pdfs = await getGeneratedPDFs();
pdfs.forEach(pdf => {
  console.log(`${pdf.name} (${(pdf.size / 1024).toFixed(2)} KB)`);
});
```

## PDF Structure

### Page 1: Summary Page

The first page contains an overview of the entire month:

```
═══════════════════════════════════════════════════════════
  Monthly Receipt Summary - March 2024
═══════════════════════════════════════════════════════════

Summary Statistics
├─ Total Receipts:        12
├─ Total Amount:          $1,234.56
├─ Total Tax:             $98.76
└─ Net Amount:            $1,135.80

By Category:
├─ Groceries:             5 receipts
├─ Restaurants:           4 receipts
├─ Office Supplies:       2 receipts
└─ Other:                 1 receipt

Receipt Details
┌─────────┬──────────────┬──────────┬────────┬──────────────┐
│ Date    │ Vendor       │ Amount   │ Tax    │ Invoice#     │
├─────────┼──────────────┼──────────┼────────┼──────────────┤
│ 03/01   │ Whole Foods  │ $45.23   │ $3.52  │ INV-001234   │
│ 03/02   │ Starbucks    │ $12.50   │ $0.00  │ INV-001235   │
│ ...     │ ...          │ ...      │ ...    │ ...          │
└─────────┴──────────────┴──────────┴────────┴──────────────┘

[Footer: This is a summary page. See following pages for individual receipt details.]
```

### Pages 2+: Receipt Detail Pages

Each receipt gets a full-page layout:

```
═══════════════════════════════════════════════════════════
[Receipt Header Box]
  VENDOR                           AMOUNT
  Whole Foods                      $45.23
  
  DATE                             TAX
  03/01/2024                       $3.52
  
  CATEGORY                         INVOICE#
  Groceries                        INV-001234

  Payment: Credit Card | Card: Chase Sapphire | OCR Confidence: 98%
═══════════════════════════════════════════════════════════

[Receipt Image - Scaled & Centered]
[Receipt JPEG/PNG displayed at optimal size]

═══════════════════════════════════════════════════════════
[Footer: Receipt ID: 123 | receiptimage.jpg | Uploaded: 03/01/2024]
```

## File Organization

**Output Directory:** `DocumentDirectoryPath/ReceiptKeeper/PDFs/`

**Filename Format:** `YYYY_MonthName_Receipts.pdf`

**Examples:**
- `2024_January_Receipts.pdf`
- `2024_March_Receipts.pdf`
- `2023_December_Receipts.pdf`

## Database Integration

The service queries the `receipts` table for the following fields:

```javascript
{
  id,                    // Receipt ID
  filename,              // Original filename
  file_path,             // Path to receipt image
  date_captured,         // When receipt was captured
  vendor_name,           // OCR: Vendor name
  total_amount,          // OCR: Total amount
  tax_amount,            // OCR: Tax amount
  invoice_number,        // OCR: Invoice/reference number
  category,              // OCR: Receipt category
  currency,              // OCR: Currency (default USD)
  ocr_confidence,        // OCR confidence percentage
  payment_method,        // Payment method (cash, credit, etc.)
  card_name,             // Credit card name if used
  created_at,            // When added to database
}
```

## Error Handling

The service includes comprehensive error handling:

| Scenario | Behavior |
|----------|----------|
| Invalid year format | Returns error object with `success: false` |
| Invalid month format | Returns error object with `success: false` |
| No receipts in month | Returns error with helpful message |
| Missing receipt image | Shows placeholder text in PDF |
| PDF directory creation fails | Throws error, provides message |
| Image embedding fails | Shows error message in PDF, continues |
| Database query fails | Throws error with details |

**Example Error Response:**
```javascript
{
  success: false,
  error: "No receipts available for March 2024. Please check that receipts exist...",
  filePath: null,
  fileName: null,
  receiptsCount: 0,
  totalAmount: 0,
}
```

## Integration with OneDrive Upload

The generated PDFs are ready for upload to OneDrive. Integration example:

```javascript
import { generateMonthlyReceiptPDF } from './services/pdfGeneratorService';
import { uploadFileToOneDrive } from './services/onedriveService';

async function generateAndUpload(year, month) {
  // Generate PDF
  const pdfResult = await generateMonthlyReceiptPDF(year, month);
  
  if (!pdfResult.success) {
    throw new Error(`PDF generation failed: ${pdfResult.error}`);
  }

  // Prepare OneDrive path
  const onedrivePath = `/ReceiptKeeper/Reports/${pdfResult.fileName}`;

  // Upload to OneDrive
  const uploadResult = await uploadFileToOneDrive(
    pdfResult.filePath,
    onedrivePath,
    {
      description: `Monthly receipt report for ${month}/${year}`,
      tags: ['receipt', 'monthly', 'report'],
    }
  );

  return uploadResult;
}
```

## Performance Considerations

**Generation Time:** 5-15 seconds for typical monthly reports (10-30 receipts)

**File Size:**
- Summary page only: ~50 KB
- With receipt images: ~100-500 KB (depends on image quality and count)

**Memory Usage:**
- Loads all receipts into memory temporarily
- Suitable for monthly reports with up to 100+ receipts
- For very large months, consider pagination

**Optimization Tips:**
1. Generate PDFs during off-peak hours
2. Delete old PDFs to save storage
3. Compress receipt images before capture
4. Batch generation for multiple months

## Color Scheme

The PDF uses a professional, accessible color palette:

```javascript
{
  text: '#000000',        // Black text
  lightGray: '#E8E8E8',   // Light background
  darkGray: '#555555',    // Dark labels
  blue: '#0066CC',        // Emphasis (amounts, headers)
  green: '#008000',       // Positive values
  red: '#CC0000',         // Errors/warnings
}
```

## Page Dimensions

- **Page Size:** 8.5" × 11" (612 × 792 points)
- **Margins:** 20 points (0.28")
- **Content Width:** 572 points
- **Max Header Height:** 120 points
- **Max Image Height:** 612 points

## Troubleshooting

### "No receipts found" Error

**Issue:** PDF generation fails with "No receipts available"

**Solutions:**
1. Verify receipts exist in database for the specified month
2. Check that OCR processing is complete (look for `extracted_at` timestamp)
3. Confirm month/year format is correct (MM/YYYY)
4. Run `getAvailableMonths()` to see which months have data

### PDF shows blank receipt images

**Issue:** Receipt images don't appear in PDF

**Solutions:**
1. Check that receipt files still exist at stored paths
2. Verify file permissions allow reading
3. Check storage path configuration
4. Re-capture or re-import receipt images

### File not found in output directory

**Issue:** PDF file not created where expected

**Solutions:**
1. Check `DocumentDirectoryPath` is correct for your platform
2. Verify app has write permissions to Documents directory
3. Check available storage space on device
4. Review error logs for detailed error message

### PDF generation is slow

**Issue:** PDF takes >30 seconds to generate

**Solutions:**
1. Reduce number of receipts per PDF (split by sub-period)
2. Compress receipt images to smaller file size
3. Disable image embedding and use external links
4. Generate PDFs on a background thread

## API Method Chaining Example

```javascript
import { 
  getAvailableMonths, 
  monthHasReceipts, 
  generateMonthlyReceiptPDF,
  getGeneratedPDFs 
} from './services/pdfGeneratorService';

async function generateAllMonthlyReports() {
  try {
    // Get all months with data
    const months = await getAvailableMonths();
    
    console.log(`Found ${months.length} months with receipts`);
    
    // Generate PDF for each month
    const results = [];
    for (const month of months) {
      const result = await generateMonthlyReceiptPDF(
        month.year, 
        month.month
      );
      
      if (result.success) {
        results.push(result);
        console.log(`✓ Generated: ${result.fileName}`);
      } else {
        console.error(`✗ Failed: ${month.displayName} - ${result.error}`);
      }
    }
    
    // List all generated PDFs
    const pdfs = await getGeneratedPDFs();
    console.log(`\nTotal generated PDFs: ${pdfs.length}`);
    
    return results;
  } catch (error) {
    console.error('Batch generation failed:', error);
  }
}
```

## Development Notes

### Adding Custom Headers/Footers

To add custom text to all pages, modify the page creation functions:

```javascript
// Add to every page
page.drawText('CONFIDENTIAL', {
  x: PAGE_WIDTH - 100,
  y: MARGIN,
  fontSize: 10,
  fontColor: COLORS.red,
});
```

### Changing Layout

Adjust these constants to modify PDF appearance:

```javascript
const PAGE_WIDTH = 612;           // Change page width
const PAGE_HEIGHT = 792;          // Change page height
const MARGIN = 20;                // Adjust margins
const COLORS = { ... };           // Modify color scheme
```

### Adding New Fields

To display additional database fields, modify the query in `getMonthlyReceipts()`:

```javascript
// Add to SELECT statement
SELECT 
  ...,
  new_field_name,  // Add your field
  ...
FROM receipts
```

Then update the receipt detail page rendering to display the new field.

## Testing

### Unit Test Example

```javascript
import { generateMonthlyReceiptPDF } from './services/pdfGeneratorService';

describe('pdfGeneratorService', () => {
  test('generates PDF for valid month', async () => {
    const result = await generateMonthlyReceiptPDF('2024', '03');
    expect(result.success).toBe(true);
    expect(result.filePath).toBeDefined();
    expect(result.receiptsCount).toBeGreaterThan(0);
  });

  test('returns error for empty month', async () => {
    const result = await generateMonthlyReceiptPDF('2020', '01');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('rejects invalid year', async () => {
    const result = await generateMonthlyReceiptPDF('invalid', '03');
    expect(result.success).toBe(false);
  });
});
```

## License

Part of the ReceiptKeeper project. See main project LICENSE file.

## Support

For issues or questions about the PDF generator:
1. Check this documentation
2. Review console logs for detailed error messages
3. Check the project's GitHub issues
4. Contact project maintainers

---

**Last Updated:** 2024  
**Version:** 1.0.0  
**Compatibility:** React Native, compatible with Expo and bare React Native
