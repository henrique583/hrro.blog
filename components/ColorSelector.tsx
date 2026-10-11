"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { LuPencil } from "react-icons/lu";
import {
  defaultWaveColor,
  readWaveColor,
  setWaveColor,
  subscribeWaveColor,
  wavePresets,
} from "@/lib/wave-color";
import { useDismiss } from "@/lib/use-dismiss";

interface Props {
  labels: {
    label: string;
    blue: string;
    red: string;
    green: string;
    custom: string;
    hex: string;
  };
}

function Swatch({ color }: { color: string }) {
  return (
    <span
      className="block size-full rounded-full"
      style={{ background: `linear-gradient(180deg, #000e1b 0%, #000e1b 25%, ${color} 100%)` }}
    />
  );
}

export default function ColorSelector({ labels }: Props) {
  const color = useSyncExternalStore(subscribeWaveColor, readWaveColor, () => defaultWaveColor);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isCustom = !wavePresets.some((p) => p.color === color);

  useDismiss(rootRef, open, useCallback(() => setOpen(false), []));

  const ring = (active: boolean) =>
    active ? "ring-2 ring-white/90 ring-offset-2 ring-offset-transparent" : "ring-1 ring-white/30";

  return (
    // Sized to the pill (not the full row), so clicks beside it count as outside.
    <div ref={rootRef} className="relative z-30 mx-auto w-fit">
      <div
        role="radiogroup"
        aria-label={labels.label}
        // Same 40px height as the social buttons below it.
        className="glass flex h-10 items-center gap-2 rounded-full px-1.5"
      >
        {wavePresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            role="radio"
            aria-checked={color === preset.color}
            aria-label={labels[preset.id]}
            title={labels[preset.id]}
            onClick={() => setWaveColor(preset.color)}
            className={`size-7 cursor-pointer rounded-full transition-transform hover:scale-110 ${ring(color === preset.color)}`}
          >
            <Swatch color={preset.color} />
          </button>
        ))}
        <button
          type="button"
          aria-pressed={isCustom}
          aria-label={labels.custom}
          aria-expanded={open}
          title={labels.custom}
          onClick={() => setOpen((o) => !o)}
          className={`relative grid size-7 cursor-pointer place-items-center rounded-full transition-transform hover:scale-110 ${ring(isCustom)}`}
          style={{ background: isCustom ? color : "rgb(255 255 255 / 0.1)" }}
        >
          <LuPencil
            className="size-3.5"
            style={{ color: "#fff", filter: isCustom ? "drop-shadow(0 0 2px rgb(0 0 0 / .6))" : undefined }}
          />
        </button>
      </div>

      {open && (
        <div className="glass glass-dense absolute top-full left-1/2 mt-3 flex w-max -translate-x-1/2 flex-col gap-3 rounded-3xl p-3">
          <HexColorPicker color={color} onChange={setWaveColor} />
          <label className="flex items-center gap-2 text-sm text-white/70">
            {labels.hex}
            <HexColorInput
              color={color}
              onChange={setWaveColor}
              prefixed
              className="w-full rounded-full border border-white/20 bg-black/30 px-3 py-1.5 font-mono text-white uppercase outline-none focus:border-white/60"
            />
          </label>
        </div>
      )}
    </div>
  );
}
