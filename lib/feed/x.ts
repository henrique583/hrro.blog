import { createHmac, randomBytes } from "node:crypto";
import { cacheLife, cacheTag } from "next/cache";
import { profiles } from "@/lib/site";
import type { XPost } from "./types";

// X API v2 (pay-per-use). Requests are signed as you (OAuth 1.0a user
// context) because reading your own posts is only billed at the cheaper
// "Owned Reads" rate ($0.001/post vs $0.005) when the request is made by the
// app's owner. Needs four values from the app's "Keys & Tokens" page in the
// X developer console: the Consumer Key/Secret and your Access Token/Secret.
const API = "https://api.x.com/2";

interface Credentials {
  consumerKey: string;
  consumerSecret: string;
  token: string;
  tokenSecret: string;
}

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  note_tweet?: { text: string };
}

function credentials(): Credentials | null {
  const {
    X_CONSUMER_KEY: consumerKey,
    X_CONSUMER_SECRET: consumerSecret,
    X_ACCESS_TOKEN: token,
    X_ACCESS_TOKEN_SECRET: tokenSecret,
  } = process.env;
  if (!consumerKey || !consumerSecret || !token || !tokenSecret) return null;
  return { consumerKey, consumerSecret, token, tokenSecret };
}

// RFC 3986 encoding, as OAuth 1.0a requires.
const enc = (s: string) =>
  encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

/** OAuth 1.0a HMAC-SHA1 Authorization header for a GET request. */
function oauthHeader(url: string, query: URLSearchParams, creds: Credentials) {
  const oauth: Record<string, string> = {
    oauth_consumer_key: creds.consumerKey,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: creds.token,
    oauth_version: "1.0",
  };
  const params = [...query.entries(), ...Object.entries(oauth)]
    .map(([k, v]) => [enc(k), enc(v)])
    .sort(([a, av], [b, bv]) => (a === b ? (av < bv ? -1 : 1) : a < b ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const base = ["GET", enc(url), enc(params)].join("&");
  const key = `${enc(creds.consumerSecret)}&${enc(creds.tokenSecret)}`;
  oauth.oauth_signature = createHmac("sha1", key).update(base).digest("base64");
  return (
    "OAuth " +
    Object.entries(oauth)
      .map(([k, v]) => `${enc(k)}="${enc(v)}"`)
      .join(", ")
  );
}

export async function getXPosts(limit = 5): Promise<XPost[]> {
  "use cache";
  // Each refresh is billed per post read (min 5 for this endpoint).
  cacheLife("feed");
  cacheTag("feed", "feed:x");

  const creds = credentials();
  if (!creds) return [];

  try {
    // Access tokens start with the account's numeric id: "<user id>-<random>".
    const userId = creds.token.split("-")[0];
    const url = `${API}/users/${userId}/tweets`;
    const query = new URLSearchParams({
      max_results: String(Math.max(5, limit)),
      exclude: "replies,retweets",
      "tweet.fields": "created_at,note_tweet",
    });
    const res = await fetch(`${url}?${query}`, {
      headers: { Authorization: oauthHeader(url, query, creds) },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text()}`);
    const { data = [] } = (await res.json()) as { data?: Tweet[] };

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
