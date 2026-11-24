/**
 * All UI colors live here. The UI is strictly red + blue
 * (plus white / near-black for readability). Animals keep their own
 * natural colors, defined in src/game/animals.ts.
 */
export const colors = {
  // Blues
  navy: '#0B1E3F', // game ground
  grid: '#13294F', // subtle grid lines
  deepNavy: '#071430', // screen background
  midnight: '#0F2650', // cards / panels
  blue: '#1E6FFF', // snake body, secondary buttons
  blueDark: '#1452C4', // snake segment outline, pressed blue
  blueLight: '#5B95FF', // highlights

  // Reds
  red: '#E63946', // walls, snake head, primary buttons
  redDark: '#B8222F', // pressed red
  redLight: '#FF6B76', // accents

  // Neutrals (readability only)
  white: '#FFFFFF',
  whiteDim: 'rgba(255,255,255,0.72)',
  nearBlack: '#0A0A12',
  overlay: 'rgba(7,20,48,0.86)',
} as const;

export const WALL_WIDTH = 4;
