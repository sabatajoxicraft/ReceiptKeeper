# React Native Vision Camera OCR Integration Guide

## Overview

This guide documents the integration of `react-native-vision-camera-ocr-plus` into the ReceiptKeeper application. The OCR system provides real-time text recognition from camera streams and static photos, with automatic field extraction from receipt text.

## Architecture

```
CaptureScreen
  ├─ DocumentScannerScreen (with integrated OCR)
  │  ├─ Real-time text recognition via frame processor
  │  ├─ Live OCR confidence display
  │  ├─ Photo capture with automatic OCR
  │  └─ Raw OCR text overlay
  │
  └─ ReceiptPreviewScreen
     ├─ Display captured image
     ├─ Show extracted fields (editable)
     ├─ Display confidence scores
     ├─ Save receipt with OCR data
     └─ Allow payment method selection
```

## Components

### 1. DocumentScannerScreen (`src/screens/DocumentScannerScreen.js`)

**Purpose**: Captures receipt photos and performs OCR in real-time.

**Key Features**:
- Real-time text recognition via frame processor
- OCR confidence indicator (0-100%)
- Live OCR text overlay modal
- Automatic field extraction on photo capture
- Processing status indicators
- Error handling with fallbacks

**Props**:
```javascript
<DocumentScannerScreen
  onCapture={(data) => {}} // Called when photo is captured with OCR
  onBack={() => {}}        // Called to go back
/>
```

**Capture Data Structure**:
```javascript
{
  uri: 'file://...',              // Photo file path
  path: '...',                     // Raw path
  width: 1920,                     // Photo width
  height: 1080,                    // Photo height
  ocrText: '...',                  // Raw OCR text from photo
  extractedFields: {               // Structured extracted fields
    date: { value: '2024-01-15', confidence: 0.9 },
    amount: { value: 125.50, confidence: 0.95 },
    vendor: { value: 'ABC Store', confidence: 0.7 },
    invoiceNumber: { value: 'INV-001', confidence: 0.8 },
    tax: { value: 12.55, confidence: 0.85 }
  },
  timestamp: '2024-01-15T10:30:00Z'
}
```

**OCR Configuration**:
```javascript
const { scanText } = useTextRecognition({
  language: 'latin',              // English and European languages
  frameSkipThreshold: 10,         // Process every 10th frame
  useLightweightMode: true,       // Optimized for Android
});
```

### 2. ReceiptPreviewScreen (`src/screens/ReceiptPreviewScreen.js`)

**Purpose**: Displays and edits OCR-extracted fields before saving.

**Key Features**:
- Full-resolution image preview
- Editable OCR fields with confidence indicators
- Raw OCR text viewer
- Field validation before save
- Payment method selection
- Receipt database integration

**Props**:
```javascript
<ReceiptPreviewScreen
  captureData={{...}}      // Data from DocumentScannerScreen
  onSaved={(data) => {}}   // Called when receipt is saved
  onBack={() => {}}        // Called to go back
  onRetake={() => {}}      // Called to retake photo
/>
```

**Saved Receipt Data**:
```javascript
{
  filename: 'receipt_2024-01-15.jpg',
  filePath: '/path/to/receipt',
  onedrivePath: '...',
  paymentMethod: 'CARD',
  cardName: 'Visa',
  // OCR extracted fields
  extractedDate: '2024-01-15',
  extractedAmount: 125.50,
  extractedVendor: 'ABC Store',
  extractedInvoiceNumber: 'INV-001',
  extractedTax: 12.55,
  // Raw data
  rawOcrText: '...',
  hasOcrData: true,
  capturedAt: '2024-01-15T10:30:00Z'
}
```

### 3. OCR Field Extractor (`src/utils/ocrFieldExtractor.js`)

**Purpose**: Parses OCR text and extracts structured receipt fields.

