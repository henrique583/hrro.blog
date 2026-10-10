import { cacheLife, cacheTag } from "next/cache";
import { XMLParser } from "fast-xml-parser";
import { GOODREADS_USER_ID } from "@/lib/site";
import { htmlToText } from "./html";
import type { GoodreadsReview } from "./types";

const parser = new XMLParser({ parseTagValue: false, isArray: (name) => name === "item" });

interface RssItem {
  guid: string;
  link: string;
  title: string;
  pubDate: string;
  author_name: string;
  book_large_image_url?: string;
  book_medium_image_url?: string;
  user_rating?: string;
  user_review?: string;
}

export async function getGoodreadsReviews(limit = 5): Promise<GoodreadsReview[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 86400 });
  cacheTag("feed", "feed:goodreads");

  try {
    const res = await fetch(
      `https://www.goodreads.com/review/list_rss/${GOODREADS_USER_ID}?shelf=read`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items: RssItem[] = parser.parse(await res.text()).rss?.channel?.item ?? [];

    return items.slice(0, limit).map((item) => {
      const cover = item.book_large_image_url || item.book_medium_image_url || "";
      return {
        source: "goodreads" as const,
        id: item.guid,
        url: item.link.replace(/\?utm_[^#]*/, ""),
        date: new Date(item.pubDate).toISOString(),
        title: item.title,
        author: item.author_name,
        // Goodreads serves a generic "nophoto" image for books without a cover.
        cover: cover && !cover.includes("nophoto") ? cover : null,
        rating: Number(item.user_rating) || 0,
        review: htmlToText(item.user_review ?? ""),
      };
    });
  } catch (error) {
    console.error("[feed] Goodreads failed:", error);
    return [];
  }
}
