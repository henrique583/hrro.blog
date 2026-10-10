import { cacheLife, cacheTag } from "next/cache";
import { XMLParser } from "fast-xml-parser";
import { profiles } from "@/lib/site";
import { htmlToText } from "./html";
import type { LetterboxdEntry } from "./types";

const parser = new XMLParser({ parseTagValue: false, isArray: (name) => name === "item" });

interface RssItem {
  title: string;
  link: string;
  guid: string | { "#text": string };
  pubDate: string;
  description: string;
  "letterboxd:watchedDate"?: string;
  "letterboxd:rewatch"?: string;
  "letterboxd:filmTitle"?: string;
  "letterboxd:filmYear"?: string;
  "letterboxd:memberRating"?: string;
  "letterboxd:memberLike"?: string;
}

export async function getLetterboxdEntries(limit = 5): Promise<LetterboxdEntry[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 86400 });
  cacheTag("feed", "feed:letterboxd");

  try {
    const res = await fetch(`${profiles.letterboxd.url}/rss/`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items: RssItem[] = parser.parse(await res.text()).rss?.channel?.item ?? [];

    return items
      .filter((item) => item["letterboxd:filmTitle"]) // skips lists
      .slice(0, limit)
      .map((item) => {
        const guid = typeof item.guid === "string" ? item.guid : item.guid["#text"];
        const html = item.description ?? "";
        const poster = html.match(/<img src="([^"]+)"/)?.[1] ?? null;
        const isReview = guid.startsWith("letterboxd-review");
        // Drop the poster paragraph, spoiler notice and the auto-generated "Watched on…" line.
        const body = html
          .replace(/<p>\s*<img[^>]*>\s*<\/p>/i, "")
          .replace(/<p>\s*<em>This review may contain spoilers\.<\/em>\s*<\/p>/i, "");
        const rating = Number(item["letterboxd:memberRating"]);

        return {
          source: "letterboxd" as const,
          id: guid,
          url: item.link,
          date: new Date(item.pubDate).toISOString(),
          film: item["letterboxd:filmTitle"] ?? "",
          year: item["letterboxd:filmYear"] ?? "",
          poster,
          rating: rating > 0 ? rating : null,
          review: isReview ? htmlToText(body) : "",
          watchedDate: item["letterboxd:watchedDate"] || null,
          rewatch: item["letterboxd:rewatch"] === "Yes",
          liked: item["letterboxd:memberLike"] === "Yes",
          spoilers: /This review may contain spoilers/i.test(html),
        };
      });
  } catch (error) {
    console.error("[feed] Letterboxd failed:", error);
    return [];
  }
}
