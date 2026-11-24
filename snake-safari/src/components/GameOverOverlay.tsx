import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ANIMALS, AnimalId } from '../game/animals';
import type { DeathCause } from '../game/engine';
import { colors } from '../theme';
import { AnimalIcon } from './Animal';
import { GameButton } from './GameButton';

interface GameOverOverlayProps {
  score: number;
  isNewHighScore: boolean;
  highScore: number;
  eaten: Record<AnimalId, number>;
  deathCause: DeathCause | null;
  onPlayAgain: () => void;
  onHome: () => void;
}

export function GameOverOverlay({
  score,
  isNewHighScore,
  highScore,
  eaten,
  deathCause,
  onPlayAgain,
  onHome,
}: GameOverOverlayProps) {
  const reason = deathCause === 'wall' ? 'You hit the wall!' : deathCause === 'self' ? 'You bit your own tail!' : '';
  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Text style={styles.title}>Game Over</Text>
        {reason !== '' && <Text style={styles.reason}>{reason}</Text>}
        <Text style={styles.scoreLabel}>Final score</Text>
        <Text style={styles.score}>{score}</Text>
        {isNewHighScore ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>New High Score!</Text>
          </View>
        ) : (
          <Text style={styles.best}>Best: {highScore}</Text>
        )}

        <View style={styles.eatenRow}>
          {ANIMALS.map((a) => (
            <View key={a.id} style={styles.eatenItem}>
              <AnimalIcon kind={a.id} size={38} />
              <Text style={styles.eatenCount}>×{eaten[a.id]}</Text>
            </View>
          ))}
        </View>

        <GameButton label="Play Again" onPress={onPlayAgain} style={styles.button} />
        <GameButton label="Home" variant="blue" onPress={onHome} style={styles.button} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.midnight,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.red,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: { color: colors.white, fontSize: 34, fontWeight: '900' },
  reason: { color: colors.redLight, fontSize: 16, fontWeight: '600', marginTop: 4 },
  scoreLabel: { color: colors.whiteDim, fontSize: 14, marginTop: 16, textTransform: 'uppercase', letterSpacing: 1 },
  score: { color: colors.white, fontSize: 56, fontWeight: '900', lineHeight: 64 },
  badge: { backgroundColor: colors.red, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 6, marginTop: 4 },
  badgeText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  best: { color: colors.blueLight, fontSize: 16, fontWeight: '700', marginTop: 4 },
  eatenRow: { flexDirection: 'row', justifyContent: 'space-around', alignSelf: 'stretch', marginVertical: 20 },
  eatenItem: { alignItems: 'center' },
  eatenCount: { color: colors.white, fontSize: 16, fontWeight: '700', marginTop: 2 },
  button: { alignSelf: 'stretch', marginTop: 10 },
});
