import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { AnimalIcon } from '../components/Animal';
import { GameButton } from '../components/GameButton';
import { ANIMALS } from '../game/animals';
import { colors } from '../theme';

interface HomeScreenProps {
  highScore: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onPlay: () => void;
}

/** Decorative snake for the title. */
function TitleSnake() {
  return (
    <Svg width={220} height={70} viewBox="0 0 220 70">
      <Path
        d="M14 50 C 40 10, 70 10, 90 35 S 140 62, 160 35 S 190 20, 196 28"
        stroke={colors.blue}
        strokeWidth={18}
        strokeLinecap="round"
        fill="none"
      />
      <Rect x={186} y={14} width={28} height={28} rx={11} fill={colors.red} />
      <Circle cx={204} cy={22} r={4} fill={colors.white} />
      <Circle cx={204} cy={34} r={4} fill={colors.white} />
      <Circle cx={205.5} cy={22} r={2} fill={colors.nearBlack} />
      <Circle cx={205.5} cy={34} r={2} fill={colors.nearBlack} />
    </Svg>
  );
}

export function HomeScreen({ highScore, soundEnabled, onToggleSound, onPlay }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 24 }]}
    >
      <TitleSnake />
      <Text style={styles.title}>
        Snake <Text style={styles.titleAccent}>Safari</Text>
      </Text>
      <Text style={styles.subtitle}>Hunt the animals. Don't hit the walls!</Text>

      <View style={styles.highScore}>
        <Text style={styles.highScoreLabel}>HIGH SCORE</Text>
        <Text style={styles.highScoreValue}>{highScore}</Text>
      </View>

      <GameButton label="Play" onPress={onPlay} style={styles.play} />

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Animals</Text>
        {ANIMALS.map((a) => (
          <View key={a.id} style={styles.legendRow}>
            <AnimalIcon kind={a.id} size={40} />
            <Text style={styles.legendName}>{a.name}</Text>
            {'lifetimeMs' in a && <Text style={styles.rare}>RARE</Text>}
            <Text style={styles.legendPoints}>{a.points} pts</Text>
          </View>
        ))}
        <Text style={styles.legendNote}>The chick runs away after 6 seconds.</Text>
      </View>

      <Text style={styles.howTo}>Swipe anywhere or use the arrow pad to steer.</Text>

      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: soundEnabled }}
        onPress={onToggleSound}
        style={({ pressed }) => [styles.soundToggle, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.soundText}>Sound: {soundEnabled ? 'On' : 'Off'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.deepNavy },
  content: { alignItems: 'center', paddingHorizontal: 20 },
  title: { color: colors.white, fontSize: 44, fontWeight: '900', marginTop: 8, letterSpacing: 0.5 },
  titleAccent: { color: colors.red },
  subtitle: { color: colors.whiteDim, fontSize: 15, marginTop: 4 },
  highScore: {
    marginTop: 24,
    backgroundColor: colors.blue,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  highScoreLabel: { color: colors.whiteDim, fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  highScoreValue: { color: colors.white, fontSize: 34, fontWeight: '900' },
  play: { marginTop: 22, minWidth: 220, paddingVertical: 18 },
  legend: {
    marginTop: 28,
    alignSelf: 'stretch',
    backgroundColor: colors.midnight,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.red,
    padding: 14,
  },
  legendTitle: { color: colors.white, fontSize: 18, fontWeight: '800', marginBottom: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  legendName: { color: colors.white, fontSize: 17, fontWeight: '600', marginLeft: 12, flex: 1 },
  rare: {
    color: colors.white,
    backgroundColor: colors.red,
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
    marginRight: 10,
  },
  legendPoints: { color: colors.blueLight, fontSize: 17, fontWeight: '800' },
  legendNote: { color: colors.whiteDim, fontSize: 13, marginTop: 6 },
  howTo: { color: colors.whiteDim, fontSize: 14, marginTop: 18, textAlign: 'center' },
  soundToggle: {
    marginTop: 14,
    borderWidth: 2,
    borderColor: colors.blue,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  soundText: { color: colors.white, fontSize: 15, fontWeight: '700' },
});
