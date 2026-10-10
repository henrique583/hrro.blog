import { cacheLife, cacheTag } from "next/cache";
import { profiles } from "@/lib/site";
import type { XPost } from "./types";

// X API v2 (pay-per-use). Requires X_BEARER_TOKEN; X_USER_ID is optional but
// saves one user lookup per cache refresh.
const API = "https://api.x.com/2";

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  note_tweet?: { text: string };
}

async function x<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`X ${path}: HTTP ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function getUserId(token: string): Promise<string> {
  "use cache";
  cacheLife("max");
  const username = profiles.x.handle.replace("@", "");
  const { data } = await x<{ data: { id: string } }>(`/users/by/username/${username}`, token);
  return data.id;
}

export async function getXPosts(limit = 5): Promise<XPost[]> {
  "use cache";
  // Each refresh reads `limit` posts (min 5 for this endpoint), so keep this hourly.
  cacheLife({ stale: 300, revalidate: 3600, expire: 86400 });
  cacheTag("feed", "feed:x");

  const token = process.env.X_BEARER_TOKEN;
  if (!token) return [];

  try {
    const userId = process.env.X_USER_ID || (await getUserId(token));
    const params = new URLSearchParams({
      max_results: String(Math.max(5, limit)),
      exclude: "replies,retweets",
      "tweet.fields": "created_at,note_tweet",
    });
    const { data = [] } = await x<{ data?: Tweet[] }>(`/users/${userId}/tweets?${params}`, token);

    return data.slice(0, limit).map((tweet) => ({
      source: "x" as const,
      id: tweet.id,
      url: `${profiles.x.url}/status/${tweet.id}`,
      date: tweet.created_at,
      // Long posts are truncated in `text`; the full version lives in note_tweet.
      text: (tweet.note_tweet?.text ?? tweet.text).replace(/\s*https:\/\/t\.co\/\w+$/, ""),
    }));
  } catch (error) {
    console.error("[feed] X failed:", error);
    return [];
  }
}
