import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { Direction } from '../game/engine';
import { colors } from '../theme';

interface DPadProps {
  onDirection: (dir: Direction) => void;
  size?: number;
}

const ROTATION: Record<Direction, number> = { up: 0, right: 90, down: 180, left: 270 };

function Arrow({ dir, size }: { dir: Direction; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: [{ rotate: `${ROTATION[dir]}deg` }] }}>
      <Path d="M12 5 L20 17 L4 17 Z" fill={colors.white} />
    </Svg>
  );
}

function PadButton({ dir, size, onDirection }: { dir: Direction; size: number; onDirection: (d: Direction) => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Move ${dir}`}
      // onPressIn reacts the instant the finger touches, not on release.
      onPressIn={() => onDirection(dir)}
      hitSlop={6}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size, borderRadius: size * 0.28 },
        pressed && styles.pressed,
      ]}
    >
      <Arrow dir={dir} size={size * 0.45} />
    </Pressable>
  );
}

/** On-screen direction pad. */
export const DPad = memo(function DPad({ onDirection, size = 58 }: DPadProps) {
  const gap = 6;
  return (
    <View style={{ width: size * 3 + gap * 2, height: size * 3 + gap * 2 }}>
      <View style={[styles.row, { height: size }]}>
        <PadButton dir="up" size={size} onDirection={onDirection} />
      </View>
      <View style={[styles.row, { height: size, marginVertical: gap, justifyContent: 'space-between' }]}>
        <PadButton dir="left" size={size} onDirection={onDirection} />
        <View style={[styles.center, { width: size * 0.5, height: size * 0.5, borderRadius: size }]} />
        <PadButton dir="right" size={size} onDirection={onDirection} />
      </View>
      <View style={[styles.row, { height: size }]}>
        <PadButton dir="down" size={size} onDirection={onDirection} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  button: {
    backgroundColor: colors.blue,
    borderWidth: 2,
    borderColor: colors.blueDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: colors.red, borderColor: colors.redDark },
  center: { backgroundColor: colors.midnight, borderWidth: 2, borderColor: colors.red },
});
