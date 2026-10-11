"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { defaultWaveColor, readWaveColor, subscribeWaveColor } from "@/lib/wave-color";
import {
  BAND_SPACING,
  GRADIENT_DEPTH,
  GRADIENT_TOP,
  WAVE_DEPTH,
  WAVE_PERIOD,
  bands,
} from "./waves-data";
import {
  FAN_LENGTH,
  MORPH_SECONDS,
  ORDER,
  SAMPLES,
  VIEW_DEPTH,
  VIEW_FROM,
  ease,
  fan,
  sampleAt,
  waveColors,
} from "./waves-geometry";

// Five layered wave bands down each side of the page (from waves-morph.svg
// plus the sssurf variations). Each band drifts down along the shore at its own
// speed and slowly morphs between ten shapes. Bands fade in opacity from the
// solid front band to a faint one furthest back.
//
// At the top, just below the header, every band narrows into the same point
// at the page edge, so the water fans out from a single source (outer bands
// make wider arcs). Because that shape is fixed while the waves keep moving,
// the waves are drawn on canvas each frame rather than as sliding SVGs.
//
// Coordinates: shapes are horizontal in the data (x along the shore, y is
// depth), so they're rotated here: depth becomes distance from the page edge
// and position along the shore runs down the page. The right side mirrors the
// left. The canvases stay fixed to the viewport but draw in page coordinates,
// so the waves scroll with the page and only cover the area below the header.
//
// A light glows deep in the sea: on a slow cycle the waves dim while it's out
// and brighten past their base tone as it rises, with a soft radial glow near
// the page edge.

const GLOW_SECONDS = 8; // one full rise and fall of the light deep in the sea
const GLOW_SPACING = 1100; // px between glow spots down the page, so one is always in view
const STEP_Y = 4; // px between sampled points along each band's edge

const panelWidth = (viewport: number) => Math.min(220, Math.max(80, viewport * 0.13));

/* ---------- Drawing ---------- */

interface Frame {
  ctx: CanvasRenderingContext2D;
  width: number; // canvas width in px
  top: number; // page y (relative to the wave area) of the canvas's top row
  y0: number; // visible rows of the canvas: [y0, y1]
  y1: number;
  crest: string;
}

