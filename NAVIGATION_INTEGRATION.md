# ReceiptPreviewScreen Navigation Integration

## Overview

This document describes the integrated navigation flow for the ReceiptPreviewScreen component in the ReceiptKeeper application. The navigation system has been updated to support seamless flow from document capture to preview and editing.

## Navigation Flow

### Complete User Journey

```
MainScreen
    ↓
CaptureScreen
    ├─→ DocumentScannerScreen (OCR + Smart Document)
    │       ↓
    │   Capture & Extract
    │       ↓
    └─→ ReceiptPreviewScreen
            ├─→ Edit & Validate
            └─→ Save
                ├─→ MainScreen (on success)
                └─→ DocumentScannerScreen (on retake)
```

## Implementation Details

### 1. App.js - Main Navigation Container

**Key Changes:**
- Added `previewScreenData` state to hold capture data while in preview screen
- Added `handleNavigateToPreview()` function to transition from Capture to Preview
- Added `handlePreviewSaved()` function to return to Main screen after saving
- Updated screen rendering logic to include preview screen conditionally

**State Management:**
```javascript
const [currentScreen, setCurrentScreen] = useState('main');
const [previewScreenData, setPreviewScreenData] = useState(null);
```

**Screen Routing:**
```javascript
{currentScreen === 'capture' ? (
  <CaptureScreen 
    onBack={handleBackToMain}
    onNavigateToPreview={handleNavigateToPreview}
  />
) : currentScreen === 'preview' && previewScreenData ? (
  <ReceiptPreviewScreen
    captureData={previewScreenData}
    onSaved={handlePreviewSaved}
    onBack={handleBackToMain}
    onRetake={() => setCurrentScreen('capture')}
  />
) : (
  <MainScreen ... />
)}
```

### 2. CaptureScreen.js - Capture Source

**Key Changes:**
- Updated to accept `onNavigateToPreview` prop
- Modified `handleScannerCapture()` to navigate to preview screen instead of showing it inline
- Removed inline ReceiptPreviewScreen rendering
- Removed import of ReceiptPreviewScreen

**Data Passing:**
```javascript
const handleScannerCapture = (data) => {
  if (onNavigateToPreview) {
    onNavigateToPreview({
      uri: data.uri,
      ocrData: data.extractedFields,
      ocrText: data.ocrText,
      captureData: data,
    });
  }
};
```

### 3. ReceiptPreviewScreen.js - Preview & Editing

**Key Changes:**
- Updated to accept `captureData` prop for document scanner flow
- Added initialization logic to handle both:
  - `captureData` from DocumentScannerScreen (new primary path)
  - `ocrData` props for legacy/direct usage
- Added `imageUri` state to track image source
- Updated `handleSave()` to:
  - Save the image file if needed
  - Extract receiptId from saved receipt
  - Save OCR data associated with receipt
  - Call `onSaved()` callback instead of `onSaveSuccess()`
- Updated `handleRetake()` to call `onRetake()` callback

**Props:**
```javascript
const ReceiptPreviewScreen = ({ 
  captureData,          // New: from DocumentScannerScreen
  imagePath,            // Legacy
  ocrData,              // Legacy
  receiptId,            // Legacy
  onBack,               // Return to previous screen
  onSaved,              // Callback when receipt is saved
  onRetake              // Callback to retake photo
})
```

**Data Structure from DocumentScannerScreen:**
```javascript
{
  uri: string,                    // File URI of captured image
  ocrText: string,                // Raw OCR text
  extractedFields: {
    date: string,                 // ISO date string
    vendor: string,               // Vendor/merchant name
    amount: number,               // Total amount
    tax: number,                  // Tax amount
    invoiceNumber: string,        // Invoice/receipt number
    category: string              // Category if extracted
  }
}
```

## Data Flow

### DocumentScannerScreen → ReceiptPreviewScreen

1. **DocumentScannerScreen** captures image and performs OCR
2. Calls `onCapture()` with structured data:
   - `uri`: File path to captured image
   - `ocrText`: Raw OCR text
   - `extractedFields`: Structured data with vendor, amount, date, etc.
