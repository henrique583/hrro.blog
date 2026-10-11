"use client";

import { useState, type MouseEvent, type ReactNode } from "react";

// Blurred review text. With a mouse it's revealed on hover (see .spoiler in
// globals.css). Touch screens can't hover, so there the first tap reveals it
// instead of following the card's link; later taps open the post as usual.
export default function Spoiler({ children, className }: { children: ReactNode; className?: string }) {
  const [revealed, setRevealed] = useState(false);

  function onClick(e: MouseEvent) {
    if (revealed || !window.matchMedia("(hover: none)").matches) return;
    e.preventDefault();
    setRevealed(true);
  }

  return (
    <p onClick={onClick} className={`${className ?? ""} ${revealed ? "" : "spoiler"}`}>
      {children}
    </p>
  );
}
