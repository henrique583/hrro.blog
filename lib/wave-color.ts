// Wave color preference, stored in localStorage and applied as the
// --wave-color CSS variable on <html>.

export const WAVE_COLOR_KEY = "wave-color";

export const wavePresets = [
  { id: "blue", color: "#005ab4" },
  { id: "red", color: "#b41e1e" },
  { id: "green", color: "#1f8a2a" },
] as const;

export const defaultWaveColor = wavePresets[0].color;

/** Runs in <head> before paint so a saved color doesn't flash the default. */
export const waveColorScript = `try{var c=localStorage.getItem(${JSON.stringify(
  WAVE_COLOR_KEY,
)});if(c&&/^#[0-9a-f]{6}$/i.test(c))document.documentElement.style.setProperty("--wave-color",c)}catch(e){}`;

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
  document.documentElement.style.setProperty("--wave-color", color);
  try {
    localStorage.setItem(WAVE_COLOR_KEY, color);
  } catch {}
  listeners.forEach((listener) => listener());
}

export function subscribeWaveColor(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