**Main Function**:
```javascript
const result = extractAll(ocrText);
// Returns:
// {
//   date: { value: '2024-01-15', confidence: 0.9 },
//   amount: { value: 125.50, confidence: 0.95 },
//   invoiceNumber: { value: 'INV-001', confidence: 0.8 },
//   vendor: { value: 'ABC Store', confidence: 0.7 },
//   tax: { value: 12.55, confidence: 0.85 },
//   raw: 'original OCR text'
// }
```

**Supported Extraction Patterns**:

1. **Dates** (ISO, US, EU, written formats)
   - ISO: 2024-01-15
   - US: 01/15/2024
   - EU: 15/01/2024
   - Written: January 15 2024

2. **Amounts** (various currency formats)
   - US Currency: $125.50
   - Other symbols: €125.50, £125.50
   - With keywords: "Total: $125.50"

3. **Invoice Numbers**
   - Invoice #: INV-12345
   - Receipt #: RCP-67890
   - Transaction ID: TXN-XXXXX

4. **Vendor Names**
   - From receipt start
   - After "Store:" or similar markers
   - From "Welcome to..." pattern

5. **Tax Amounts**
   - Tax labels: "GST", "VAT", "Sales Tax"
   - With amounts: "Tax: $12.55"

## Integration Flow

### Step 1: User Captures Receipt

```javascript
handleCapture = async () => {
  // 1. Take photo
  const photo = await camera.takePhoto();
  
  // 2. Run OCR on photo
  const ocrResult = await PhotoRecognizer({
    uri: photoUri,
    orientation: 'portrait',
  });
  
  // 3. Extract fields
  const extractedData = extractAll(ocrResult.text);
  
  // 4. Pass to parent
  onCapture({
    uri: photoUri,
    ocrText: ocrResult.text,
    extractedFields: extractedData,
    ...
  });
}
```

### Step 2: User Reviews and Edits Fields

```javascript
// ReceiptPreviewScreen shows:
// - Image preview
// - Editable fields with confidence badges
// - Raw OCR text viewer
// - Validation before save
```

### Step 3: User Selects Payment Method

```javascript
// User chooses:
// - Cash
// - Credit card (from saved cards)

// Receipt saved to database with OCR data
await saveReceipt({
  filename: '...',
  extractedDate: '2024-01-15',
  extractedAmount: 125.50,
  extractedVendor: 'ABC Store',
  extractedInvoiceNumber: 'INV-001',
  extractedTax: 12.55,
  rawOcrText: '...',
  hasOcrData: true,
  ...
})
```

## Real-Time OCR Features

### Frame Processor
The DocumentScannerScreen uses a frame processor that runs on camera frames at 2 FPS for optimal performance:

```javascript
const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  
  runAtTargetFps(2, () => {
    const result = scanText(frame);
    
    if (result?.text && result.text.length > 10) {
      setLiveOcrText(result.text);
      setOcrConfidence(Math.min(0.8, result.text.length / 500));
      
      if (result.text.length > 50) {
        setShowOcrOverlay(true); // Show overlay with detected text
      }
    }
  });
}, [scanText]);
```

### Confidence Scoring
- Confidence ranges from 0 to 1
- Based on:
  - Text length and detection quality
  - Pattern matching accuracy
  - Multiple confirmation sources

Color coding in UI:
- 🟢 Green (0.8+): High confidence
- 🟡 Orange (0.6-0.8): Medium confidence
- 🔴 Red (<0.6): Low confidence

## Performance Considerations

### Android Optimization
- **Frame Skip**: Process every 10th frame (10% overhead)
- **Lightweight Mode**: Reduced accuracy for better performance
- **FPS Limit**: 2 FPS for frame processor
- **Model Caching**: ML Kit models cached after first download

### Memory Management
- Frame processor runs in Reanimated worklet (off-main thread)
- Photo processing done asynchronously
- Large images reduced before base64 encoding

### First Time Setup
- ML Kit models download on first use (~50-100MB)
- Initial OCR may take 5-10 seconds
- Subsequent calls much faster (cached models)

## Error Handling

