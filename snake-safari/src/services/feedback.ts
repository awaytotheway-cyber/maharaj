/**
 * Haptics + short sound effects. Every call is wrapped so a missing sound,
 * an unsupported device or a muted phone can never crash the game.
 */
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';

type SoundName = 'eat' | 'death';

const SOURCES: Record<SoundName, number> = {
  eat: require('../../assets/sounds/eat.wav'),
  death: require('../../assets/sounds/death.wav'),
};

const players: Partial<Record<SoundName, AudioPlayer>> = {};
let soundEnabled = true;
let initialized = false;

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

/** Create the audio players once. Safe to call many times. */
export function initFeedback(): void {
  if (initialized) return;
  initialized = true;
  try {
    // Sound effects should mix with music the player may have running.
    setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
  } catch {
    // ignore
  }
  (Object.keys(SOURCES) as SoundName[]).forEach((name) => {
    try {
      const player = createAudioPlayer(SOURCES[name]);
      player.volume = name === 'eat' ? 0.6 : 0.8;
      players[name] = player;
    } catch {
      // Sound unavailable: the game just stays silent.
    }
  });
}

function play(name: SoundName): void {
  if (!soundEnabled) return;
  const player = players[name];
  if (!player) return;
  try {
    player.seekTo(0).catch(() => {});
    player.play();
  } catch {
    // ignore
  }
}

export function feedbackEat(): void {
  play('eat');
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function feedbackDeath(): void {
  play('death');
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}
