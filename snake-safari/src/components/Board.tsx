import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import type { Direction, FoodItem, Point } from '../game/engine';
import { WALL_WIDTH, colors } from '../theme';
import { AnimalShape } from './Animal';
import { Snake } from './Snake';

interface BoardProps {
  cols: number;
  rows: number;
  cell: number;
  snake: readonly Point[];
  direction: Direction;
  food: FoodItem | null;
  time: number;
  dead: boolean;
}

/** Ground + grid. Only re-renders when the board size changes. */
const Ground = memo(function Ground({ cols, rows, cell }: { cols: number; rows: number; cell: number }) {
  const w = cols * cell;
  const h = rows * cell;
  let d = '';
  for (let x = 1; x < cols; x++) d += `M${x * cell} 0 V${h} `;
  for (let y = 1; y < rows; y++) d += `M0 ${y * cell} H${w} `;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={colors.navy} />
      <Path d={d} stroke={colors.grid} strokeWidth={1} />
    </>
  );
});

const BLINK_WINDOW_MS = 2000;

function foodOpacity(food: FoodItem, time: number): number {
  if (food.expiresAt === null) return 1;
  const remaining = food.expiresAt - time;
  if (remaining > BLINK_WINDOW_MS) return 1;
  return Math.floor(remaining / 250) % 2 === 0 ? 1 : 0.35;
}

export function Board({ cols, rows, cell, snake, direction, food, time, dead }: BoardProps) {
  const w = cols * cell;
  const h = rows * cell;
  return (
    <View style={[styles.wall, { width: w + WALL_WIDTH * 2, height: h + WALL_WIDTH * 2 }]}>
      <Svg width={w} height={h}>
        <Ground cols={cols} rows={rows} cell={cell} />
        {food && (
          <AnimalShape
            kind={food.kind}
            x={food.pos.x * cell}
            y={food.pos.y * cell}
            size={cell}
            opacity={foodOpacity(food, time)}
          />
        )}
        <Snake snake={snake} direction={direction} cell={cell} dead={dead} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wall: {
    borderWidth: WALL_WIDTH,
    borderColor: colors.red,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.navy,
  },
});