### Photo OCR Fallback
If PhotoRecognizer fails, falls back to live OCR text:
```javascript
let ocrText = '';
try {
  const ocrResult = await PhotoRecognizer({...});
  ocrText = ocrResult?.text || '';
} catch (ocrError) {
  console.warn('OCR failed, using live text');
  ocrText = liveOcrText; // Fallback
}
```

### Field Extraction Fallback
If extraction fails, empty fields are preserved for manual entry:
```javascript
try {
  extractedData = extractAll(ocrText);
} catch (extractError) {
  console.warn('Extraction failed');
  extractedData = null; // User enters manually
}
```

## Database Schema

The database now includes OCR fields:

```javascript
// Receipt table additions
{
  id: '...',
  filename: '...',
  extractedDate: '2024-01-15',      // From OCR
  extractedAmount: 125.50,           // From OCR
  extractedVendor: 'ABC Store',      // From OCR
  extractedInvoiceNumber: 'INV-001', // From OCR
  extractedTax: 12.55,               // From OCR
  rawOcrText: '...',                 // Raw OCR output
  hasOcrData: true,                  // Whether OCR was used
  capturedAt: '2024-01-15T10:30:00Z',// When captured
  // ... existing fields ...
}
```

See: `src/database/migrations/001_add_ocr_fields.js`

## Usage Examples

### Basic OCR in DocumentScanner
The frame processor automatically detects text and shows:
- Live confidence indicator
- OCR overlay modal
- Processing status

### Extracting Specific Fields
```javascript
import { extractAll } from './src/utils/ocrFieldExtractor';

const ocrText = '...'; // From PhotoRecognizer
const result = extractAll(ocrText);

console.log(result.amount.value);      // 125.50
console.log(result.amount.confidence); // 0.95
console.log(result.date.value);        // 2024-01-15
```

### Accessing Saved OCR Data
```javascript
// Query receipts with OCR data
const receipts = await getReceipts({ 
  hasOcrData: true 
});

receipts.forEach(receipt => {
  console.log('Amount:', receipt.extractedAmount);
  console.log('Vendor:', receipt.extractedVendor);
  console.log('Original OCR:', receipt.rawOcrText);
});
```

## Troubleshooting

### No Text Detected
- Ensure good lighting
- Hold camera steady for 1-2 seconds
- Document should be clearly visible in frame
- Check `frameSkipThreshold` - lower = more processing

### Low Confidence Scores
- Poor image quality or lighting
- Handwritten text (OCR optimized for printed)
- Non-standard formats
- Try increasing `frameSkipThreshold` for more processing

### Slow OCR Processing
- First time setup downloads ML Kit models (5-10s)
- Increase `frameSkipThreshold` to reduce overhead
- Disable `useLightweightMode` for more accuracy
- Clear app cache to refresh models: `RemoveLanguageModel('latin')`

### App Crashes During OCR
- Check logcat for ML Kit errors
- Ensure sufficient device RAM
- Reduce concurrent operations
- Update react-native-vision-camera to latest

## Future Enhancements

1. **Perspective Correction**
   - Automatically detect and correct skewed receipts
   - Improves OCR accuracy for angled photos

2. **Handwriting Recognition**
   - Support for handwritten receipt entries
   - Japanese/Chinese script support

3. **Barcode Recognition**
   - Extract product barcodes
   - Match to product database

4. **Receipt Categorization**
   - Auto-categorize by vendor/content
   - Smart expense categorization

5. **Multi-language Support**
   - Spanish, German, French, etc.
   - Language auto-detection

## Resources

- **OCR Library**: https://github.com/jamenamcinteer/react-native-vision-camera-ocr-plus
- **Vision Camera**: https://react-native-vision-camera.com/
- **ML Kit**: https://developers.google.com/ml-kit
- **Reanimated Worklets**: https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/

## Support

For issues or questions:
1. Check Android Studio logcat for detailed errors
2. Review console logs in app
3. Verify ML Kit models are downloading
4. Check device has sufficient storage (~100MB)
5. Ensure camera permissions are granted
