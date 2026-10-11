// Wave color preference, stored in localStorage and applied as CSS variables
// on <html>: --wave-color, and --background, a near-black tint of the same hue
// so the page isn't pure black.

export const WAVE_COLOR_KEY = "wave-color";

export const wavePresets = [
  { id: "blue", color: "#005ab4" },
  { id: "red", color: "#d20000" },
  { id: "green", color: "#007000" },
] as const;

export const defaultWaveColor = wavePresets[0].color;

/**
 * Page background for a wave color: the same hue, kept almost black (4%
 * lightness) so the tint is barely noticeable. Self-contained, because it's
 * also inlined into waveColorScript below.
 */
export function backgroundFor(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    d === 0 ? 0 : max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return "hsl(" + Math.round(h * 60) + " " + Math.round(s * 60) + "% 4%)";
}

/** Runs in <head> before paint so a saved color doesn't flash the default. */
export const waveColorScript = `try{var c=localStorage.getItem(${JSON.stringify(
  WAVE_COLOR_KEY,
)});if(!c||!/^#[0-9a-f]{6}$/i.test(c))c=${JSON.stringify(defaultWaveColor)};var s=document.documentElement.style;s.setProperty("--wave-color",c);s.setProperty("--background",(${backgroundFor.toString()})(c))}catch(e){}`;

/** Applies a wave color (and its background tint) to the page. */
export function applyWaveColor(color: string) {
  const style = document.documentElement.style;
  style.setProperty("--wave-color", color);
  style.setProperty("--background", backgroundFor(color));
}

const listeners = new Set<() => void>();

export function readWaveColor(): string {
  try {
    const saved = localStorage.getItem(WAVE_COLOR_KEY);
    if (saved && /^#[0-9a-f]{6}$/i.test(saved)) return saved.toLowerCase();
  } catch {}
  return defaultWaveColor;
}

export function setWaveColor(input: string) {
  let color = input.toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(color)) color = color.replace(/[0-9a-f]/g, (c) => c + c);
  if (!/^#[0-9a-f]{6}$/.test(color)) return;
  applyWaveColor(color);
  try {
    localStorage.setItem(WAVE_COLOR_KEY, color);
  } catch {}
  listeners.forEach((listener) => listener());
}

export function subscribeWaveColor(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
