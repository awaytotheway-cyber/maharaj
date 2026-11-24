# Snake Safari 🐍

A grid-based snake game for Android, built with Expo (React Native + TypeScript).
The snake hunts mice, frogs, rabbits and rare chicks. Red & blue theme.

## Project layout

```
App.tsx                      Switches between Home and Game screens
app.json / eas.json          App + build configuration
assets/                      Icons, splash, and sounds (eat.wav, death.wav)
scripts/generate-assets.js   Re-generates the icons/sounds (optional)
src/theme.ts                 All UI colors
src/game/animals.ts          Animal list: points, spawn chance, lifetime
src/game/engine.ts           Pure game logic (move, collide, eat, spawn, speed)
src/game/engine.test.ts      Unit tests for the engine
src/components/              Board, Snake, Animal, DPad, GameButton, GameOverOverlay
src/screens/                 HomeScreen, GameScreen
src/services/                High score storage, haptics + sounds
```

## One-time setup on Windows 11

1. Install **Node.js LTS** from https://nodejs.org (accept the defaults).
2. Get the code: either install Git (https://git-scm.com) and run
   `git clone https://github.com/awaytotheway-cyber/maharaj.git` then
   `git checkout ccr-fb1477ac-w94plc`, or on GitHub switch to that branch,
   click **Code → Download ZIP** and unzip it.
3. Open **PowerShell** in the `snake-safari` folder and run:
   ```powershell
   npm install
   ```

> If PowerShell says *"running scripts is disabled on this system"*, run this once and try again:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

## Quick test on your phone with Expo Go

1. Install **Expo Go** from the Play Store on your Samsung. It has to be the version for Expo SDK 58, which is the current Play Store version.
2. Make sure your PC and phone are on the same Wi-Fi.
3. In PowerShell (inside `snake-safari`):
   ```powershell
   npx expo start
   ```
4. Open Expo Go and scan the QR code shown in PowerShell.
   If it can't connect, stop with `Ctrl+C` and run `npx expo start --tunnel`.

## Build the installable APK with EAS (cloud build)

Run these in PowerShell inside the `snake-safari` folder, one at a time:

```powershell
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```

- `eas login`: log in with your free Expo account (create one at https://expo.dev/signup).
- `eas build:configure`: answer **Yes** to create/link the project. `eas.json` already
  exists with the `preview` profile (APK), so keep it if asked.
- `eas build ...`: answer **Yes** when asked to generate a new Android keystore.
  The build runs in the cloud (usually 10–20 min) and prints a link at the end.

### Install the APK on the Samsung Galaxy M17e 5G

1. Open the EAS build link on your phone (or scan the QR code on the build page) and tap **Install** / **Download**.
2. Open the downloaded `.apk` (from the notification or **My Files → Downloads**).
3. When Android asks, allow **Install unknown apps** for that app (Chrome or My Files).
   You can also set it in **Settings → Security and privacy → More security settings → Install unknown apps**.
4. If Play Protect warns about an unknown app, tap **More details → Install anyway**.

> **Already installed a different build?** APKs signed with different keys can't update each other.
> If Android says *"App not installed"*, uninstall the old Snake Safari first (this resets the high score).

## Developer checks

```powershell
npx tsc --noEmit   # type check
npm test           # engine unit tests
npx expo-doctor    # dependency health
```

## How to add a new animal

1. Open `src/game/animals.ts` and add an entry to `ANIMALS`, e.g.
   ```ts
   { id: 'hedgehog', name: 'Hedgehog', points: 25, weight: 8 },
   ```
   - `weight` is the relative spawn chance (the weights don't have to add up to 100).
   - Add `lifetimeMs: 6000` if it should run away after a while, like the chick.
2. Open `src/components/Animal.tsx`, write a small `function Hedgehog()` drawing using
   SVG shapes in a 100×100 box, and add `hedgehog: Hedgehog` to the `drawings` map.
   TypeScript reports an error until you do this, so you can't forget.

The home screen legend and the game-over stats pick up the new animal automatically.

## Tuning

- Speed: `BASE_STEP_MS`, `STEP_DECREMENT_MS`, `MIN_STEP_MS`, `ANIMALS_PER_SPEEDUP` in `src/game/engine.ts`.
- Board columns: `COLS` in `src/screens/GameScreen.tsx`.
- Colors: `src/theme.ts`.
