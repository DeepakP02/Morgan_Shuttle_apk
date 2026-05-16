import React from 'react';
import { Text, StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { COLORS, SIZES, SPACING } from '../../constants/theme';

export const Button = ({ title, onPress, type = 'primary', style, textStyle, icon, loading }) => {
  const bg = type === 'primary' ? COLORS.primary : type === 'secondary' ? COLORS.secondary : COLORS.gray[100];
  const color = type === 'primary' || type === 'secondary' ? COLORS.white : COLORS.black;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={loading}
      style={[
        styles.button,
        { backgroundColor: bg },
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={color} size="small" />
        ) : (
          <>
            {icon && <View style={styles.icon}>{icon}</View>}
            <Text style={[styles.text, { color }, textStyle]}>{title}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    // Removed shadows for potential native crash in SDK 55
    borderWidth: 1,
    borderColor: 'transparent',
  },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 16, fontWeight: 'bold' },
  icon: { marginRight: 8 },
});
