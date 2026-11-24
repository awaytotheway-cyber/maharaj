/**
 * Pure snake game logic. No React, no timers, no randomness of its own:
 * every function takes the state (and a random source when needed) and
 * returns a new state. This keeps it fully unit-testable.
 */
import { AnimalId, emptyEatenCounts, getAnimal, pickAnimal } from './animals';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Point {
  x: number;
  y: number;
}

export interface FoodItem {
  kind: AnimalId;
  pos: Point;
  /** Game time (ms) when it spawned */
  spawnedAt: number;
  /** Game time (ms) when it disappears, or null if it never does */
  expiresAt: number | null;
}

export type GameStatus = 'ready' | 'running' | 'over';
export type DeathCause = 'wall' | 'self';

export interface GameState {
  cols: number;
  rows: number;
  /** Head first */
  snake: Point[];
  direction: Direction;
  /** Pending turns: the next turn plus at most 1 buffered turn */
  queue: Direction[];
  food: FoodItem | null;
  score: number;
  eaten: Record<AnimalId, number>;
  totalEaten: number;
  status: GameStatus;
  deathCause: DeathCause | null;
  /** Game time in ms (only advances while running) */
  time: number;
  /** Current ms per step */
  stepMs: number;
}

/** Returns a number in [0, 1) */
export type Rng = () => number;

export interface StepEvents {
  ate: AnimalId | null;
  died: boolean;
  foodExpired: boolean;
}

// ---- Tunables -------------------------------------------------------------

export const BASE_STEP_MS = 150;
export const STEP_DECREMENT_MS = 10;
export const MIN_STEP_MS = 75;
export const ANIMALS_PER_SPEEDUP = 5;
export const INITIAL_LENGTH = 3;
/** Next turn + 1 buffered turn */
export const MAX_QUEUED_TURNS = 2;

// ---- Helpers --------------------------------------------------------------

const VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export function isOpposite(a: Direction, b: Direction): boolean {
  return OPPOSITE[a] === b;
}

export function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

export function stepMsFor(totalEaten: number): number {
  const speedups = Math.floor(totalEaten / ANIMALS_PER_SPEEDUP);
  return Math.max(MIN_STEP_MS, BASE_STEP_MS - speedups * STEP_DECREMENT_MS);
}

export function isOutOfBounds(p: Point, cols: number, rows: number): boolean {
  return p.x < 0 || p.y < 0 || p.x >= cols || p.y >= rows;
}

/** All cells not covered by the snake. */
export function emptyCells(cols: number, rows: number, snake: readonly Point[]): Point[] {
  const taken = new Set<number>();
  for (const s of snake) taken.add(s.y * cols + s.x);
  const cells: Point[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!taken.has(y * cols + x)) cells.push({ x, y });
    }
  }
  return cells;
}

/** Spawn a random animal on a random empty cell. Returns null if the board is full. */
export function spawnFood(
  cols: number,
  rows: number,
  snake: readonly Point[],
  time: number,
  rng: Rng,
): FoodItem | null {
  const cells = emptyCells(cols, rows, snake);
  if (cells.length === 0) return null;
  const pos = cells[Math.min(cells.length - 1, Math.floor(rng() * cells.length))];
  const kind = pickAnimal(rng());
  const def = getAnimal(kind);
  return {
    kind,
    pos,
    spawnedAt: time,
    expiresAt: def.lifetimeMs !== undefined ? time + def.lifetimeMs : null,
  };
}

// ---- State transitions ----------------------------------------------------

export function createGame(cols: number, rows: number, rng: Rng): GameState {
  if (cols < INITIAL_LENGTH + 2 || rows < 3) {
    throw new Error(`Board too small: ${cols}x${rows}`);
  }
  const headX = Math.floor(cols / 2);
  const y = Math.floor(rows / 2);
  const snake: Point[] = [];
  for (let i = 0; i < INITIAL_LENGTH; i++) snake.push({ x: headX - i, y });

  return {
    cols,
    rows,
    snake,
    direction: 'right',
    queue: [],
    food: spawnFood(cols, rows, snake, 0, rng),
    score: 0,
    eaten: emptyEatenCounts(),
    totalEaten: 0,
    status: 'ready',
    deathCause: null,
    time: 0,
    stepMs: BASE_STEP_MS,
  };
}

/**
 * Queue a turn. Ignored if it repeats or reverses the last planned direction
 * (blocks 180° turns), or if the queue is already full.
 * A 'ready' game starts running on the first input.
 */
export function queueTurn(state: GameState, dir: Direction): GameState {
  if (state.status === 'over') return state;
  const started: GameState = state.status === 'ready' ? { ...state, status: 'running' } : state;

  const last = started.queue.length > 0 ? started.queue[started.queue.length - 1] : started.direction;
  if (dir === last || isOpposite(dir, last)) return started;
  if (started.queue.length >= MAX_QUEUED_TURNS) return started;
  return { ...started, queue: [...started.queue, dir] };
}

export function start(state: GameState): GameState {
  return state.status === 'ready' ? { ...state, status: 'running' } : state;
}

/** Advance the game by one step. */
export function step(state: GameState, rng: Rng): { state: GameState; events: StepEvents } {
  const events: StepEvents = { ate: null, died: false, foodExpired: false };
  if (state.status !== 'running') return { state, events };

  const time = state.time + state.stepMs;
  const [nextDir, ...restQueue] = state.queue;
  const direction = nextDir ?? state.direction;
  const v = VECTORS[direction];
  const head = state.snake[0];
  const newHead: Point = { x: head.x + v.x, y: head.y + v.y };

  // Wall collision (no wrap-around)
  if (isOutOfBounds(newHead, state.cols, state.rows)) {
    events.died = true;
    return {
      state: { ...state, direction, queue: [], time, status: 'over', deathCause: 'wall' },
      events,
    };
  }

  const food = state.food;
  const eating = food !== null && samePoint(food.pos, newHead);

  // Self collision. When not eating, the tail moves away this step,
  // so moving into the current tail cell is allowed.
  const body = eating ? state.snake : state.snake.slice(0, -1);
  if (body.some((p) => samePoint(p, newHead))) {
    events.died = true;
    return {
      state: { ...state, direction, queue: [], time, status: 'over', deathCause: 'self' },
      events,
    };
  }

  const snake = [newHead, ...body];
  let next: GameState = { ...state, snake, direction, queue: restQueue, time };

  if (eating && food) {
    const points = getAnimal(food.kind).points;
    const totalEaten = state.totalEaten + 1;
    events.ate = food.kind;
    next = {
      ...next,
      score: state.score + points,
      eaten: { ...state.eaten, [food.kind]: state.eaten[food.kind] + 1 },
      totalEaten,
      stepMs: stepMsFor(totalEaten),
      food: spawnFood(state.cols, state.rows, snake, time, rng),
    };
  } else if (food && food.expiresAt !== null && time >= food.expiresAt) {
    // Rare animal ran away: spawn a replacement
    events.foodExpired = true;
    next = { ...next, food: spawnFood(state.cols, state.rows, snake, time, rng) };
  }

  return { state: next, events };
}
