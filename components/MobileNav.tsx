"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuMenu, LuX } from "react-icons/lu";

interface Props {
  links: { href: string; label: string }[];
  labels: { open: string; close: string };
}

// Phone navigation: a hamburger button that slides a drawer in from the right.
export default function MobileNav({ links, labels }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    // Keep the page behind the drawer from scrolling.
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-label={labels.open}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen(true)}
        className="-mr-2 grid size-10 cursor-pointer place-items-center rounded-lg text-foreground/85 hover:bg-white/10 hover:text-white"
      >
        <LuMenu className="size-6" aria-hidden />
      </button>

      {/* Backdrop */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-black/60 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />

      <nav
        id="mobile-nav"
        inert={!open}
        className={`fixed top-0 right-0 z-50 flex h-dvh w-[min(80vw,320px)] flex-col border-l border-white/10 bg-[#0b141e] px-6 py-5 shadow-2xl shadow-black transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <button
          type="button"
          aria-label={labels.close}
          onClick={() => setOpen(false)}
          className="-mr-2 grid size-10 cursor-pointer place-items-center self-end rounded-lg text-foreground/85 hover:bg-white/10 hover:text-white"
        >
          <LuX className="size-6" aria-hidden />
        </button>
        <ul className="mt-6 flex flex-col gap-6 text-2xl uppercase">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-foreground/85 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
