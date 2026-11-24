import React, { memo } from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import type { AnimalId } from '../game/animals';

/**
 * Top-down animal drawings, each in a 100x100 coordinate space.
 * Animals are the only things allowed outside the red/blue theme.
 * To add a new animal, add a drawing here with the same id as in animals.ts.
 */

function Mouse() {
  return (
    <G>
      {/* tail */}
      <Path d="M50 82 C 50 92, 30 92, 26 98" stroke="#F4A6C1" strokeWidth={4} strokeLinecap="round" fill="none" />
      {/* body */}
      <Ellipse cx={50} cy={56} rx={22} ry={28} fill="#9AA0A6" />
      {/* ears */}
      <Circle cx={32} cy={30} r={11} fill="#9AA0A6" />
      <Circle cx={68} cy={30} r={11} fill="#9AA0A6" />
      <Circle cx={32} cy={30} r={7} fill="#F4A6C1" />
      <Circle cx={68} cy={30} r={7} fill="#F4A6C1" />
      {/* head */}
      <Ellipse cx={50} cy={32} rx={15} ry={17} fill="#A8AEB4" />
      {/* eyes + nose */}
      <Circle cx={44} cy={28} r={3} fill="#1A1A1A" />
      <Circle cx={56} cy={28} r={3} fill="#1A1A1A" />
      <Circle cx={50} cy={17} r={3.5} fill="#F28AB0" />
      {/* whiskers */}
      <Path d="M44 20 L30 16 M44 22 L30 24 M56 20 L70 16 M56 22 L70 24" stroke="#5F6368" strokeWidth={1.4} />
    </G>
  );
}

function Frog() {
  return (
    <G>
      {/* back legs */}
      <Path d="M30 66 C 14 70, 10 86, 22 92" stroke="#2DBE3A" strokeWidth={9} strokeLinecap="round" fill="none" />
      <Path d="M70 66 C 86 70, 90 86, 78 92" stroke="#2DBE3A" strokeWidth={9} strokeLinecap="round" fill="none" />
      {/* front legs */}
      <Path d="M32 42 L16 34" stroke="#2DBE3A" strokeWidth={8} strokeLinecap="round" />
      <Path d="M68 42 L84 34" stroke="#2DBE3A" strokeWidth={8} strokeLinecap="round" />
      {/* body */}
      <Ellipse cx={50} cy={56} rx={26} ry={30} fill="#33D145" />
      {/* belly */}
      <Ellipse cx={50} cy={62} rx={15} ry={18} fill="#FFE34D" />
      {/* eyes */}
      <Circle cx={36} cy={28} r={11} fill="#33D145" />
      <Circle cx={64} cy={28} r={11} fill="#33D145" />
      <Circle cx={36} cy={27} r={7} fill="#FFFFFF" />
      <Circle cx={64} cy={27} r={7} fill="#FFFFFF" />
      <Circle cx={36} cy={27} r={4.5} fill="#111111" />
      <Circle cx={64} cy={27} r={4.5} fill="#111111" />
      {/* smile */}
      <Path d="M40 42 Q 50 48 60 42" stroke="#1E8A2A" strokeWidth={2.5} fill="none" strokeLinecap="round" />
    </G>
  );
}

function Rabbit() {
  return (
    <G>
      {/* ears */}
      <Ellipse cx={39} cy={18} rx={8} ry={18} fill="#9C6B43" />
      <Ellipse cx={61} cy={18} rx={8} ry={18} fill="#9C6B43" />
      <Ellipse cx={39} cy={19} rx={4} ry={13} fill="#FFFFFF" />
      <Ellipse cx={61} cy={19} rx={4} ry={13} fill="#FFFFFF" />
      {/* body */}
      <Ellipse cx={50} cy={64} rx={24} ry={26} fill="#9C6B43" />
      {/* white patch */}
      <Ellipse cx={50} cy={68} rx={13} ry={15} fill="#F5EFE8" />
      {/* tail puff */}
      <Circle cx={50} cy={90} r={8} fill="#FFFFFF" />
      {/* head */}
      <Circle cx={50} cy={40} r={15} fill="#A87650" />
      <Ellipse cx={50} cy={46} rx={7} ry={5} fill="#F5EFE8" />
      <Circle cx={43} cy={37} r={2.8} fill="#1A1A1A" />
      <Circle cx={57} cy={37} r={2.8} fill="#1A1A1A" />
      <Circle cx={50} cy={44} r={2.2} fill="#E88A9A" />
    </G>
  );
}

function Chick() {
  return (
    <G>
      {/* feet */}
      <Path d="M42 86 L38 94 M42 86 L42 95 M42 86 L46 94" stroke="#FF8C1A" strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M58 86 L54 94 M58 86 L58 95 M58 86 L62 94" stroke="#FF8C1A" strokeWidth={2.5} strokeLinecap="round" />
      {/* body */}
      <Circle cx={50} cy={60} r={28} fill="#FFD21F" />
      {/* wings */}
      <Ellipse cx={24} cy={62} rx={8} ry={14} fill="#F2C200" />
      <Ellipse cx={76} cy={62} rx={8} ry={14} fill="#F2C200" />
      {/* head */}
      <Circle cx={50} cy={32} r={18} fill="#FFDD33" />
      {/* tuft */}
      <Path d="M48 14 Q 50 6 54 12" stroke="#F2C200" strokeWidth={3} fill="none" strokeLinecap="round" />
      {/* eyes */}
      <Circle cx={43} cy={29} r={3} fill="#111111" />
      <Circle cx={57} cy={29} r={3} fill="#111111" />
      {/* beak */}
      <Path d="M44 36 L56 36 L50 45 Z" fill="#FF8C1A" />
    </G>
  );
}

const drawings: Record<AnimalId, () => React.JSX.Element> = {
  mouse: Mouse,
  frog: Frog,
  rabbit: Rabbit,
  chick: Chick,
};

/** Animals are drawn a bit larger than one cell so they are easy to spot. */
const ANIMAL_SCALE = 1.3;

interface AnimalShapeProps {
  kind: AnimalId;
  /** Top-left position in board pixels */
  x: number;
  y: number;
  /** Cell size in pixels */
  size: number;
  opacity?: number;
}

/** An animal drawn inside an existing <Svg> (used on the board). */
export const AnimalShape = memo(function AnimalShape({ kind, x, y, size, opacity = 1 }: AnimalShapeProps) {
  const Drawing = drawings[kind];
  const scale = (size * ANIMAL_SCALE) / 100;
  const offset = (size - size * ANIMAL_SCALE) / 2;
  return (
    <G transform={`translate(${x + offset}, ${y + offset}) scale(${scale})`} opacity={opacity}>
      <Drawing />
    </G>
  );
});

/** A stand-alone animal icon (used in menus and the game-over screen). */
export const AnimalIcon = memo(function AnimalIcon({ kind, size }: { kind: AnimalId; size: number }) {
  const Drawing = drawings[kind];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Drawing />
    </Svg>
  );
});
