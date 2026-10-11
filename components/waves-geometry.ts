// Wave shape maths shared by the animated waves (components/Waves.tsx, a
// client component) and the share-preview image (app/[lang]/opengraph-image.tsx,
// rendered on the server). Kept out of Waves.tsx because server code can't
// import values from a "use client" module.

import { MORPH_STEP_SECONDS, WAVE_PERIOD, shapes } from "./waves-data";

/** Depth units next to the page edge that are just solid deep water. */
export const VIEW_FROM = 100;
/** Just past the faintest band's highest crest. */
export const VIEW_TO = 660;
export const VIEW_DEPTH = VIEW_TO - VIEW_FROM;
/** How far down (in panel widths) the bands take to fan out from the source point. */
export const FAN_LENGTH = 1.5;
/** Shape of that curve: 1 = gentle taper, lower = rounder bulge into the point. */
export const FAN_ROUNDNESS = 0.4;

/* ---------- Color ---------- */

export function hexToHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

/** Crest and glow colors from the selected wave color. */
export function waveColors(hex: string) {
  const [h, s, l] = hexToHsl(hex);
  // Normalize lightness so very dark or very bright picks still read as water.
  const base = Math.min(0.45, Math.max(0.28, l));
  const hsl = (sat: number, light: number, alpha = 1) =>
    `hsl(${h.toFixed(0)} ${(s * sat * 100).toFixed(0)}% ${(light * 100).toFixed(0)}% / ${alpha})`;
  return {
    // A little darker than the picked color so it isn't too bright.
    crest: hsl(0.9, base * 0.9),
    // The light deep in the water: a brighter, softer version of the color.
    glow: hsl(0.8, Math.min(0.68, base * 1.7), 0.7),
  };
}

/* ---------- Shapes and motion ---------- */

/** Each shape sampled as crest height for every unit along one period. */
export const SAMPLES = shapes.map((shape) => {
  const lut = new Float32Array(WAVE_PERIOD + 1);
  let x0 = 0;
  let y0 = shape.start;
  let filled = 0;
  for (const [c1x, c1y, c2x, c2y, x, y] of shape.segments) {
    let px = x0;
    let py = y0;
    for (let i = 1; i <= 64; i++) {
      const t = i / 64;
      const u = 1 - t;
      const bx = u * u * u * x0 + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x;
      const by = u * u * u * y0 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y;
      for (; filled <= Math.min(WAVE_PERIOD, Math.floor(bx)); filled++) {
        lut[filled] = bx === px ? by : py + ((by - py) * (filled - px)) / (bx - px);
      }
      px = bx;
      py = by;
    }
    x0 = x;
    y0 = y;
  }
  return lut;
});

/** Crest height of a sampled shape at any (wrapped) position along the shore. */
export function sampleAt(lut: Float32Array, s: number) {
  const w = ((s % WAVE_PERIOD) + WAVE_PERIOD) % WAVE_PERIOD;
  const i = Math.floor(w);
  return lut[i] + (lut[i + 1] - lut[i]) * (w - i);
}

// Morph order: alternate the original shapes with the sssurf variations so
// the sea keeps changing character, then ease back to the first.
export const ORDER = shapes.map((_, i) => (i % 2 === 0 ? i / 2 : shapes.length / 2 + (i - 1) / 2));
export const MORPH_SECONDS = MORPH_STEP_SECONDS * ORDER.length;

/** The original's easing between shapes: cubic-bezier(0.45, 0, 0.55, 1). */
export function ease(x: number) {
  const bez = (t: number, a: number, b: number) =>
    3 * (1 - t) * (1 - t) * t * a + 3 * (1 - t) * t * t * b + t * t * t;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (bez(mid, 0.45, 0.55) < x) lo = mid;
    else hi = mid;
  }
  return bez((lo + hi) / 2, 0, 1);
}

/**
 * How much of a band's depth shows at a given distance below the source
 * point: 0 at the point, 1 once fully out. A rounded, quarter-circle-like
 * profile: the bands leave the point heading almost sideways and bulge out
 * to nearly full width quickly, so they curve into the point rather than
 * slanting straight down to it. Lower FAN_ROUNDNESS = rounder, fuller curve.
 */
export function fan(u: number) {
  const x = Math.min(1, Math.max(0, u));
  return (1 - (1 - x) ** 2) ** FAN_ROUNDNESS;
}
