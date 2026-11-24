import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameScreen } from './src/screens/GameScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { initFeedback, setSoundEnabled as applySoundEnabled } from './src/services/feedback';
import { loadHighScore, loadSoundEnabled, saveHighScore, saveSoundEnabled } from './src/services/storage';
import { colors } from './src/theme';

type Screen = 'home' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [highScore, setHighScore] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    initFeedback();
    loadHighScore().then(setHighScore);
    loadSoundEnabled().then((enabled) => {
      setSoundEnabled(enabled);
      applySoundEnabled(enabled);
    });
  }, []);

  const handleHighScore = useCallback((score: number) => {
    setHighScore(score);
    saveHighScore(score);
  }, []);

  const toggleSound = useCallback(() => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    applySoundEnabled(next);
    saveSoundEnabled(next);
  }, [soundEnabled]);

  const goHome = useCallback(() => setScreen('home'), []);
  const play = useCallback(() => setScreen('game'), []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {screen === 'home' ? (
          <HomeScreen highScore={highScore} soundEnabled={soundEnabled} onToggleSound={toggleSound} onPlay={play} />
        ) : (
          <GameScreen highScore={highScore} onHighScore={handleHighScore} onHome={goHome} />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.deepNavy },
});