3. **CaptureScreen** receives data and calls `onNavigateToPreview()`
4. **App.js** stores data in `previewScreenData` state and switches to preview screen
5. **ReceiptPreviewScreen** receives `captureData` and initializes form fields

### ReceiptPreviewScreen → MainScreen

1. **ReceiptPreviewScreen** validates user-edited data
2. Saves receipt image to local storage
3. Saves OCR/extracted data to database
4. Calls `onSaved()` callback
5. **App.js** receives callback and:
   - Clears `previewScreenData` state
   - Switches to 'main' screen
6. **MainScreen** refreshes receipt list

### ReceiptPreviewScreen → DocumentScannerScreen (Retake)

1. User clicks "Retake Photo" button
2. `handleRetake()` confirms action
3. Calls `onRetake()` callback
4. **App.js** sets `currentScreen` to 'capture'
5. DocumentScannerScreen is displayed for another capture

## Key Features

### ✅ OCR Confidence Indicators
- Fields are highlighted if confidence is below 70%
- Visual indicators show confidence percentage
- Users can quickly identify fields that need verification

### ✅ Data Persistence
- Captured image is saved to local storage (Downloads/ReceiptKeeper)
- OCR data is saved to SQLite database
- Both image and structured data are persisted before upload

### ✅ Validation
- Required fields are validated
- Numeric fields check for valid number format
- User gets immediate feedback on validation errors

### ✅ Payment Methods
- Supports cash selection
- Supports multiple saved credit/debit cards
- Payment method is recorded with receipt

### ✅ Categories
- 8 receipt categories available
- Category selection included in OCR data
- Helps organize receipts by type

## Testing the Integration

### Test Case 1: Complete OCR Flow
1. Open app and go to Capture Screen
2. Click "📄 Smart Document Scan"
3. Position receipt in frame and tap capture button
4. Wait for OCR processing
5. Verify extracted data appears in preview screen
6. Edit any fields as needed
7. Select payment method
8. Click "✅ Save Receipt"
9. Confirm return to MainScreen with receipt visible

### Test Case 2: Retake Photo
1. Follow Test Case 1 steps 1-5
2. Click "📷 Retake Photo"
3. Confirm retake action
4. Verify DocumentScannerScreen is displayed
5. Capture new image

### Test Case 3: Validation
1. Follow Test Case 1 steps 1-5
2. Clear "Vendor Name" field
3. Try to save without filling required field
4. Verify validation error message appears
5. Fill in required field
6. Successfully save

### Test Case 4: Low Confidence Fields
1. Follow Test Case 1 steps 1-5
2. Look for highlighted fields with low confidence
3. Verify confidence percentage is displayed
4. Confirm user can still save after reviewing

## Error Handling

### Image Saving Fails
- OCR data is still saved to database
- User is informed that image was not saved
- App continues to next screen

### OCR Processing Fails
- Raw OCR text is available from live camera feed
- User can still enter data manually
- Empty extracted fields are handled gracefully

### Database Save Fails
- User receives error toast notification
- Receipt remains on preview screen
- User can retry or cancel

## Future Enhancements

1. **Camera Integration**: Allow photo selection from gallery
2. **Manual Entry Option**: Skip scanner and enter data manually
3. **Receipt History**: View previously captured receipts
4. **Edit Existing**: Modify already-saved receipts
5. **Batch Capture**: Capture multiple receipts in sequence
6. **Export Options**: Export receipt data to CSV/PDF
7. **Receipt Matching**: Match receipts with transactions

## Related Files

- `App.js` - Main navigation orchestrator
- `src/screens/CaptureScreen.js` - Capture source selector
- `src/screens/DocumentScannerScreen.js` - Camera and OCR
- `src/screens/ReceiptPreviewScreen.js` - Preview and editing
- `src/screens/MainScreen.js` - Receipt list display
- `src/database/database.js` - Database operations
- `src/utils/ocrFieldExtractor.js` - OCR field extraction logic
- `src/utils/fileUtils.js` - File storage operations