function drawBands(f: Frame, t: number) {
  const { ctx, width, top, y0, y1 } = f;
  const scale = width / VIEW_DEPTH; // px per shape unit
  const fanPx = width * FAN_LENGTH;

  for (let i = 0; i < bands.length; i++) {
    const band = bands[i];
    const offset = i * BAND_SPACING;

    // Drift: one period every `drift` seconds, moving down the page.
    const drift = ((((t - band.driftDelay) / band.drift) % 1) + 1) % 1;
    const driftUnits = drift * WAVE_PERIOD;
    // Morph: which pair of shapes we're between, and how far.
    const phase = ((((t - band.morphBegin) / MORPH_SECONDS) % 1) + 1) % 1;
    const step = phase * ORDER.length;
    const from = SAMPLES[ORDER[Math.floor(step) % ORDER.length]];
    const to = SAMPLES[ORDER[(Math.floor(step) + 1) % ORDER.length]];
    const mix = ease(step - Math.floor(step));

    const edgeAt = (pageY: number) => {
      const s = pageY / scale - driftUnits;
      const a = sampleAt(from, s);
      const y = a + (sampleAt(to, s) - a) * mix;
      const depth = Math.max(0, (WAVE_DEPTH - y - offset - VIEW_FROM) * scale);
      return depth * fan(pageY / fanPx);
    };

    ctx.beginPath();
    ctx.moveTo(0, y0);
    for (let y = y0; y <= y1 + STEP_Y; y += STEP_Y) ctx.lineTo(edgeAt(y + top), y);
    ctx.lineTo(0, y1 + STEP_Y);
    ctx.closePath();

    // As in the original: crest color at the band's top, fading to black
    // GRADIENT_DEPTH units deeper (past the page edge, so never fully black).
    const gx = (WAVE_DEPTH - GRADIENT_TOP - offset - VIEW_FROM) * scale;
    const grad = ctx.createLinearGradient(gx, 0, gx - GRADIENT_DEPTH * scale, 0);
    grad.addColorStop(0, f.crest);
    grad.addColorStop(1, "#000");
    ctx.fillStyle = grad;
    ctx.globalAlpha = band.opacity;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* ---------- Component ---------- */

const css = `
/* The light deep in the sea: the waves dim while it's out and brighten past
   their base tone as it rises, while the glow swells and fades. */
@keyframes hrro-depth-dim {
  0%, 100% { filter: brightness(0.7); }
  50% { filter: brightness(1.3); }
}
@keyframes hrro-depth-glow {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}
.hrro-depth-dim { animation: hrro-depth-dim ${GLOW_SECONDS}s ease-in-out infinite; }
.hrro-depth-glow { animation: hrro-depth-glow ${GLOW_SECONDS}s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .hrro-depth-dim, .hrro-depth-glow { animation: none !important; }
}`;

// Fixed to the viewport; the drawing itself follows the page as it scrolls.
const canvasStyle: CSSProperties = { position: "fixed", top: 0, display: "block", pointerEvents: "none" };

export default function Waves() {
  const areaRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLCanvasElement>(null);
  const rightRef = useRef<HTMLCanvasElement>(null);
  const [layout, setLayout] = useState<{ width: number; phone: boolean } | null>(null);
  const color = useSyncExternalStore(subscribeWaveColor, readWaveColor, () => defaultWaveColor);
  const { crest, glow } = waveColors(color);
  const crestRef = useRef(crest);

  useEffect(() => {
    crestRef.current = crest;
  }, [crest]);

  useEffect(() => {
    const area = areaRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    if (!area || !left || !right) return;
    const canvases = [left, right];
    const contexts = canvases.map((c) => c.getContext("2d")!);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = panelWidth(window.innerWidth);
      height = window.innerHeight;
      canvases.forEach((c, i) => {
        c.width = Math.round(width * dpr);
        c.height = Math.round(height * dpr);
        c.style.width = `${width}px`;
        c.style.height = `${height}px`;
        // Draw the right side mirrored so both use the same left-side math.
        contexts[i].setTransform(i === 0 ? dpr : -dpr, 0, 0, dpr, i === 0 ? 0 : c.width, 0);
      });
      setLayout({ width, phone: window.innerWidth <= 640 });
    };

    const draw = (t: number) => {
      const rect = area.getBoundingClientRect();
      // Only the part of the viewport covered by the wave area (below the header).
      const y0 = Math.max(0, rect.top);
      const y1 = Math.min(height, rect.bottom);
      contexts.forEach((ctx) => {
        ctx.clearRect(0, 0, width, height);
        if (y1 <= y0) return;
        drawBands({ ctx, width, top: -rect.top, y0, y1, crest: crestRef.current }, t);
      });
    };

    const frame = (ms: number) => {
      draw(ms / 1000);
      raf = requestAnimationFrame(frame);
    };
    // With reduced motion, a still image that still scrolls with the page.
    const drawStill = () => draw(0);
    const onResize = () => {
      resize();
      if (reduceMotion.matches) drawStill();
    };

    resize();
    window.addEventListener("resize", onResize);
    if (reduceMotion.matches) {
      drawStill();
      window.addEventListener("scroll", drawStill, { passive: true });
    } else {
      raf = requestAnimationFrame(frame);
    }
    const unsubscribe = subscribeWaveColor(() => {
      if (reduceMotion.matches) requestAnimationFrame(drawStill);
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", drawStill);
      unsubscribe();
    };
  }, []);

  const phoneOpacity = layout?.phone ? 0.55 : 1;

  // Glow spots deep in the water, centered on the page edge. "screen" only
  // lightens, and the spots are narrow enough to stay within the water. They
  // fade in below the source point, where the water is still narrow.
  const glowStyle = (side: "left" | "right"): CSSProperties => {
    const fade = `linear-gradient(to bottom, transparent 0, #000 ${(layout?.width ?? 0) * FAN_LENGTH}px)`;
    return {
      position: "absolute",
      top: 0,
      bottom: 0,
      [side]: 0,
      width: layout?.width ?? 0,
      pointerEvents: "none",
      mixBlendMode: "screen",
      opacity: phoneOpacity,
      maskImage: fade,
      WebkitMaskImage: fade,
    };
  };
  const glowSpots = (side: "left" | "right"): CSSProperties => ({
    position: "absolute",
    inset: 0,
    backgroundImage: `radial-gradient(ellipse 70% ${GLOW_SPACING * 0.42}px at ${side === "left" ? "0%" : "100%"} 50%, ${glow}, transparent 72%)`,
    backgroundSize: `100% ${GLOW_SPACING}px`,
    backgroundRepeat: "repeat-y",
  });

  return (
    <div ref={areaRef} className="pointer-events-none absolute inset-0" aria-hidden>
      <style>{css}</style>
      <canvas ref={leftRef} className="hrro-depth-dim" style={{ ...canvasStyle, left: 0, opacity: phoneOpacity }} />
      <canvas ref={rightRef} className="hrro-depth-dim" style={{ ...canvasStyle, right: 0, opacity: phoneOpacity }} />
      {layout &&
        (["left", "right"] as const).map((side) => (
          <div key={side} style={glowStyle(side)}>
            <div className="hrro-depth-glow" style={glowSpots(side)} />
          </div>
        ))}
    </div>
  );
}
