export const getCardType = (firstDigit) => {
  const digit = (firstDigit || '').toString();

  if (digit === '4') {
    return {
      type: 'Visa',
      color: '#1A1F71',
      icon: 'V',
      badgeText: 'VISA',
      badgeBg: '#1A1F71',
      badgeFg: '#FFFFFF',
    };
  }

  if (digit === '5') {
    return {
      type: 'Mastercard',
      color: '#EB001B',
      icon: 'M',
      badgeText: 'MC',
      badgeBg: '#111111',
      badgeFg: '#FFFFFF',
    };
  }

  if (digit === '3') {
    return {
      type: 'Amex',
      color: '#2E77BC',
      icon: 'A',
      badgeText: 'AMEX',
      badgeBg: '#2E77BC',
      badgeFg: '#FFFFFF',
    };
  }

  if (digit === '6') {
    return {
      type: 'Discover',
      color: '#FF6000',
      icon: 'D',
      badgeText: 'DISC',
      badgeBg: '#FF6000',
      badgeFg: '#111111',
    };
  }

  return {
    type: 'Card',
    color: '#666666',
    icon: '💳',
    badgeText: 'CARD',
    badgeBg: '#666666',
    badgeFg: '#FFFFFF',
  };
};

export const formatMaskedPan = (firstDigit, lastFour) => {
  if (!firstDigit || !lastFour) return '';
  return `${firstDigit}********${lastFour}`;
};

export const formatCardLabel = (card) => {
  if (card?.firstDigit && card?.lastFour) {
    return formatMaskedPan(card.firstDigit, card.lastFour);
  }
  return card?.name || 'Unknown Card';
};
