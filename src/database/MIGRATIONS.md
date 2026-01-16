# ReceiptKeeper Database Migrations

This directory contains database migration scripts for ReceiptKeeper. Migrations are executed automatically when the database is initialized and are tracked to prevent duplicate execution.

## Migration System Overview

### How It Works

1. **Automatic Execution**: Migrations run automatically during `initDatabase()` call
2. **Idempotent Design**: Each migration checks if changes have already been applied before executing
3. **Tracking**: Applied migrations are recorded in the `migrations` table
4. **Error Handling**: Migration failures are logged but don't prevent app startup (graceful degradation)

### Directory Structure

```
src/database/
├── database.js              # Main database module (integrates migrations)
├── migrationRunner.js       # Migration orchestration and tracking
├── index.js                 # Database exports
└── migrations/
    └── 001_add_ocr_fields.js  # OCR fields migration
```

## Available Migrations

### Migration 001: Add OCR Fields (`001_add_ocr_fields.js`)

**Purpose**: Adds fields for storing OCR-extracted data and OCR process metadata.

**Fields Added**:
- `vendor_name` (TEXT) - Name of the vendor/merchant extracted from the receipt
- `total_amount` (REAL) - Total amount extracted from the receipt  
- `tax_amount` (REAL) - Tax amount extracted from the receipt
- `invoice_number` (TEXT) - Invoice or receipt number extracted from the receipt
- `category` (TEXT) - Category of the receipt (e.g., food, utilities, office supplies)
- `currency` (TEXT) - Currency of the transaction (defaults to 'USD')
- `raw_ocr_text` (TEXT) - Full text extracted from OCR before processing
- `ocr_confidence` (REAL) - Confidence score of the OCR process (0-100 or 0-1)
- `extracted_at` (DATETIME) - Timestamp of when OCR extraction was performed

**Features**:
- Column existence check (idempotent)
- Proper error handling
- Detailed logging
- Can be safely run multiple times

## Usage

### For Developers

#### Automatic Migration (Recommended)

Migrations run automatically when the database initializes:

```javascript
import { initDatabase } from './src/database/database.js';

// Migrations run automatically
const db = await initDatabase();
```

#### Check Migration Status

```javascript
import { getDatabaseMigrationStatus } from './src/database/database.js';

const status = await getDatabaseMigrationStatus();
console.log('Applied migrations:', status);
```

#### Save OCR Data

```javascript
import { saveOCRData } from './src/database/database.js';

const ocrData = {
  vendorName: 'Starbucks',
  totalAmount: 8.45,
  taxAmount: 0.68,
  invoiceNumber: '12345',
  category: 'Food & Beverage',
  currency: 'USD',
  rawOcrText: 'Full text from OCR...',
  ocrConfidence: 0.95,
};

await saveOCRData(receiptId, ocrData);
```

### Creating New Migrations

To create a new migration:

1. **Create a new file** in the `migrations/` directory following the naming pattern: `NNN_migration_name.js`

2. **Implement required functions**:

```javascript
// Required: Main migration function
export const migrate = async (db) => {
  // Your migration logic
};

// Required: Get migration info
export const getMigrationInfo = () => {
  return {
    id: '002',
    name: 'your_migration_name',
    description: 'Description of what this migration does',
    version: '1.0.0',
    createdAt: new Date(),
  };
};

// Optional: Rollback function
export const rollback = async (db) => {
  // Rollback logic (not currently used)
};
```

3. **Register the migration** in `migrationRunner.js`:

```javascript
import * as migration002 from './migrations/002_your_migration.js';

const MIGRATIONS = [
  { id: '001', name: 'add_ocr_fields', module: migration001 },
  { id: '002', name: 'your_migration', module: migration002 }, // Add here
];
```

### Migration Best Practices

1. **Idempotency**: Always check if changes exist before applying
2. **Descriptive Names**: Use clear, descriptive file names
3. **Comments**: Document what each field/change does
4. **Error Handling**: Wrap operations in try-catch blocks
5. **Logging**: Use console.log/warn/error for visibility
6. **No Breaking Changes**: Avoid removing columns or changing types
7. **Backward Compatible**: Ensure old code works with new schema

## Database Schema

### receipts table

```sql
CREATE TABLE receipts (
  -- Original fields
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  onedrive_path TEXT,
  payment_method TEXT NOT NULL,
  card_name TEXT,
  date_captured DATETIME DEFAULT CURRENT_TIMESTAMP,
  upload_status TEXT DEFAULT 'pending',
  year TEXT NOT NULL,
  month TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- OCR fields (added by migration 001)
  vendor_name TEXT,
  total_amount REAL,
  tax_amount REAL,
  invoice_number TEXT,
  category TEXT,
  currency TEXT DEFAULT 'USD',
  raw_ocr_text TEXT,
  ocr_confidence REAL,
  extracted_at DATETIME
)
```

### migrations table

Automatically created by the migration system to track applied migrations:

```sql
CREATE TABLE migrations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  version TEXT
)
```

## Troubleshooting

### Migration Fails to Apply

**Issue**: Column already exists error
- **Solution**: This is expected if running migrations multiple times. The migration checks for column existence and skips if found.

**Issue**: Table doesn't exist error  
- **Solution**: Ensure the receipts table is created before migrations run. Check `database.js` initialization order.

### Check Applied Migrations

```javascript
const status = await getDatabaseMigrationStatus();
status.forEach(m => console.log(`${m.id}: ${m.name} (${m.applied_at})`));
```

## Future Migrations

When adding new OCR features or data fields:

1. Create a new migration file
2. Register it in `migrationRunner.js`
3. Document the changes here
4. Test with the app to ensure proper execution

## Technical Notes

- SQLite ALTER TABLE has limited support (can't modify columns, only add)
- Rollback functionality is not implemented (would require table recreation)
- Migrations are non-transactional (if one fails, others may have partially executed)
- For production use, consider using a more robust migration tool if needed
