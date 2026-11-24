import React, { memo } from 'react';
import { Circle, G, Path, Rect } from 'react-native-svg';
import type { Direction, Point } from '../game/engine';
import { colors } from '../theme';

interface SnakeProps {
  snake: readonly Point[];
  direction: Direction;
  cell: number;
  dead?: boolean;
}

/** The snake, drawn inside the board's <Svg>. Blue rounded body, red head with eyes. */
export const Snake = memo(function Snake({ snake, direction, cell, dead = false }: SnakeProps) {
  if (snake.length === 0) return null;
  const half = cell / 2;
  const cx = (p: Point) => p.x * cell + half;
  const cy = (p: Point) => p.y * cell + half;

  // One continuous rounded "tube" through all segment centers.
  const d = snake.map((p, i) => `${i === 0 ? 'M' : 'L'}${cx(p)} ${cy(p)}`).join(' ');

  const head = snake[0];
  const hx = head.x * cell;
  const hy = head.y * cell;
  const inset = cell * 0.04;

  // Eye positions depend on travel direction.
  const fwd = cell * 0.2;
  const side = cell * 0.2;
  let e1 = { x: 0, y: 0 };
  let e2 = { x: 0, y: 0 };
  let look = { x: 0, y: 0 };
  switch (direction) {
    case 'up':
      e1 = { x: -side, y: -fwd }; e2 = { x: side, y: -fwd }; look = { x: 0, y: -1 };
      break;
    case 'down':
      e1 = { x: -side, y: fwd }; e2 = { x: side, y: fwd }; look = { x: 0, y: 1 };
      break;
    case 'left':
      e1 = { x: -fwd, y: -side }; e2 = { x: -fwd, y: side }; look = { x: -1, y: 0 };
      break;
    case 'right':
      e1 = { x: fwd, y: -side }; e2 = { x: fwd, y: side }; look = { x: 1, y: 0 };
      break;
  }
  const eyeR = cell * 0.13;
  const pupilR = cell * 0.07;
  const hcx = hx + half;
  const hcy = hy + half;

  return (
    <G opacity={dead ? 0.75 : 1}>
      {snake.length > 1 && (
        <Path
          d={d}
          stroke={colors.blue}
          strokeWidth={cell * 0.78}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      )}
      {/* rounded segment markings */}
      {snake.slice(1).map((p, i) => (
        <Circle
          key={i}
          cx={cx(p)}
          cy={cy(p)}
          r={cell * 0.3}
          fill={i % 2 === 0 ? colors.blueLight : colors.blue}
          stroke={colors.blueDark}
          strokeWidth={cell * 0.06}
        />
      ))}
      {/* head */}
      <Rect
        x={hx + inset}
        y={hy + inset}
        width={cell - inset * 2}
        height={cell - inset * 2}
        rx={cell * 0.38}
        fill={colors.red}
        stroke={colors.redDark}
        strokeWidth={cell * 0.06}
      />
      {[e1, e2].map((e, i) => (
        <G key={i}>
          <Circle cx={hcx + e.x} cy={hcy + e.y} r={eyeR} fill={colors.white} />
          {dead ? (
            <Path
              d={`M${hcx + e.x - pupilR} ${hcy + e.y - pupilR} L${hcx + e.x + pupilR} ${hcy + e.y + pupilR} M${hcx + e.x + pupilR} ${hcy + e.y - pupilR} L${hcx + e.x - pupilR} ${hcy + e.y + pupilR}`}
              stroke={colors.nearBlack}
              strokeWidth={cell * 0.05}
            />
          ) : (
            <Circle
              cx={hcx + e.x + look.x * pupilR * 0.6}
              cy={hcy + e.y + look.y * pupilR * 0.6}
              r={pupilR}
              fill={colors.nearBlack}
            />
          )}
        </G>
      ))}
    </G>
  );
});
