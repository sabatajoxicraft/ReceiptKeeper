/**
 * Migration: Add OCR-related fields to receipts table
 * 
 * This migration adds fields necessary for storing OCR-extracted data and metadata
 * about the optical character recognition process.
 * 
 * Migration ID: 001
 * Created: 2024
 */

/**
 * Helper function to check if a column exists in a table
 * @param {Object} db - SQLite database instance
 * @param {string} tableName - Name of the table
 * @param {string} columnName - Name of the column to check
 * @returns {Promise<boolean>} - True if column exists, false otherwise
 */
async function columnExists(db, tableName, columnName) {
  try {
    const result = await db.executeSql(
      `PRAGMA table_info(${tableName})`
    );
    
    if (result[0] && result[0].rows) {
      for (let i = 0; i < result[0].rows.length; i++) {
        const row = result[0].rows.item(i);
        if (row.name === columnName) {
          return true;
        }
      }
    }
    return false;
  } catch (error) {
    console.error(`Error checking if column ${columnName} exists:`, error);
    return false;
  }
}

/**
 * Helper function to add a column if it doesn't exist
 * @param {Object} db - SQLite database instance
 * @param {string} tableName - Name of the table
 * @param {string} columnName - Name of the column to add
 * @param {string} columnDefinition - Column type and constraints
 * @returns {Promise<boolean>} - True if column was added or already exists
 */
async function addColumnIfNotExists(db, tableName, columnName, columnDefinition) {
  try {
    const exists = await columnExists(db, tableName, columnName);
    
    if (exists) {
      console.log(`Column ${columnName} already exists in ${tableName}, skipping`);
      return true;
    }
    
    console.log(`Adding column ${columnName} to ${tableName}`);
    await db.executeSql(
      `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`
    );
    console.log(`Successfully added column ${columnName}`);
    return true;
  } catch (error) {
    console.error(`Error adding column ${columnName}:`, error);
    throw error;
  }
}

/**
 * Execute the migration
 * @param {Object} db - SQLite database instance
 * @returns {Promise<void>}
 */
export const migrate = async (db) => {
  console.log('Starting migration 001: Adding OCR fields to receipts table');
  
  try {
    // Add vendor_name column - Name of the vendor/merchant extracted from receipt
    await addColumnIfNotExists(
      db,
      'receipts',
      'vendor_name',
      'TEXT'
    );
    
    // Add total_amount column - Total amount extracted from receipt
    await addColumnIfNotExists(
      db,
      'receipts',
      'total_amount',
      'REAL'
    );
    
    // Add tax_amount column - Tax amount extracted from receipt
    await addColumnIfNotExists(
      db,
      'receipts',
      'tax_amount',
      'REAL'
    );
    
    // Add invoice_number column - Invoice or receipt number extracted from receipt
    await addColumnIfNotExists(
      db,
      'receipts',
      'invoice_number',
      'TEXT'
    );
    
    // Add category column - Category of the receipt (e.g., food, utilities, office supplies)
    await addColumnIfNotExists(
      db,
      'receipts',
      'category',
      'TEXT'
    );
    
    // Add currency column - Currency of the transaction with USD as default
    await addColumnIfNotExists(
      db,
      'receipts',
      'currency',
      "TEXT DEFAULT 'USD'"
    );
    
    // Add raw_ocr_text column - Full text extracted from OCR before processing
    await addColumnIfNotExists(
      db,
      'receipts',
      'raw_ocr_text',
      'TEXT'
    );
    
    // Add ocr_confidence column - Confidence score of the OCR process (0-100 or 0-1)
    await addColumnIfNotExists(
      db,
      'receipts',
      'ocr_confidence',
      'REAL'
    );
    
    // Add extracted_at column - Timestamp of when OCR extraction was performed
    await addColumnIfNotExists(
      db,
      'receipts',
      'extracted_at',
      'DATETIME'
    );
    
    console.log('Migration 001 completed successfully');
    return true;
  } catch (error) {
    console.error('Migration 001 failed:', error);
    throw new Error(`Migration 001 failed: ${error.message}`);
  }
};

/**
 * Optional: Rollback function for reverting the migration
 * Note: SQLite has limited ALTER TABLE support, so rollback would require
 * recreating the table. This is provided for reference.
 * 
 * @param {Object} db - SQLite database instance
 * @returns {Promise<void>}
 */
export const rollback = async (db) => {
  console.log('Rolling back migration 001: Removing OCR fields from receipts table');
  console.warn('Rollback for this migration requires table recreation - not implemented');
  // Actual rollback would require creating a backup, recreating the table, and copying data
  // For production use, consider using a dedicated migration tool
};

/**
 * Get migration metadata
 * @returns {Object} - Migration information
 */
export const getMigrationInfo = () => {
  return {
    id: '001',
    name: 'add_ocr_fields',
    description: 'Add OCR-related fields to receipts table',
    version: '1.0.0',
    createdAt: new Date(),
  };
};
