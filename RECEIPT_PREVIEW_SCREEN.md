# ReceiptPreviewScreen Component

## Overview

`ReceiptPreviewScreen` is a comprehensive React Native component for reviewing and editing OCR-extracted receipt data before saving it to the database. It provides a user-friendly interface for confirming and correcting data extracted from receipt images using OCR technology.

## Features

### 1. **OCR Data Display & Editing**
- Displays captured receipt image as a thumbnail
- Shows extracted fields in editable form inputs:
  - **Date**: Date picker for transaction date (displayed as button with formatted date)
  - **Vendor Name**: Text input for merchant/vendor name
  - **Total Amount**: Numeric input for total purchase amount
  - **Tax Amount**: Numeric input for tax component (optional)
  - **Invoice Number**: Text input for receipt/invoice number (optional)
  - **Category**: Dropdown picker with predefined categories

### 2. **Confidence Score Visualization**
- **Overall Confidence Bar**: Visual progress bar showing OCR overall confidence (0-100%)
- **Field-Level Confidence Indicators**: Shows confidence percentage for each extracted field
- **Low Confidence Highlighting**: Fields with confidence < 70% are highlighted in yellow
- **Confidence Icons**:
  - ✅ High confidence (≥70%)
  - ⚡ Medium confidence (50-69%)
  - ⚠️ Low confidence (<50%)

### 3. **Payment Method Selection**
- Cash option
- Card selection with visual badges showing:
  - Card first digit for type identification
  - Friendly name (e.g., "Personal Cheque • 4****1234")
  - Custom card color border
  - Selected state indicator (✓ checkmark)

### 4. **Form Validation**
- Required field validation:
  - Vendor name must be non-empty
  - Total amount must be provided and numeric
  - Category must be selected
- Optional fields:
  - Tax amount (numeric if provided)
  - Invoice number
- Real-time error display with red border on invalid fields
- Error messages below each field

### 5. **Visual Design**
- Matches existing app styling using `APP_COLORS` constant
- Responsive layout with ScrollView for long forms
- Clean, organized sections with visual hierarchy
- Professional color scheme with green primary color
- Emoji icons for visual recognition

## Props

```javascript
{
  imagePath: string,           // URI to the receipt image file
  ocrData: {                   // OCR extracted data object
    date: string,              // ISO date string
    vendorName: string,        // Extracted vendor name
    totalAmount: number,       // Total amount
    taxAmount: number,         // Tax amount
    invoiceNumber: string,     // Invoice/receipt number
    category: string,          // Receipt category
    rawOcrText: string,        // Full OCR text
    overallConfidence: number, // Overall confidence (0-1)
    confidences: {             // Per-field confidence scores (0-1)
      date: number,
      vendor: number,
      total: number,
      tax: number,
      invoice: number,
      category: number,
    }
  },
  receiptId: number,           // ID of receipt in database (for saving)
  onBack: function,            // Callback when user cancels
  onSaveSuccess: function,     // Optional callback on successful save
}
```

## Categories

The component includes the following predefined receipt categories:

- Food & Dining
- Transportation
- Office Supplies
- Utilities
- Healthcare
- Entertainment
- Travel
- Other

## Data Flow

```
1. User views receipt image and extracted data
2. User can:
   - Edit any field (except raw OCR text, which is read-only)
   - Confirm or correct confidence-flagged fields (yellow highlighted)
   - Select payment method and category
3. User clicks "Save Receipt"
4. Component validates form
5. If valid:
   - Saves OCR data to database via saveOCRData()
   - Shows success toast
   - Calls onSaveSuccess callback or returns to MainScreen
6. If invalid:
   - Shows validation error toast
   - Highlights invalid fields in red
```

## Integration

### Basic Usage

```javascript
import ReceiptPreviewScreen from '../screens/ReceiptPreviewScreen';

// In parent component
const [showPreview, setShowPreview] = useState(false);
const [receiptData, setReceiptData] = useState(null);

if (showPreview) {
  return (
    <ReceiptPreviewScreen
      imagePath={receiptData.imagePath}
      ocrData={receiptData.ocrData}
      receiptId={receiptData.receiptId}
      onBack={() => setShowPreview(false)}
      onSaveSuccess={(data) => {
        console.log('Receipt saved:', data);
        setShowPreview(false);
      }}
    />
  );
}
```

### Integration with OCR Service

```javascript
// Example: After OCR extraction, show preview
import { performOCR } from '../services/ocrService';

const handleCaptureImage = async (imagePath) => {
  const ocrResult = await performOCR(imagePath);
  
  const receipt = await saveReceipt({
    filename: 'receipt.jpg',
    filePath: imagePath,
    paymentMethod: 'card',
    // ... other fields
  });
  
  setReceiptData({
    imagePath,
    ocrData: ocrResult,
    receiptId: receipt.id,
  });
  setShowPreview(true);
};
```

