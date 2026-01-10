import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getCardType } from '../utils/cardUtils';

const CardBadge = ({ firstDigit, size = 'md' }) => {
  const { badgeText, badgeBg, badgeFg } = getCardType(firstDigit || '');
  const s = size === 'sm' ? styles.sm : styles.md;

  return (
    <View style={[styles.badge, s, { backgroundColor: badgeBg }]}
    >
      <Text style={[styles.text, { color: badgeFg }]} numberOfLines={1}>
        {badgeText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  md: {
    height: 26,
    minWidth: 52,
  },
  sm: {
    height: 22,
    minWidth: 44,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default CardBadge;
