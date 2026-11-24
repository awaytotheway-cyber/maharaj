import AsyncStorage from '@react-native-async-storage/async-storage';

const HIGH_SCORE_KEY = 'snake-safari/high-score';
const SOUND_KEY = 'snake-safari/sound-enabled';

export async function loadHighScore(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(HIGH_SCORE_KEY);
    const n = raw === null ? 0 : Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

export async function saveHighScore(score: number): Promise<void> {
  try {
    await AsyncStorage.setItem(HIGH_SCORE_KEY, String(Math.floor(score)));
  } catch {
    // Storage failures should never crash the game.
  }
}

export async function loadSoundEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(SOUND_KEY)) !== 'off';
  } catch {
    return true;
  }
}

export async function saveSoundEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(SOUND_KEY, enabled ? 'on' : 'off');
  } catch {
    // ignore
  }
}