## Database Integration

The component uses the following database functions:

### saveOCRData(receiptId, ocrData)
Saves OCR-extracted data to an existing receipt record.

**Parameters:**
- `receiptId` (number): Receipt ID in database
- `ocrData` (object): Data to save
  ```javascript
  {
    vendorName: string,
    totalAmount: number,
    taxAmount: number,
    invoiceNumber: string,
    category: string,
    currency: string (default: 'USD'),
    rawOcrText: string,
    ocrConfidence: number,
  }
  ```

**Returns:** Promise<void>

## Styling

The component uses the `APP_COLORS` constant from `/src/config/constants.js`:

```javascript
{
  primary: '#2E7D32',      // Green - main buttons
  secondary: '#4CAF50',    // Light green
  success: '#43A047',      // Success button
  error: '#D32F2F',        // Error text/borders
  warning: '#F57C00',      // Warning indicators
  background: '#F5F5F5',   // Page background
  surface: '#FFFFFF',      // Card/input background
  text: '#212121',         // Primary text
  textSecondary: '#757575',// Secondary text
  border: '#E0E0E0',       // Borders
  accent: '#81C784',       // Accent elements
}
```

## Field Confidence Color Coding

- **Green (≥70%)**: High confidence - no highlighting
- **Pale Yellow (50-69%)**: Medium confidence - light yellow background
- **Light Yellow (<50%)**: Low confidence - bright yellow background with warning icon
- **Red**: Validation error - red border

## Notifications

Uses `react-native-toast-message` for user feedback:

- **Success**: "✅ Receipt Saved!" with vendor name and amount
- **Validation Error**: "❌ Validation Error" with message "Please fix all errors before saving"
- **Save Error**: "❌ Error" with error message

## Actions

### Save Receipt
- ✅ Validates form
- ✅ Saves OCR data to database
- ✅ Shows success notification
- ✅ Navigates back to previous screen

### Retake Photo
- Opens confirmation dialog
- Returns to camera/image selection screen
- All edits are lost

### Cancel
- Returns to previous screen
- All edits are discarded

## Future Enhancements

1. **Image Annotation**: Add layer to annotate image with extracted fields (for visual verification)
2. **Advanced Date Picker**: Integrate native date picker UI (currently shows alert)
3. **Confidence Explanation**: Show why confidence is low for specific fields
4. **Field Suggestions**: Show alternative values based on OCR if confidence is low
5. **Batch Editing**: Edit multiple receipts in sequence
6. **Undo/Redo**: Support for reverting changes
7. **Receipt Templates**: Auto-populate fields based on vendor history

## Dependencies

### External
- `react-native-toast-message`: Toast notifications
- `@react-native-community/netinfo`: (via app) For connectivity checks

### Internal
- `APP_COLORS`: Color constants from `/src/config/constants.js`
- `CardBadge`: Card visual component
- `saveOCRData()`: Database function from `/src/database/database.js`
- `DEFAULT_CARDS`: Payment cards list

## Performance Considerations

- Image thumbnail is rendered with `resizeMode: 'contain'` to prevent scaling issues
- ScrollView allows handling of long forms on small screens
- Confidence calculations are done client-side (fast)
- Database save operation is async with loading indicator

## Accessibility

- Clear visual hierarchy with emoji icons
- Color contrast meets WCAG standards
- Error messages are descriptive
- Touch targets are ≥48px (recommended minimum)
- Form labels are associated with inputs

## Testing Checklist

- [ ] Load with mock OCR data containing various confidence levels
- [ ] Edit each field and verify changes
- [ ] Test form validation with empty/invalid values
- [ ] Select different payment methods
- [ ] Open/close category dropdown
- [ ] Save receipt and verify database update
- [ ] Test error handling (network, database errors)
- [ ] Test with low-confidence fields (highlighted in yellow)
- [ ] Verify toast notifications appear correctly
- [ ] Test on both Android and iOS devices
- [ ] Test with long vendor names or OCR text
- [ ] Verify image displays correctly at different sizes

## Troubleshooting

### Fields Not Showing Confidence Indicators
- Ensure `ocrData.confidences` object is populated with field names matching: `date`, `vendor`, `total`, `tax`, `invoice`, `category`

### Yellow Highlight Not Appearing
- Verify confidence value is less than 0.7 (70%)
- Check `getConfidenceColor()` function returns a valid color

### Database Save Fails
- Ensure `receiptId` is valid
- Verify database is initialized with OCR fields migration
- Check network connectivity for any cloud sync operations

### Payment Method Not Saving
- Selected card is for UI display only; actual payment method is saved separately
- Ensure payment method selection is passed to parent/database

## License

Part of ReceiptKeeper application
