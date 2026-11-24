/**
 * Generates the app's sound effects and icon/splash images.
 * The generated files are already committed in /assets, so you never
 * need to run this. It's kept here in case you want to tweak them.
 *
 *   node scripts/generate-assets.js            -> sounds only (no extra deps)
 *   node scripts/generate-assets.js --images   -> also images (needs `playwright` + Chromium)
 */
const fs = require('fs');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');

// ---------------------------------------------------------------- sounds ----

function writeWav(file, samples, sampleRate) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  fs.writeFileSync(file, Buffer.concat([header, data]));
}

/** Frequency sweep with a soft attack/decay envelope. */
function sweep({ from, to, ms, sampleRate = 22050, square = 0, volume = 0.6 }) {
  const n = Math.floor((sampleRate * ms) / 1000);
  const out = new Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const freq = from * Math.pow(to / from, t);
    phase += (2 * Math.PI * freq) / sampleRate;
    const sine = Math.sin(phase);
    const sq = Math.sign(sine);
    const wave = sine * (1 - square) + sq * square;
    const attack = Math.min(1, i / (sampleRate * 0.004));
    const decay = Math.pow(1 - t, 1.6);
    out[i] = wave * attack * decay * volume;
  }
  return out;
}

function generateSounds() {
  const dir = path.join(ASSETS, 'sounds');
  fs.mkdirSync(dir, { recursive: true });
  // Eat: two quick rising "blips"
  const eat = [...sweep({ from: 660, to: 990, ms: 55 }), ...sweep({ from: 990, to: 1480, ms: 70 })];
  writeWav(path.join(dir, 'eat.wav'), eat, 22050);
  // Death: falling buzzy tone
  const death = sweep({ from: 440, to: 70, ms: 520, square: 0.35, volume: 0.55 });
  writeWav(path.join(dir, 'death.wav'), death, 22050);
  console.log('sounds written');
}

// ---------------------------------------------------------------- images ----

const NAVY = '#0B1E3F';
const GRID = '#13294F';
const RED = '#E63946';
const BLUE = '#1E6FFF';
const BLUE_LIGHT = '#5B95FF';
const BLUE_DARK = '#1452C4';

/** The snake mark, drawn in a 1024 box. `mono` = white silhouette. */
function snakeMark(mono = false) {
  const body = mono ? '#FFFFFF' : BLUE;
  const head = mono ? '#FFFFFF' : RED;
  const dots = mono
    ? ''
    : [
        [300, 640],
        [390, 560],
        [470, 600],
        [560, 650],
        [650, 600],
      ]
        .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="34" fill="${i % 2 ? BLUE : BLUE_LIGHT}" stroke="${BLUE_DARK}" stroke-width="8"/>`)
        .join('');
  const eyes = mono
    ? `<circle cx="730" cy="410" r="22" fill="#000"/><circle cx="730" cy="490" r="22" fill="#000"/>`
    : `<circle cx="730" cy="410" r="26" fill="#fff"/><circle cx="730" cy="490" r="26" fill="#fff"/>
       <circle cx="740" cy="410" r="13" fill="#0A0A12"/><circle cx="740" cy="490" r="13" fill="#0A0A12"/>`;
  return `
    <path d="M250 700 C 250 520, 420 520, 470 600 S 640 700, 650 560 S 640 450, 690 450"
          stroke="${body}" stroke-width="110" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    ${dots}
    <rect x="620" y="340" width="180" height="220" rx="80" fill="${head}"/>
    ${eyes}
    <path d="M800 450 L860 450 M860 450 L890 425 M860 450 L890 475" stroke="${head}" stroke-width="16" stroke-linecap="round" fill="none"/>`;
}

function gridPattern(size, step) {
  let d = '';
  for (let x = step; x < size; x += step) d += `M${x} 0 V${size} M0 ${x} H${size} `;
  return `<path d="${d}" stroke="${GRID}" stroke-width="6"/>`;
}

function svg(size, inner, bg = null) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
    ${bg ? `<rect width="1024" height="1024" fill="${bg}"/>` : ''}${inner}</svg>`;
}

async function generateImages() {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });

  async function render(file, size, markup) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<html><body style="margin:0;background:transparent">${markup}</body></html>`);
    await page.locator('svg').screenshot({ path: path.join(ASSETS, file), omitBackground: true });
    console.log('wrote', file);
  }

  // Full app icon: navy tile with grid, red wall border, snake.
  const icon = `${gridPattern(1024, 128)}
    <rect x="40" y="40" width="944" height="944" rx="120" fill="none" stroke="${RED}" stroke-width="48"/>
    <g transform="translate(512 512) scale(0.85) translate(-560 -530)">${snakeMark()}</g>`;
  await render('icon.png', 1024, svg(1024, icon, NAVY));

  // Android adaptive icon: foreground must fit inside the central ~66% safe zone.
  const fg = `<g transform="translate(512 512) scale(0.55) translate(-560 -530)">${snakeMark()}</g>`;
  await render('android-icon-foreground.png', 1024, svg(1024, fg));
  const bg = `${gridPattern(1024, 128)}<rect x="0" y="0" width="1024" height="1024" fill="none" stroke="${RED}" stroke-width="80"/>`;
  await render('android-icon-background.png', 1024, svg(1024, bg, NAVY));
  const mono = `<g transform="translate(512 512) scale(0.55) translate(-560 -530)">${snakeMark(true)}</g>`;
  await render('android-icon-monochrome.png', 1024, svg(1024, mono));

  // Splash: snake mark + title on transparent background (bg color set in app.json).
  const splash = `<g transform="translate(512 430) scale(0.8) translate(-560 -530)">${snakeMark()}</g>
    <text x="512" y="870" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="120" text-anchor="middle">
      <tspan fill="#FFFFFF">Snake </tspan><tspan fill="${RED}">Safari</tspan></text>`;
  await render('splash-icon.png', 1024, svg(1024, splash));

  await render('favicon.png', 48, svg(48, icon, NAVY));
  await browser.close();
}

generateSounds();
if (process.argv.includes('--images')) {
  generateImages().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
