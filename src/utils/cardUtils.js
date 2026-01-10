export const getCardType = (firstDigit) => {
  const digit = firstDigit.toString();
  if (digit === '4') return { type: 'Visa', color: '#1A1F71', icon: 'V' };
  if (digit === '5') return { type: 'Mastercard', color: '#EB001B', icon: 'M' };
  if (digit === '3') return { type: 'Amex', color: '#2E77BC', icon: 'A' };
  if (digit === '6') return { type: 'Discover', color: '#FF6000', icon: 'D' };
  return { type: 'Card', color: '#666666', icon: '💳' };
};

export const formatCardLabel = (card) => {
  if (card.firstDigit && card.lastFour) {
    const { type } = getCardType(card.firstDigit);
    // Mask: First digit + 8 asterisks + Last 4 (Standard 13-19 digit PAN, usually 16)
    // User requested: "type the first number and the last 4 numbers the inbetween numbers should be astericks"
    // Example: 4********1234
    return `${type} ${card.firstDigit}********${card.lastFour}`;
  }
  return card.name || 'Unknown Card';
};
