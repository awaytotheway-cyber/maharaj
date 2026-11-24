import { useKeepAwake } from 'expo-keep-awake';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  BackHandler,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { Board } from '../components/Board';
import { DPad } from '../components/DPad';
import { GameButton } from '../components/GameButton';
import { GameOverOverlay } from '../components/GameOverOverlay';
import { Direction, GameState, createGame, queueTurn, step } from '../game/engine';
import { feedbackDeath, feedbackEat } from '../services/feedback';
import { WALL_WIDTH, colors } from '../theme';

export const COLS = 20;
const MIN_ROWS = 14;
const SWIPE_THRESHOLD = 22;
/** Never try to catch up more than this after a stall (e.g. app resume). */
const MAX_FRAME_DT = 250;

interface GameScreenProps {
  highScore: number;
  onHighScore: (score: number) => void;
  onHome: () => void;
}

interface BoardSize {
  cols: number;
  rows: number;
  cell: number;
}

interface GameOverInfo {
  isNewHighScore: boolean;
}

export function GameScreen({ highScore, onHighScore, onHome }: GameScreenProps) {
  useKeepAwake();
  const insets = useSafeAreaInsets();

  // Mutable game state lives in a ref; React only re-renders when it changes.
  const gameRef = useRef<GameState | null>(null);
  const pausedRef = useRef(false);
  const [, setFrame] = useState(0);
  const rerender = useCallback(() => setFrame((f) => (f + 1) % 1_000_000), []);

  const [size, setSize] = useState<BoardSize | null>(null);
  const [paused, setPausedState] = useState(false);
  const [gameOver, setGameOver] = useState<GameOverInfo | null>(null);

  const highScoreRef = useRef(highScore);
  highScoreRef.current = highScore;
  const onHighScoreRef = useRef(onHighScore);
  onHighScoreRef.current = onHighScore;

  const setPaused = useCallback((value: boolean) => {
    pausedRef.current = value;
    setPausedState(value);
  }, []);

  // ---- Board sizing: 20 columns, rows fill the available height -----------
  const onBoardLayout = useCallback((e: LayoutChangeEvent) => {
    if (gameRef.current) return; // keep the board stable once a game exists
    const { width, height } = e.nativeEvent.layout;
    let cell = Math.floor((width - WALL_WIDTH * 2) / COLS);
    let rows = Math.floor((height - WALL_WIDTH * 2) / cell);
    if (rows < MIN_ROWS) {
      rows = MIN_ROWS;
      cell = Math.floor((height - WALL_WIDTH * 2) / rows);
    }
    if (cell <= 0) return;
    gameRef.current = createGame(COLS, rows, Math.random);
    setSize({ cols: COLS, rows, cell });
  }, []);

  // ---- Single game loop (requestAnimationFrame + fixed timestep) -----------
  useEffect(() => {
    let raf = 0;
    let last = 0;
    let acc = 0;

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const dt = last === 0 ? 0 : Math.min(t - last, MAX_FRAME_DT);
      last = t;

      const g = gameRef.current;
      if (!g || g.status !== 'running' || pausedRef.current) {
        acc = 0;
        return;
      }
      acc += dt;
      if (acc < g.stepMs) return;
      acc -= g.stepMs;
      if (acc > g.stepMs) acc = 0; // drop backlog instead of jumping several cells

      const { state, events } = step(g, Math.random);
      gameRef.current = state;
      if (events.ate) feedbackEat();
      if (events.died) {
        feedbackDeath();
        const isNew = state.score > highScoreRef.current;
        if (isNew) onHighScoreRef.current(state.score);
        setGameOver({ isNewHighScore: isNew });
      }
      rerender();
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [rerender]);

  // ---- Pause automatically when the app goes to the background -------------
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active' && gameRef.current?.status === 'running') setPaused(true);
    });
    return () => sub.remove();
  }, [setPaused]);

  // ---- Android back button: pause first, then go home ----------------------
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (gameRef.current?.status === 'running' && !pausedRef.current) {
        setPaused(true);
      } else {
        onHome();
      }
      return true;
    });
    return () => sub.remove();
  }, [onHome, setPaused]);

  // ---- Input -----------------------------------------------------------------
  const handleDirection = useCallback(
    (dir: Direction) => {
      const g = gameRef.current;
      if (!g || pausedRef.current) return;
      const next = queueTurn(g, dir);
      if (next === g) return;
      gameRef.current = next;
      if (g.status !== next.status) rerender(); // hide the "ready" hint
    },
    [rerender],
  );

  const handleDirectionRef = useRef(handleDirection);
  handleDirectionRef.current = handleDirection;

  // Swipe anywhere. Several turns can be made in one continuous drag:
  // each time the finger travels SWIPE_THRESHOLD from the last turn point, we turn.
  const swipeOrigin = useRef({ x: 0, y: 0 });
  const pan = usePanGesture({
    runOnJS: true,
    minDistance: 10,
    onBegin: () => {
      swipeOrigin.current = { x: 0, y: 0 };
    },
    onUpdate: (e) => {
      const dx = e.translationX - swipeOrigin.current.x;
      const dy = e.translationY - swipeOrigin.current.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;
      const dir: Direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      swipeOrigin.current = { x: e.translationX, y: e.translationY };
      handleDirectionRef.current(dir);
    },
  });

  const restart = useCallback(() => {
    if (!size) return;
    gameRef.current = createGame(size.cols, size.rows, Math.random);
    setGameOver(null);
    setPaused(false);
    rerender();
  }, [size, rerender, setPaused]);

  const g = gameRef.current;
  const score = g?.score ?? 0;
  const best = Math.max(highScore, score);
  const canPause = g?.status === 'running';

  return (
    <GestureDetector gesture={pan}>
      <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>SCORE</Text>
            <Text style={styles.scoreValue}>{score}</Text>
          </View>
          <View style={[styles.scoreBox, styles.bestBox]}>
            <Text style={styles.scoreLabel}>BEST</Text>
            <Text style={styles.scoreValue}>{best}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={paused ? 'Resume' : 'Pause'}
            onPress={() => canPause && setPaused(!paused)}
            hitSlop={10}
            style={({ pressed }) => [styles.pauseButton, pressed && { backgroundColor: colors.redDark }, !canPause && styles.disabled]}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24">
              {paused ? (
                <Path d="M7 4 L20 12 L7 20 Z" fill={colors.white} />
              ) : (
                <>
                  <Rect x={5} y={4} width={5} height={16} rx={1.5} fill={colors.white} />
                  <Rect x={14} y={4} width={5} height={16} rx={1.5} fill={colors.white} />
                </>
              )}
            </Svg>
          </Pressable>
        </View>

        {/* Board */}
        <View style={styles.boardArea} onLayout={onBoardLayout}>
          {size && g && (
            <View>
              <Board
                cols={size.cols}
                rows={size.rows}
                cell={size.cell}
                snake={g.snake}
                direction={g.direction}
                food={g.food}
                time={g.time}
                dead={g.status === 'over'}
              />
              {g.status === 'ready' && (
                <View style={styles.hint} pointerEvents="none">
                  <Text style={styles.hintText}>Swipe or tap an arrow to start</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <DPad onDirection={handleDirection} />
        </View>

        {paused && !gameOver && (
          <View style={styles.overlay}>
            <View style={styles.pauseCard}>
              <Text style={styles.pauseTitle}>Paused</Text>
              <GameButton label="Resume" onPress={() => setPaused(false)} style={styles.overlayButton} />
              <GameButton label="Restart" variant="blue" onPress={restart} style={styles.overlayButton} />
              <GameButton label="Home" variant="blue" onPress={onHome} style={styles.overlayButton} />
            </View>
          </View>
        )}

        {gameOver && g && (
          <GameOverOverlay
            score={g.score}
            isNewHighScore={gameOver.isNewHighScore}
            highScore={best}
            eaten={g.eaten}
            deathCause={g.deathCause}
            onPlayAgain={restart}
            onHome={onHome}
          />
        )}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.deepNavy, paddingHorizontal: 12 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  scoreBox: {
    flex: 1,
    backgroundColor: colors.red,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  bestBox: { backgroundColor: colors.blue },
  scoreLabel: { color: colors.whiteDim, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  scoreValue: { color: colors.white, fontSize: 24, fontWeight: '900' },
  pauseButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.45 },
  boardArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hint: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 40 },
  hintText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    backgroundColor: colors.blueDark,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  controls: { alignItems: 'center', paddingTop: 10 },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseCard: {
    width: 280,
    backgroundColor: colors.midnight,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.blue,
    padding: 22,
    alignItems: 'center',
  },
  pauseTitle: { color: colors.white, fontSize: 32, fontWeight: '900', marginBottom: 10 },
  overlayButton: { alignSelf: 'stretch', marginTop: 10 },
});
