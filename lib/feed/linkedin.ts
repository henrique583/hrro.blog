import { cacheLife, cacheTag } from "next/cache";
import { linkedinPosts } from "@/content/linkedin";
import { decodeEntities, htmlToText } from "./html";
import type { LinkedInPost } from "./types";

// LinkedIn ids are snowflakes: the top 41 bits are the creation time in ms.
function dateFromId(id: string) {
  return new Date(Number(BigInt(id) >> BigInt(22))).toISOString();
}

async function getPost(urn: string, id: string): Promise<LinkedInPost | null> {
  "use cache";
  cacheLife("feed");
  cacheTag("feed", "feed:linkedin");

  try {
    const res = await fetch(`https://www.linkedin.com/embed/feed/update/${urn}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; hrro-blog)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    const commentary = html.match(
      /data-test-id="main-feed-activity-embed-card__commentary"[^>]*>([\s\S]*?)<\/p>/,
    )?.[1];
    const meta = html.match(/<meta property="og:description" content="([^"]*)"/)?.[1];
    const text = commentary ? htmlToText(commentary) : meta ? decodeEntities(meta).trim() : "";
    if (!text) throw new Error("no post text found");

    return {
      source: "linkedin",
      id,
      url: `https://www.linkedin.com/feed/update/${urn}/`,
      date: dateFromId(id),
      text: text.replace(/[ \t]+\n/g, "\n"),
    };
  } catch (error) {
    console.error(`[feed] LinkedIn ${urn} failed:`, error);
    return null;
  }
}

export async function getLinkedInPosts(): Promise<LinkedInPost[]> {
  const posts = await Promise.all(
    linkedinPosts.map((entry) => {
      const match = entry.match(/urn:li:(share|activity|ugcPost):(\d+)/);
      if (!match) {
        console.error(`[feed] LinkedIn entry has no post id: ${entry}`);
        return null;
      }
      return getPost(match[0], match[2]);
    }),
  );
  return posts.filter((p) => p !== null);
}
