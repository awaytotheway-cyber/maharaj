import { ANIMALS, pickAnimal } from './animals';
import {
  BASE_STEP_MS,
  GameState,
  MIN_STEP_MS,
  Point,
  createGame,
  emptyCells,
  queueTurn,
  spawnFood,
  start,
  step,
  stepMsFor,
} from './engine';

/** Deterministic pseudo-random generator for tests. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function withState(overrides: Partial<GameState>): GameState {
  const base = start(createGame(20, 20, seeded(1)));
  return { ...base, food: null, ...overrides };
}

describe('wall collision', () => {
  it('dies when moving right past the right wall', () => {
    const s = withState({ snake: [{ x: 19, y: 5 }, { x: 18, y: 5 }, { x: 17, y: 5 }], direction: 'right' });
    const { state, events } = step(s, seeded(2));
    expect(events.died).toBe(true);
    expect(state.status).toBe('over');
    expect(state.deathCause).toBe('wall');
  });

  it('dies when moving up past the top wall (no wrap-around)', () => {
    const s = withState({ snake: [{ x: 5, y: 0 }, { x: 5, y: 1 }, { x: 5, y: 2 }], direction: 'up' });
    const { state } = step(s, seeded(2));
    expect(state.status).toBe('over');
    expect(state.deathCause).toBe('wall');
  });

  it('keeps moving when the next cell is inside the board', () => {
    const s = withState({ snake: [{ x: 18, y: 5 }, { x: 17, y: 5 }, { x: 16, y: 5 }], direction: 'right' });
    const { state } = step(s, seeded(2));
    expect(state.status).toBe('running');
    expect(state.snake[0]).toEqual({ x: 19, y: 5 });
    expect(state.snake).toHaveLength(3);
  });
});

describe('self collision', () => {
  it('dies when the head runs into its own body', () => {
    // A 5-long snake curled so that turning down hits the body.
    const snake: Point[] = [
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 6, y: 6 },
      { x: 5, y: 6 },
      { x: 4, y: 6 },
    ];
    const s = withState({ snake, direction: 'left', queue: ['down'] });
    const { state, events } = step(s, seeded(3));
    expect(events.died).toBe(true);
    expect(state.deathCause).toBe('self');
  });

  it('allows moving into the cell the tail is leaving', () => {
    // 4-long square loop: head moves into the current tail cell.
    const snake: Point[] = [
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 6, y: 6 },
      { x: 5, y: 6 },
    ];
    const s = withState({ snake, direction: 'left', queue: ['down'] });
    const { state } = step(s, seeded(3));
    expect(state.status).toBe('running');
    expect(state.snake[0]).toEqual({ x: 5, y: 6 });
  });
});

describe('eating and growth', () => {
  it('grows by one, adds points, counts the animal and respawns food', () => {
    const s = withState({
      snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }],
      direction: 'right',
      food: { kind: 'frog', pos: { x: 6, y: 5 }, spawnedAt: 0, expiresAt: null },
    });
    const { state, events } = step(s, seeded(4));
    expect(events.ate).toBe('frog');
    expect(state.snake).toHaveLength(4);
    expect(state.snake[0]).toEqual({ x: 6, y: 5 });
    expect(state.snake[3]).toEqual({ x: 3, y: 5 }); // tail stayed put
    expect(state.score).toBe(10);
    expect(state.eaten.frog).toBe(1);
    expect(state.totalEaten).toBe(1);
    expect(state.food).not.toBeNull();
    expect(state.snake.some((p) => p.x === state.food!.pos.x && p.y === state.food!.pos.y)).toBe(false);
  });

  it('speeds up every 5 animals and caps the speed', () => {
    expect(stepMsFor(0)).toBe(BASE_STEP_MS);
    expect(stepMsFor(4)).toBe(BASE_STEP_MS);
    expect(stepMsFor(5)).toBeLessThan(BASE_STEP_MS);
    expect(stepMsFor(1000)).toBe(MIN_STEP_MS);
  });

  it('replaces a rare animal when its lifetime runs out', () => {
    const s = withState({
      snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }],
      direction: 'right',
      time: 5900,
      food: { kind: 'chick', pos: { x: 15, y: 15 }, spawnedAt: 0, expiresAt: 6000 },
    });
    const { state, events } = step(s, seeded(5));
    expect(events.foodExpired).toBe(true);
    expect(state.food).not.toBeNull();
    expect(state.food!.spawnedAt).toBe(state.time);
  });
});

describe('spawning', () => {
  it('never spawns on the snake (many random trials)', () => {
    const rng = seeded(42);
    // A long snake covering most of a small board.
    const cols = 6;
    const rows = 5;
    const snake: Point[] = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) snake.push({ x, y });
    const partial = snake.slice(0, 27); // leaves 3 empty cells
    for (let i = 0; i < 500; i++) {
      const food = spawnFood(cols, rows, partial, 0, rng);
      expect(food).not.toBeNull();
      expect(partial.some((p) => p.x === food!.pos.x && p.y === food!.pos.y)).toBe(false);
    }
  });

  it('returns null when the board is full', () => {
    const snake: Point[] = [];
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) snake.push({ x, y });
    expect(spawnFood(3, 3, snake, 0, seeded(1))).toBeNull();
    expect(emptyCells(3, 3, snake)).toHaveLength(0);
  });

  it('gives the chick a 6 second lifetime and the others none', () => {
    const chickRoll = 0.999; // last weight bucket
    expect(pickAnimal(chickRoll)).toBe('chick');
    expect(pickAnimal(0)).toBe('mouse');
    const chick = ANIMALS.find((a) => a.id === 'chick');
    expect(chick && 'lifetimeMs' in chick ? chick.lifetimeMs : undefined).toBe(6000);
  });
});

describe('turn input', () => {
  it('blocks a 180° reversal', () => {
    const s = withState({ direction: 'right' });
    expect(queueTurn(s, 'left').queue).toEqual([]);
  });

  it('blocks reversal against the buffered turn too', () => {
    let s = withState({ direction: 'right' });
    s = queueTurn(s, 'up');
    s = queueTurn(s, 'down'); // opposite of the queued 'up'
    expect(s.queue).toEqual(['up']);
  });

  it('keeps the next turn plus at most one buffered turn', () => {
    let s = withState({ direction: 'right' });
    s = queueTurn(s, 'up');
    s = queueTurn(s, 'left');
    s = queueTurn(s, 'down');
    expect(s.queue).toEqual(['up', 'left']);
  });

  it('starts a ready game on the first input', () => {
    const s = createGame(20, 20, seeded(1));
    expect(s.status).toBe('ready');
    expect(queueTurn(s, 'up').status).toBe('running');
  });
});
