import { profiles, socialOrder } from "@/lib/site";
import { SourceIcon } from "./feed/SourceIcon";

export default function SocialLinks() {
  return (
    <ul className="flex flex-wrap justify-center gap-3">
      {socialOrder.map((source) => (
        <li key={source}>
          <a
            href={profiles[source].url}
            target="_blank"
            rel="noopener noreferrer"
            className="glass glass-interactive flex items-center gap-2 rounded-full px-4 py-2 text-[15px] font-medium"
          >
            <SourceIcon source={source} className="size-4" />
            {profiles[source].platform}
          </a>
        </li>
      ))}
    </ul>
  );
}
