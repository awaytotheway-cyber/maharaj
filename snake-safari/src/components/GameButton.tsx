import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors } from '../theme';

interface GameButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'red' | 'blue';
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}

export function GameButton({ label, onPress, variant = 'red', style, small = false }: GameButtonProps) {
  const base = variant === 'red' ? colors.red : colors.blue;
  const pressedColor = variant === 'red' ? colors.redDark : colors.blueDark;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        small && styles.small,
        { backgroundColor: pressed ? pressedColor : base, transform: [{ scale: pressed ? 0.97 : 1 }] },
        style,
      ]}
    >
      <Text style={[styles.label, small && styles.smallLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160,
  },
  small: { paddingVertical: 8, paddingHorizontal: 14, minWidth: 0, borderRadius: 10 },
  label: { color: colors.white, fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  smallLabel: { fontSize: 15, fontWeight: '700' },
});
