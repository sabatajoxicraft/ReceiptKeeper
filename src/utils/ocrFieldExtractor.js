/**
 * OCR Field Extractor Utility
 * 
 * Parses receipt/invoice OCR text and extracts key fields including:
 * - Dates in various formats
 * - Currency amounts
 * - Invoice/receipt numbers
 * - Vendor names
 * - Tax amounts
 * 
 * All functions return confidence scores (0-1) indicating extraction reliability
 */

// ============================================================================
// REGEX PATTERNS
// ============================================================================

// Date patterns - supports multiple international formats
const DATE_PATTERNS = {
  // US format: MM/DD/YYYY or MM-DD-YYYY
  usFormat: /(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/,
  
  // European format: DD/MM/YYYY or DD-MM-YYYY
  euFormat: /(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/,
  
  // ISO format: YYYY-MM-DD
  isoFormat: /(\d{4})[-](\d{1,2})[-](\d{1,2})/,
  
  // Written month format: Jan 15 2024, January 15, 2024
  writtenFormat: /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})[\s,]*(\d{4})/i,
  
  // Alternative written: 15 January 2024, 15-Jan-2024
  altWrittenFormat: /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,-]*(\d{4})/i,
};

// Amount patterns - for currency values
const AMOUNT_PATTERNS = {
  // Standard US currency: $125.50, $1,234.56
  usCurrency: /\$\s*([0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?)/,
  
  // Other currency prefixes: £, €, ¥, etc.
  otherCurrency: /([£€¥₹])\s*([0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?)/,
  
  // Amount without currency symbol
  plainAmount: /(?:total|subtotal|amount|price|cost)[\s:]*\$?([0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?)/i,
  
  // Amount followed by keywords
  keywordAmount: /(?:total|subtotal|balance|due|amount due)[\s:]*\$?([0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?)/i,
  
  // Last significant currency amount in text (often the total)
  lastAmount: /\$\s*([0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?)/,
};

// Invoice/receipt number patterns
const INVOICE_PATTERNS = {
  // Invoice #12345 or Invoice: #12345
  invoiceNumber: /(?:invoice\s*[:#]?\s*|inv\s*[:#]?\s*|invoice\s*no\.?\s*|inv\.?\s*no\.?\s*)([a-z0-9]{1,20})/i,
  
  // Receipt #12345 or Receipt: #12345
  receiptNumber: /(?:receipt\s*[:#]?\s*|receipt\s*no\.?\s*|rcpt\s*[:#]?\s*)([a-z0-9]{1,20})/i,
  
  // Transaction ID: xxxxx or Order #xxxxx
  transactionId: /(?:transaction\s*id|order\s*[:#]|trans\s*[:#]|ref\s*[:#]|reference\s*[:#])\s*([a-z0-9]{1,20})/i,
  
  // Generic pattern: # followed by alphanumeric
  hashNumber: /#\s*([a-z0-9]{1,20})/i,
  
  // Standalone numbers (used as fallback)
  standaloneNumber: /(?:^|\n)#?([0-9]{4,20})(?:\n|$)/m,
};

// Vendor/store name patterns
const VENDOR_PATTERNS = {
  // Common patterns at the beginning of receipts
  vendorAtStart: /^[\s]*((?:[a-z0-9]{2,}\s*){1,3})/im,
  
  // Store/Company indicators
  storeIndicator: /(?:store|company|business|shop|restaurant|café)\s*[:#]?\s*([a-z0-9\s&\-']+)/i,
  
  // "Welcome to" or similar
  welcomePattern: /(?:welcome\s+to|thanks\s+for|visit|at)\s+([a-z0-9\s&\-']+)/i,
};

// Tax patterns
const TAX_PATTERNS = {
  // GST, VAT, Tax with amount
  taxLabel: /(?:tax|gst|vat|sales\s+tax|state\s+tax)\s*[:#]?\s*\$?([0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?)/i,
  
  // Tax percentage: 10% or similar
  taxRate: /(?:tax\s+rate|rate|tax)\s*[:#]?\s*([0-9]+(?:\.[0-9]{1,2})?)\s*%/i,
};

// ============================================================================
// DATE EXTRACTION
// ============================================================================

/**
 * Extracts and normalizes dates from OCR text
 * 
 * @param {string} text - OCR text to search
 * @returns {Object} { value: string (YYYY-MM-DD), confidence: number }
 */
function extractDate(text) {
  if (!text || typeof text !== 'string') {
    return { value: null, confidence: 0 };
  }

  const lines = text.split('\n');
  
  // Try ISO format first (most reliable)
  for (const line of lines) {
    const match = line.match(DATE_PATTERNS.isoFormat);
    if (match) {
      const date = normalizeDate(match[1], match[2], match[3], 'iso');
      if (isValidDate(date)) {
        return { value: date, confidence: 0.95 };
      }
    }
  }

  // Try written month format (high confidence)
  for (const line of lines) {
    const match = line.match(DATE_PATTERNS.writtenFormat);
    if (match) {
      const monthNum = getMonthNumber(match[1]);
      const date = normalizeDate(match[3], monthNum, match[2], 'written');
      if (isValidDate(date)) {
        return { value: date, confidence: 0.90 };
      }
    }
  }

  // Try alternative written format (high confidence)
  for (const line of lines) {
    const match = line.match(DATE_PATTERNS.altWrittenFormat);
    if (match) {
      const monthNum = getMonthNumber(match[2]);
      const date = normalizeDate(match[3], monthNum, match[1], 'written');
      if (isValidDate(date)) {
        return { value: date, confidence: 0.90 };
      }
    }
  }

  // Try US format (MM/DD/YYYY)
  for (const line of lines) {
    const match = line.match(DATE_PATTERNS.usFormat);
    if (match) {
      const date = normalizeDate(match[3], match[1], match[2], 'us');
      if (isValidDate(date)) {
        return { value: date, confidence: 0.85 };
      }
    }
  }

  // Try EU format (DD/MM/YYYY)
  for (const line of lines) {
    const match = line.match(DATE_PATTERNS.euFormat);
    if (match) {
      const date = normalizeDate(match[3], match[2], match[1], 'eu');
      if (isValidDate(date)) {
        return { value: date, confidence: 0.80 };
      }
    }
  }

  return { value: null, confidence: 0 };
}

// ============================================================================
// AMOUNT EXTRACTION
// ============================================================================

/**
 * Extracts currency amounts from OCR text
 * Looks for various currency formats and keywords
 * 
 * @param {string} text - OCR text to search
 * @returns {Object} { value: number, confidence: number }
 */
function extractAmount(text) {
  if (!text || typeof text !== 'string') {
    return { value: null, confidence: 0 };
  }

  let bestMatch = null;
  let bestConfidence = 0;

  // Try keyword-based amount (highest priority)
  const keywordMatch = text.match(AMOUNT_PATTERNS.keywordAmount);
  if (keywordMatch) {
    const amount = parseAmount(keywordMatch[1]);
    if (amount !== null && amount > 0 && amount < 1000000) {
      bestMatch = amount;
      bestConfidence = 0.95;
    }
  }

  // Try US currency format
  if (bestConfidence < 0.90) {
    const matches = [...text.matchAll(new RegExp(AMOUNT_PATTERNS.usCurrency.source, 'g'))];
    for (const match of matches) {
      const amount = parseAmount(match[1]);
      if (amount !== null && amount > 0 && amount < 1000000) {
        bestMatch = amount;
        bestConfidence = 0.92;
        // Keep looking for potentially larger amounts (likely the total)
      }
    }
  }

  // Try plain amount format
  if (bestConfidence < 0.88) {
    const plainMatch = text.match(AMOUNT_PATTERNS.plainAmount);
    if (plainMatch) {
      const amount = parseAmount(plainMatch[1]);
      if (amount !== null && amount > 0 && amount < 1000000) {
        bestMatch = amount;
        bestConfidence = 0.85;
      }
    }
  }

  // Try other currency symbols
  if (bestConfidence < 0.85) {
    const otherMatch = text.match(AMOUNT_PATTERNS.otherCurrency);
    if (otherMatch) {
      const amount = parseAmount(otherMatch[2]);
      if (amount !== null && amount > 0 && amount < 1000000) {
        bestMatch = amount;
        bestConfidence = 0.85;
      }
    }
  }

  return {
    value: bestMatch,
    confidence: bestMatch ? bestConfidence : 0
  };
}

// ============================================================================
// INVOICE NUMBER EXTRACTION
// ============================================================================

/**
 * Extracts invoice/receipt numbers from OCR text
 * Tries multiple patterns including invoice #, receipt #, transaction ID, etc.
 * 
 * @param {string} text - OCR text to search
 * @returns {Object} { value: string, confidence: number }
 */
function extractInvoiceNumber(text) {
  if (!text || typeof text !== 'string') {
    return { value: null, confidence: 0 };
  }

  // Try invoice number pattern first (highest priority)
  let match = text.match(INVOICE_PATTERNS.invoiceNumber);
  if (match && match[1]) {
    const invoiceNum = match[1].trim();
    if (isValidInvoiceNumber(invoiceNum)) {
      return { value: invoiceNum, confidence: 0.95 };
    }
  }

  // Try receipt number pattern
  match = text.match(INVOICE_PATTERNS.receiptNumber);
  if (match && match[1]) {
    const receiptNum = match[1].trim();
    if (isValidInvoiceNumber(receiptNum)) {
      return { value: receiptNum, confidence: 0.92 };
    }
  }

  // Try transaction ID pattern
  match = text.match(INVOICE_PATTERNS.transactionId);
  if (match && match[1]) {
    const txId = match[1].trim();
    if (isValidInvoiceNumber(txId)) {
      return { value: txId, confidence: 0.88 };
    }
  }

  // Try hash number pattern
  match = text.match(INVOICE_PATTERNS.hashNumber);
  if (match && match[1]) {
    const hashNum = match[1].trim();
    if (isValidInvoiceNumber(hashNum)) {
      return { value: hashNum, confidence: 0.75 };
    }
  }

  // Try standalone number pattern (lowest priority, lower confidence)
  const lines = text.split('\n');
  for (const line of lines) {
    match = line.match(INVOICE_PATTERNS.standaloneNumber);
    if (match && match[1]) {
      const standAlone = match[1].trim();
      if (isValidInvoiceNumber(standAlone)) {
        return { value: standAlone, confidence: 0.60 };
      }
    }
  }

  return { value: null, confidence: 0 };
}

// ============================================================================
// VENDOR EXTRACTION
// ============================================================================

/**
 * Extracts vendor/store name from OCR text
 * Usually located at the beginning of receipt
 * 
 * @param {string} text - OCR text to search
 * @returns {Object} { value: string, confidence: number }
 */
function extractVendor(text) {
  if (!text || typeof text !== 'string') {
    return { value: null, confidence: 0 };
  }

  // Try store indicator pattern first
  let match = text.match(VENDOR_PATTERNS.storeIndicator);
  if (match && match[1]) {
    const vendor = cleanVendorName(match[1]);
    if (vendor && vendor.length >= 2) {
      return { value: vendor, confidence: 0.90 };
    }
  }

  // Try welcome pattern
  match = text.match(VENDOR_PATTERNS.welcomePattern);
  if (match && match[1]) {
    const vendor = cleanVendorName(match[1]);
    if (vendor && vendor.length >= 2) {
      return { value: vendor, confidence: 0.85 };
    }
  }

  // Try vendor at start pattern
  const lines = text.split('\n');
  for (const line of lines.slice(0, 5)) { // Check first 5 lines
    if (line.trim().length >= 3 && line.trim().length <= 50) {
      // Filter out common non-vendor lines
      if (!line.match(/^\s*(date|time|invoice|receipt|total|address|phone|email)/i)) {
        const vendor = cleanVendorName(line.trim());
        if (vendor && vendor.length >= 2) {
          return { value: vendor, confidence: 0.70 };
        }
      }
    }
  }

  return { value: null, confidence: 0 };
}

// ============================================================================
// TAX EXTRACTION
// ============================================================================

/**
 * Extracts tax amounts from OCR text
 * Looks for GST, VAT, Sales Tax, etc.
 * 
 * @param {string} text - OCR text to search
 * @returns {Object} { value: number, confidence: number }
 */
function extractTaxAmount(text) {
  if (!text || typeof text !== 'string') {
    return { value: null, confidence: 0 };
  }

  // Try tax label pattern
  const match = text.match(TAX_PATTERNS.taxLabel);
  if (match && match[1]) {
    const taxAmount = parseAmount(match[1]);
    if (taxAmount !== null && taxAmount >= 0 && taxAmount < 100000) {
      return { value: taxAmount, confidence: 0.90 };
    }
  }

  // Could potentially calculate tax from amount and tax rate
  // This is a more advanced feature that could be added later

  return { value: null, confidence: 0 };
}

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

/**
 * Extracts all available fields from OCR text in one call
 * Returns a structured object with all extracted data and confidence scores
 * 
 * @param {string} text - OCR text to parse
 * @returns {Object} Structured extraction result
 * @example
 * const result = extractAll(receiptText);
 * // Returns:
 * // {
 * //   date: { value: '2024-01-15', confidence: 0.9 },
 * //   amount: { value: 125.50, confidence: 0.95 },
 * //   invoiceNumber: { value: 'INV-001', confidence: 0.8 },
 * //   vendor: { value: 'ABC Store', confidence: 0.7 },
 * //   tax: { value: 12.55, confidence: 0.85 }
 * // }
 */
function extractAll(text) {
  if (!text || typeof text !== 'string') {
    return {
      date: { value: null, confidence: 0 },
      amount: { value: null, confidence: 0 },
      invoiceNumber: { value: null, confidence: 0 },
      vendor: { value: null, confidence: 0 },
      tax: { value: null, confidence: 0 },
      raw: text
    };
  }

  return {
    date: extractDate(text),
    amount: extractAmount(text),
    invoiceNumber: extractInvoiceNumber(text),
    vendor: extractVendor(text),
    tax: extractTaxAmount(text),
    raw: text
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalizes date components to YYYY-MM-DD format
 * 
 * @param {string} year - Year (4 digits)
 * @param {string|number} month - Month (1-12)
 * @param {string|number} day - Day (1-31)
 * @param {string} format - Format type for validation
 * @returns {string|null} Normalized date or null if invalid
 */
function normalizeDate(year, month, day, format) {
  try {
    const y = parseInt(year, 10);
    let m = parseInt(month, 10);
    let d = parseInt(day, 10);

    // Handle ambiguous US/EU format
    if (format === 'us' || format === 'eu') {
      // If format is ambiguous and both could be valid, prefer US format
      // But check if one is clearly invalid
      if (m > 12 && d <= 12) {
        [m, d] = [d, m]; // Swap to EU format
      }
    }

    // Pad with zeros
    const monthStr = String(m).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    const yearStr = String(y).padStart(4, '0');

    return `${yearStr}-${monthStr}-${dayStr}`;
  } catch (e) {
    return null;
  }
}

/**
 * Validates if a date string is valid
 * 
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {boolean} True if valid date
 */
function isValidDate(dateStr) {
  if (!dateStr) return false;
  
  try {
    const date = new Date(dateStr);
    // Check if date is valid and not in future
    const now = new Date();
    const maxDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    
    return date instanceof Date && 
           !isNaN(date) && 
           date < maxDate &&
           date > new Date('1990-01-01'); // Receipts shouldn't be older than ~1990
  } catch (e) {
    return false;
  }
}

/**
 * Converts month name to month number (1-12)
 * 
 * @param {string} monthName - Month name (e.g., "January", "Jan")
 * @returns {number} Month number or 0 if not found
 */
function getMonthNumber(monthName) {
  const months = {
    'jan': 1, 'january': 1,
    'feb': 2, 'february': 2,
    'mar': 3, 'march': 3,
    'apr': 4, 'april': 4,
    'may': 5,
    'jun': 6, 'june': 6,
    'jul': 7, 'july': 7,
    'aug': 8, 'august': 8,
    'sep': 9, 'september': 9,
    'oct': 10, 'october': 10,
    'nov': 11, 'november': 11,
    'dec': 12, 'december': 12
  };
  
  return months[monthName.toLowerCase().substring(0, 3)] || 0;
}

/**
 * Parses amount string, removing currency symbols and commas
 * 
 * @param {string} amountStr - Amount string (e.g., "1,234.56")
 * @returns {number|null} Parsed amount or null if invalid
 */
function parseAmount(amountStr) {
  if (!amountStr) return null;
  
  try {
    // Remove currency symbols and commas
    const cleaned = amountStr
      .replace(/[^0-9.]/g, '')
      .trim();
    
    const amount = parseFloat(cleaned);
    return isNaN(amount) ? null : amount;
  } catch (e) {
    return null;
  }
}

/**
 * Validates if a string could be an invoice number
 * Invoice numbers typically have 4-20 alphanumeric characters
 * 
 * @param {string} invoiceStr - String to validate
 * @returns {boolean} True if could be valid invoice number
 */
function isValidInvoiceNumber(invoiceStr) {
  if (!invoiceStr) return false;
  
  // Must be 2-20 characters
  if (invoiceStr.length < 2 || invoiceStr.length > 20) return false;
  
  // Must contain only alphanumeric, dashes, or special chars
  if (!/^[a-z0-9\-_]+$/i.test(invoiceStr)) return false;
  
  // Should not be a common word
  const commonWords = ['the', 'and', 'for', 'from', 'with', 'date', 'time', 'total'];
  if (commonWords.includes(invoiceStr.toLowerCase())) return false;
  
  return true;
}

/**
 * Cleans vendor name by trimming and removing common artifacts
 * 
 * @param {string} vendorStr - Raw vendor string
 * @returns {string|null} Cleaned vendor name
 */
function cleanVendorName(vendorStr) {
  if (!vendorStr || typeof vendorStr !== 'string') return null;
  
  let cleaned = vendorStr
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[0-9]{1,3}\s+[A-Z]/, '') // Remove addresses
    .substring(0, 50); // Cap at 50 chars
  
  // Remove trailing punctuation
  cleaned = cleaned.replace(/[.,;:!?]+$/, '');
  
  // Filter out numeric-heavy strings (likely not vendor names)
  const digitRatio = (cleaned.match(/[0-9]/g) || []).length / cleaned.length;
  if (digitRatio > 0.3) return null;
  
  return cleaned.length >= 2 ? cleaned : null;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main functions
  extractAll,
  extractDate,
  extractAmount,
  extractInvoiceNumber,
  extractVendor,
  extractTaxAmount,
  
  // Helper functions (exported for testing)
  normalizeDate,
  isValidDate,
  getMonthNumber,
  parseAmount,
  isValidInvoiceNumber,
  cleanVendorName,
  
  // Patterns (exported for reference/testing)
  patterns: {
    DATE_PATTERNS,
    AMOUNT_PATTERNS,
    INVOICE_PATTERNS,
    VENDOR_PATTERNS,
    TAX_PATTERNS
  }
};
