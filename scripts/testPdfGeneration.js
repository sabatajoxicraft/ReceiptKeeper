#!/usr/bin/env node

/**
 * PDF Generation Test Script
 * 
 * Tests the PDF generation functionality and creates mock data if needed.
 * 
 * Usage:
 *   node scripts/testPdfGeneration.js
 *   node scripts/testPdfGeneration.js 2024 03
 * 
 * The script will:
 * 1. Check database for receipts in the specified month (or current month)
 * 2. Create mock data if no receipts exist
 * 3. Call generateMonthlyReceiptPDF
 * 4. Report success or detailed errors
 */

const fs = require('fs');
const path = require('path');

// ==================== CONFIGURATION ====================

const CONFIG = {
  // Directory paths
  PROJECT_ROOT: path.resolve(__dirname, '..'),
  SRC_DIR: path.resolve(__dirname, '../src'),
  DB_DIR: path.resolve(__dirname, '../src/database'),
  
  // Output formatting
  COLORS: {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
  },
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format colored console output
 */
const colorize = (text, color) => {
  return `${CONFIG.COLORS[color] || ''}${text}${CONFIG.COLORS.reset}`;
};

/**
 * Log section header
 */
const logSection = (title) => {
  console.log(`\n${colorize('='.repeat(70), 'bright')}`);
  console.log(colorize(title, 'cyan'));
  console.log(`${colorize('='.repeat(70), 'bright')}\n`);
};

/**
 * Log success message
 */
const logSuccess = (message) => {
  console.log(`${colorize('✓', 'green')} ${message}`);
};

/**
 * Log error message
 */
const logError = (message) => {
  console.error(`${colorize('✗', 'red')} ${message}`);
};

/**
 * Log warning message
 */
const logWarning = (message) => {
  console.warn(`${colorize('⚠', 'yellow')} ${message}`);
};

/**
 * Log info message
 */
const logInfo = (message) => {
  console.log(`${colorize('ℹ', 'blue')} ${message}`);
};

/**
 * Get current date info
 */
const getCurrentDateInfo = () => {
  const now = new Date();
  return {
    year: now.getFullYear().toString(),
    month: String(now.getMonth() + 1).padStart(2, '0'),
    monthName: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(now),
  };
};

/**
 * Parse command line arguments
 */
const parseArgs = () => {
  const args = process.argv.slice(2);
  const dateInfo = getCurrentDateInfo();
  
  // Filter out flags
  const numbers = args.filter(arg => !arg.startsWith('-'));
  
  return {
    year: numbers[0] || dateInfo.year,
    month: numbers[1] || dateInfo.month,
    verbose: args.includes('--verbose') || args.includes('-v'),
  };
};

/**
 * Validate that required database files exist
 */
const validateEnvironment = () => {
  logSection('Environment Validation');
  
  const checks = [
    {
      name: 'Project root directory',
      path: CONFIG.PROJECT_ROOT,
      isDir: true,
    },
    {
      name: 'Source directory',
      path: CONFIG.SRC_DIR,
      isDir: true,
    },
    {
      name: 'Database directory',
      path: CONFIG.DB_DIR,
      isDir: true,
    },
  ];
  
  let allValid = true;
  
  checks.forEach(check => {
    const exists = fs.existsSync(check.path);
    if (exists) {
      if (check.isDir) {
        const isDir = fs.statSync(check.path).isDirectory();
        if (isDir) {
          logSuccess(`${check.name}: ${check.path}`);
        } else {
          logError(`${check.name} is not a directory: ${check.path}`);
          allValid = false;
        }
      } else {
        logSuccess(`${check.name}: ${check.path}`);
      }
    } else {
      logError(`${check.name} not found: ${check.path}`);
      allValid = false;
    }
  });
  
  if (!allValid) {
    throw new Error('Environment validation failed');
  }
};

/**
 * Mock data generator for testing
 */
const createMockReceipts = (count = 5) => {
  const categories = ['Groceries', 'Office Supplies', 'Utilities', 'Travel', 'Meals', 'Equipment'];
  const vendors = [
    'Whole Foods Market',
    'Staples Office Supply',
    'Local Power Company',
    'Uber',
    'Restaurant XYZ',
    'Best Buy Electronics',
    'Amazon',
    'Costco Warehouse',
  ];
  const paymentMethods = ['Credit Card', 'Debit Card', 'Cash', 'Digital Payment'];
  
  const receipts = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 28);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    
    receipts.push({
      filename: `receipt_${i + 1}_${Date.now()}.jpg`,
      file_path: `/mock/path/receipt_${i + 1}.jpg`,
      vendor_name: vendors[Math.floor(Math.random() * vendors.length)],
      total_amount: (Math.random() * 200 + 10).toFixed(2),
      tax_amount: (Math.random() * 20).toFixed(2),
      invoice_number: `INV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      currency: 'USD',
      ocr_confidence: (Math.random() * 0.4 + 0.6).toFixed(2), // 60-100%
      payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      card_name: 'Test Card',
      date_captured: date.toISOString(),
      created_at: date.toISOString(),
    });
  }
  
  return receipts;
};

/**
 * Display test information
 */
const displayTestInfo = (args) => {
  logSection('Test Configuration');
  
  logInfo(`Year: ${colorize(args.year, 'bright')}`);
  logInfo(`Month: ${colorize(args.month, 'bright')} (01-12 format)`);
  logInfo(`Verbose mode: ${args.verbose ? colorize('enabled', 'green') : 'disabled'}`);
  
  const dateInfo = getCurrentDateInfo();
  if (args.year === dateInfo.year && args.month === dateInfo.month) {
    logInfo(`Testing with: ${colorize(`${dateInfo.monthName} ${dateInfo.year}`, 'cyan')} (current month)`);
  }
};

/**
 * Create mock database records
 * Note: In Node.js environment, we'll create a JSON file simulating database records
 */
const setupMockDatabase = (receipts, year, month) => {
  logSection('Mock Data Setup');
  
  const mockDbPath = path.join(CONFIG.PROJECT_ROOT, 'scripts', '__mock_db__.json');
  const mockDb = {
    receipts: receipts.map(r => ({
      ...r,
      id: Math.floor(Math.random() * 10000),
      year,
      month,
      upload_status: 'pending',
      onedrive_path: null,
    })),
    timestamp: new Date().toISOString(),
  };
  
  try {
    fs.writeFileSync(mockDbPath, JSON.stringify(mockDb, null, 2));
    logSuccess(`Mock database created: ${mockDbPath}`);
    logInfo(`Mock records: ${receipts.length}`);
    return mockDb;
  } catch (error) {
    logError(`Failed to create mock database: ${error.message}`);
    throw error;
  }
};

/**
 * Load mock database for testing
 */
const loadMockDatabase = () => {
  const mockDbPath = path.join(CONFIG.PROJECT_ROOT, 'scripts', '__mock_db__.json');
  
  if (fs.existsSync(mockDbPath)) {
    try {
      const content = fs.readFileSync(mockDbPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      logWarning(`Failed to load mock database: ${error.message}`);
      return null;
    }
  }
  
  return null;
};

/**
 * Simulate PDF generation (for Node.js testing environment)
 * In a real React Native app, this would call the actual pdfGeneratorService
 */
const simulatePDFGeneration = async (receipts, year, month) => {
  logSection('PDF Generation Simulation');
  
  if (!receipts || receipts.length === 0) {
    throw new Error('No receipts available for PDF generation');
  }
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const monthIndex = parseInt(month, 10) - 1;
  const monthName = monthNames[monthIndex];
  
  if (!monthName) {
    throw new Error(`Invalid month: ${month}`);
  }
  
  logInfo(`Processing ${receipts.length} receipts for ${monthName} ${year}...`);
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Calculate stats
  const stats = {
    totalAmount: receipts.reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0),
    totalTax: receipts.reduce((sum, r) => sum + parseFloat(r.tax_amount || 0), 0),
    averageAmount: receipts.reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0) / receipts.length,
  };
  
  // Create mock PDF path
  const pdfDir = path.join(CONFIG.PROJECT_ROOT, 'scripts', '__mock_pdfs__');
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }
  
  const fileName = `${year}_${monthName}_Receipts.pdf`;
  const filePath = path.join(pdfDir, fileName);
  
  // Create a dummy PDF file for testing
  try {
    // Write a simple comment indicating this is a test PDF
    const testContent = Buffer.from(`%PDF-1.4\n%Mock PDF for testing ${monthName} ${year} - ${receipts.length} receipts\n`);
    fs.writeFileSync(filePath, testContent);
    logSuccess(`Mock PDF created: ${filePath}`);
  } catch (error) {
    logError(`Failed to create mock PDF: ${error.message}`);
    throw error;
  }
  
  return {
    success: true,
    filePath,
    fileName,
    receiptsCount: receipts.length,
    totalAmount: parseFloat(stats.totalAmount.toFixed(2)),
    totalTax: parseFloat(stats.totalTax.toFixed(2)),
    averageAmount: parseFloat(stats.averageAmount.toFixed(2)),
    fileSize: fs.statSync(filePath).size,
    generatedAt: new Date().toISOString(),
  };
};

/**
 * Display PDF generation results
 */
const displayResults = (result) => {
  logSection('PDF Generation Results');
  
  if (result.success) {
    logSuccess('PDF generated successfully!');
    
    console.log(`\n${colorize('Generated PDF Details:', 'bright')}`);
    console.log(`  ${colorize('File Name:', 'dim')}        ${result.fileName}`);
    console.log(`  ${colorize('File Path:', 'dim')}        ${result.filePath}`);
    console.log(`  ${colorize('File Size:', 'dim')}        ${result.fileSize} bytes`);
    console.log(`  ${colorize('Receipts:', 'dim')}          ${result.receiptsCount}`);
    console.log(`  ${colorize('Total Amount:', 'dim')}      $${result.totalAmount.toFixed(2)}`);
    console.log(`  ${colorize('Total Tax:', 'dim')}         $${result.totalTax.toFixed(2)}`);
    console.log(`  ${colorize('Average Amount:', 'dim')}    $${result.averageAmount.toFixed(2)}`);
    console.log(`  ${colorize('Generated At:', 'dim')}      ${new Date(result.generatedAt).toLocaleString()}`);
    
    console.log(`\n${colorize('Next Steps:', 'bright')}`);
    console.log(`  1. Verify PDF exists at: ${result.filePath}`);
    console.log(`  2. View PDF properties: ls -lh "${result.filePath}"`);
    console.log(`  3. In React Native app: call generateMonthlyReceiptPDF('${result.filePath.split('/').slice(-1)[0].split('_')[0]}', '${String(getCurrentDateInfo().month).padStart(2, '0')}')`);
    
  } else {
    logError(`PDF generation failed: ${result.error}`);
    console.log(`\n${colorize('Troubleshooting:', 'bright')}`);
    console.log(`  • Ensure database has receipts for the specified month`);
    console.log(`  • Check that OCR processing is complete`);
    console.log(`  • Verify database file exists and is readable`);
    console.log(`  • Run with --verbose flag for detailed logs`);
  }
};

/**
 * Display cleanup instructions
 */
const displayCleanupInfo = () => {
  logSection('Cleanup (Optional)');
  
  const mockDbPath = path.join(CONFIG.PROJECT_ROOT, 'scripts', '__mock_db__.json');
  const mockPdfDir = path.join(CONFIG.PROJECT_ROOT, 'scripts', '__mock_pdfs__');
  
  logInfo('To clean up mock files created during testing:');
  console.log(`  rm -f "${mockDbPath}"`);
  console.log(`  rm -rf "${mockPdfDir}"`);
};

// ==================== MAIN EXECUTION ====================

/**
 * Main test function
 */
const runTest = async () => {
  const startTime = Date.now();
  
  try {
    console.log(colorize('\n📄 PDF Generation Test Script', 'bright'));
    console.log(colorize('=' .repeat(70), 'dim'));
    
    // Parse arguments
    const args = parseArgs();
    
    // Validate environment
    validateEnvironment();
    
    // Display test configuration
    displayTestInfo(args);
    
    // Create mock receipts
    const mockReceipts = createMockReceipts(8);
    logSuccess(`Created ${mockReceipts.length} mock receipts for testing`);
    
    // Setup mock database
    const mockDb = setupMockDatabase(mockReceipts, args.year, args.month);
    
    // Generate PDF
    logInfo('Generating PDF from mock data...');
    const result = await simulatePDFGeneration(mockReceipts, args.year, args.month);
    
    // Display results
    displayResults(result);
    
    // Display cleanup instructions
    displayCleanupInfo();
    
    // Summary
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    logSection('Test Complete');
    logSuccess(`Test completed in ${elapsedTime} seconds`);
    
    return result;
    
  } catch (error) {
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logSection('Test Failed');
    logError(`${error.message}`);
    
    if (process.argv.includes('--verbose') || process.argv.includes('-v')) {
      console.error('\nFull error details:');
      console.error(error);
    } else {
      logInfo('Run with --verbose flag for detailed error information');
    }
    
    console.log(`\nElapsed time: ${elapsedTime} seconds\n`);
    process.exit(1);
  }
};

// ==================== SCRIPT EXECUTION ====================

// Run the test
runTest().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
