import { profiles, socialOrder } from "@/lib/site";
import { BrandIcon } from "./BrandIcon";

export default function SocialLinks() {
  return (
    <ul className="flex flex-wrap justify-center gap-3">
      {socialOrder.map((source) => (
        <li key={source}>
          <a
            href={profiles[source].url}
            target="_blank"
            rel="noopener noreferrer"
            className="glass glass-interactive flex h-10 items-center gap-2 rounded-full px-4 text-[15px] font-medium"
          >
            <BrandIcon source={source} />
            {profiles[source].platform}
          </a>
        </li>
      ))}
    </ul>
  );
}
