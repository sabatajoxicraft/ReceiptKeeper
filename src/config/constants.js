export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
};

export const DEFAULT_CARDS = [
  {
    id: 'card1',
    name: 'Personal Cheque • 4********1234',
    friendlyName: 'Personal Cheque',
    accountCategory: 'personal',
    cardKind: 'physical',
    color: '#1A1F71',
    firstDigit: '4',
    lastFour: '1234',
    type: 'Visa',
  },
  {
    id: 'card2',
    name: 'Business Ops • 5********5678',
    friendlyName: 'Business Ops',
    accountCategory: 'business',
    cardKind: 'virtual',
    color: '#111111',
    firstDigit: '5',
    lastFour: '5678',
    type: 'Mastercard',
  },
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
