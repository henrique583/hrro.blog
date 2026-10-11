import { cacheLife } from "next/cache";
import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { BAND_SPACING, GRADIENT_DEPTH, GRADIENT_TOP, WAVE_DEPTH, bands } from "@/components/waves-data";
import { FAN_LENGTH, SAMPLES, VIEW_DEPTH, VIEW_FROM, fan, hexToHsl, sampleAt } from "@/components/waves-geometry";
import { hasLocale, locales } from "@/lib/i18n";
import { defaultWaveColor } from "@/lib/wave-color";
import en from "./dictionaries/en.json";
import pt from "./dictionaries/pt.json";

// Share-preview image (Open Graph; X falls back to it too). One per language,
// generated at build time: the site's tinted background, the title and
// description, and the same wave bands fanning out from the top corners.

export const alt = "HRRO Blog — Henrique Rodrigues";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PANEL = 250; // width of each wave column in the image
const BG = "#040a10"; // the site's background tint for the default blue
const MUTED = "#8b95a1";

/** hsl → #rrggbb, since the image renderer's color support is limited. */
function hslToHex(h: number, s: number, l: number) {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return `#${[f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("")}`;
}

/** Crest color for the default blue, computed the same way as on the site. */
function crestColor() {
  const [h, s, l] = hexToHsl(defaultWaveColor);
  const base = Math.min(0.45, Math.max(0.28, l));
  return hslToHex(h, s * 0.9, base * 0.9);
}

/** One side's wave bands as an SVG, drawn like the site (left side; mirror for right). */
function wavesSvg(height: number, mirror: boolean) {
  const scale = PANEL / VIEW_DEPTH;
  const crest = crestColor();
  const defs: string[] = [];
  const paths: string[] = [];
  bands.forEach((band, i) => {
    const offset = i * BAND_SPACING;
    const shift = i * 310; // offset each band along the shore so they don't line up
    let d = "M0,0";
    for (let y = 0; y <= height; y += 4) {
      const crestY = sampleAt(SAMPLES[0], y / scale + shift);
      const depth = Math.max(0, (WAVE_DEPTH - crestY - offset - VIEW_FROM) * scale);
      d += `L${(depth * fan(y / (PANEL * FAN_LENGTH))).toFixed(1)},${y}`;
    }
    d += `L0,${height}Z`;
    const gx = (WAVE_DEPTH - GRADIENT_TOP - offset - VIEW_FROM) * scale;
    defs.push(
      `<linearGradient id="g${i}" gradientUnits="userSpaceOnUse" x1="${gx}" y1="0" x2="${gx - GRADIENT_DEPTH * scale}" y2="0">` +
        `<stop offset="0" stop-color="${crest}"/><stop offset="1" stop-color="#000"/></linearGradient>`,
    );
    paths.push(`<path d="${d}" fill="url(#g${i})" opacity="${band.opacity}"/>`);
  });
  const flip = mirror ? ` transform="translate(${PANEL},0) scale(-1,1)"` : "";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${PANEL}" height="${height}">` +
    `<defs>${defs.join("")}</defs><g${flip}>${paths.join("")}</g></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/** Loads Inter (just the glyphs used) from Google Fonts; falls back to the default font. */
async function inter(weight: 400 | 600, text: string) {
  "use cache";
  cacheLife("max"); // The font file never changes, so fetch it once.
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&text=${encodeURIComponent(text)}`)
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return { name: "Inter", data: await (await fetch(url)).arrayBuffer(), weight, style: "normal" as const };
  } catch {
    return null;
  }
}

// Build both languages' images ahead of time.
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = lang === "pt" ? pt : en;
  const platforms = "X · GitHub · LinkedIn · Goodreads · Letterboxd";
  // The description starts with the name, which the image already shows above it.
  const tagline = dict.meta.description.replace(/^Henrique Rodrigues — /, "");
  const description = tagline.charAt(0).toUpperCase() + tagline.slice(1);
  const text = `HRRO Blog Henrique Rodrigues ${description} ${platforms}`;
  const fonts = (await Promise.all([inter(400, text), inter(600, text)])).filter((f) => f !== null);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          alignItems: "center",
          justifyContent: "center",
          background: BG,
          color: "#f2f5f8",
          fontFamily: "Inter",
        }}
      >
        <img src={wavesSvg(size.height, false)} width={PANEL} height={size.height} style={{ position: "absolute", left: 0, top: 0 }} alt="" />
        <img src={wavesSvg(size.height, true)} width={PANEL} height={size.height} style={{ position: "absolute", right: 0, top: 0 }} alt="" />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 640, textAlign: "center" }}>
          <div style={{ fontSize: 112, fontWeight: 600, letterSpacing: -2, lineHeight: 1 }}>HRRO Blog</div>
          <div style={{ marginTop: 28, fontSize: 40 }}>Henrique Rodrigues</div>
          <div style={{ marginTop: 14, fontSize: 28, color: MUTED }}>{description}</div>
          <div style={{ marginTop: 48, fontSize: 22, color: MUTED }}>{platforms}</div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
