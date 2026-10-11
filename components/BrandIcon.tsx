import { FaLinkedinIn } from "react-icons/fa6";
import { SiGithub, SiGoodreads, SiX } from "react-icons/si";
import type { Source } from "@/lib/site";

// Full-color brand marks for the social buttons. X and GitHub only have
// black/white logos, so they use the white version on this dark site.

function Letterboxd() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
      <circle cx="4.6" cy="12" r="4.4" fill="#ff8000" />
      <circle cx="19.4" cy="12" r="4.4" fill="#40bcf4" />
      <circle cx="12" cy="12" r="4.4" fill="#00e054" />
    </svg>
  );
}

export function BrandIcon({ source }: { source: Source }) {
  switch (source) {
    case "x":
      return <SiX className="size-4 text-white" aria-hidden />;
    case "github":
      return <SiGithub className="size-4 text-white" aria-hidden />;
    case "linkedin":
      return (
        <span className="grid size-4 place-items-center rounded-[3px] bg-[#0a66c2]" aria-hidden>
          <FaLinkedinIn className="size-3 text-white" />
        </span>
      );
    case "goodreads":
      return (
        <span className="grid size-4 place-items-center rounded-[3px] bg-[#f4f1ea]" aria-hidden>
          <SiGoodreads className="size-3 text-[#382110]" />
        </span>
      );
    case "letterboxd":
      return <Letterboxd />;
  }
}
