#!/usr/bin/env node
/**
 * Generate Receipt Keeper app icons
 * Creates a receipt icon with a green checkmark
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon sizes for Android
const sizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// Brand colors
const PRIMARY_COLOR = '#2E7D32'; // Green
const SECONDARY_COLOR = '#FFFFFF'; // White
const ACCENT_COLOR = '#4CAF50'; // Light green

// Create SVG icon (receipt with checkmark)
function createIconSVG(size) {
  const padding = size * 0.1;
  const receiptWidth = size * 0.6;
  const receiptHeight = size * 0.75;
  const receiptX = (size - receiptWidth) / 2;
  const receiptY = (size - receiptHeight) / 2;
  
  // Checkmark position
  const checkX = size * 0.55;
  const checkY = size * 0.6;
  const checkSize = size * 0.35;

  return `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${PRIMARY_COLOR}"/>
  
  <!-- Receipt paper -->
  <rect x="${receiptX}" y="${receiptY}" width="${receiptWidth}" height="${receiptHeight}" 
        rx="${size * 0.03}" fill="${SECONDARY_COLOR}" stroke="#E0E0E0" stroke-width="1"/>
  
  <!-- Receipt lines -->
  <line x1="${receiptX + size*0.08}" y1="${receiptY + size*0.15}" 
        x2="${receiptX + receiptWidth - size*0.08}" y2="${receiptY + size*0.15}" 
        stroke="#BDBDBD" stroke-width="${size*0.02}"/>
  <line x1="${receiptX + size*0.08}" y1="${receiptY + size*0.25}" 
        x2="${receiptX + receiptWidth - size*0.15}" y2="${receiptY + size*0.25}" 
        stroke="#BDBDBD" stroke-width="${size*0.02}"/>
  <line x1="${receiptX + size*0.08}" y1="${receiptY + size*0.35}" 
        x2="${receiptX + receiptWidth - size*0.1}" y2="${receiptY + size*0.35}" 
        stroke="#BDBDBD" stroke-width="${size*0.02}"/>
  <line x1="${receiptX + size*0.08}" y1="${receiptY + size*0.45}" 
        x2="${receiptX + receiptWidth - size*0.2}" y2="${receiptY + size*0.45}" 
        stroke="#BDBDBD" stroke-width="${size*0.02}"/>
  
  <!-- Checkmark circle background -->
  <circle cx="${checkX}" cy="${checkY}" r="${checkSize/2}" fill="${ACCENT_COLOR}" stroke="${PRIMARY_COLOR}" stroke-width="2"/>
  
  <!-- Checkmark -->
  <polyline points="${checkX - checkSize*0.22},${checkY} ${checkX - checkSize*0.05},${checkY + checkSize*0.18} ${checkX + checkSize*0.25},${checkY - checkSize*0.15}" 
            fill="none" stroke="${SECONDARY_COLOR}" stroke-width="${size*0.04}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

// Create round icon SVG
function createRoundIconSVG(size) {
  return createIconSVG(size); // Already circular
}

async function generateIcons() {
  const androidResPath = path.join(__dirname, '../android/app/src/main/res');
  
  for (const [folder, size] of Object.entries(sizes)) {
    const folderPath = path.join(androidResPath, folder);
    
    // Ensure folder exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    // Generate regular icon
    const iconSVG = createIconSVG(size);
    await sharp(Buffer.from(iconSVG))
      .png()
      .toFile(path.join(folderPath, 'ic_launcher.png'));
    
    // Generate round icon
    const roundIconSVG = createRoundIconSVG(size);
    await sharp(Buffer.from(roundIconSVG))
      .png()
      .toFile(path.join(folderPath, 'ic_launcher_round.png'));
    
    console.log(`Generated ${size}x${size} icons in ${folder}`);
  }
  
  console.log('\n✅ All icons generated successfully!');
}

// Also update colors
function updateColors() {
  const colorsPath = path.join(__dirname, '../src/config/constants.js');
  
  const newColors = `export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
};

export const DEFAULT_CARDS = [
  { id: 'card1', name: 'Business Card', color: '#2E7D32' },
  { id: 'card2', name: 'Personal Card', color: '#1976D2' },
  { id: 'card3', name: 'Credit Card', color: '#F57C00' },
];

export const UPLOAD_STATUS = {
  PENDING: 'pending',
  UPLOADING: 'uploading',
  SUCCESS: 'success',
  FAILED: 'failed',
};

export const APP_COLORS = {
  primary: '#2E7D32',      // Green - main brand color
  secondary: '#4CAF50',    // Light green
  success: '#43A047',      // Success green
  error: '#D32F2F',        // Red
  warning: '#F57C00',      // Orange
  background: '#F5F5F5',   // Light gray
  surface: '#FFFFFF',      // White
  text: '#212121',         // Dark gray
  textSecondary: '#757575', // Medium gray
  border: '#E0E0E0',       // Light border
  accent: '#81C784',       // Accent green
};
`;
  
  fs.writeFileSync(colorsPath, newColors);
  console.log('✅ Updated brand colors in constants.js');
}

generateIcons().then(() => {
  updateColors();
}).catch(console.error);
