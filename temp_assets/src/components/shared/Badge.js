import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

export const Badge = ({ label, type = 'primary' }) => {
  const getColors = () => {
    switch(type) {
      case 'success': return { bg: COLORS.success + '20', text: COLORS.success };
      case 'warning': return { bg: COLORS.warning + '20', text: COLORS.warning };
      case 'danger':  return { bg: COLORS.danger + '20',  text: COLORS.danger };
      case 'gray':    return { bg: COLORS.gray[100],      text: COLORS.gray[500] };
      default:        return { bg: COLORS.primary + '20', text: COLORS.primary };
    }
  };

  const theme = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: theme.bg }]}>
      <Text style={[styles.text, { color: theme.text }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'transparent'
  },
  text: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});
