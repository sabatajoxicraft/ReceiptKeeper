export const PAYMENT_METHODS = {
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
