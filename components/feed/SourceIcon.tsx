import { FaLinkedin } from "react-icons/fa6";
import { SiGithub, SiGoodreads, SiLetterboxd, SiX } from "react-icons/si";
import type { Source } from "@/lib/site";

const icons = {
  x: SiX,
  github: SiGithub,
  linkedin: FaLinkedin,
  goodreads: SiGoodreads,
  letterboxd: SiLetterboxd,
} satisfies Record<Source, unknown>;

export function SourceIcon({ source, className }: { source: Source; className?: string }) {
  const Icon = icons[source];
  return <Icon className={className} aria-hidden />;
}
