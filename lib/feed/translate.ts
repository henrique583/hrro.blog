import { cacheLife } from "next/cache";

// Translates post text with DeepL when DEEPL_API_KEY is set (the free plan
// covers 500k characters/month). Without a key, posts are shown as written.
// Each post is cached on its own, so it's translated once per language and
// never again, no matter how the rest of the feed changes.

export interface Translation {
  text: string;
  /** DeepL source language code (e.g. "PT") when the text was translated. */
  from: string | null;
}

async function translateText(text: string, target: string): Promise<Translation> {
  "use cache";
  cacheLife("max"); // The same text always translates the same way.

  // Read here rather than passed in, so the key never becomes part of a cache key.
  const key = process.env.DEEPL_API_KEY ?? "";

  const host = key.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";
  const res = await fetch(`https://${host}/v2/translate`, {
    method: "POST",
    headers: { Authorization: `DeepL-Auth-Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text: [text], target_lang: target }),
  });
  // Throwing (rather than returning the original) keeps failures out of the cache.
  if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text()}`);
  const { translations } = (await res.json()) as {
    translations: { text: string; detected_source_language: string }[];
  };
  const t = translations[0];
  // Already in the target language: keep the original wording.
  if (!t || t.detected_source_language === target.split("-")[0]) return { text, from: null };
  return { text: t.text, from: t.detected_source_language };
}

export async function translateTexts(texts: string[], target: string): Promise<Translation[]> {
  const key = process.env.DEEPL_API_KEY;
  return Promise.all(
    texts.map(async (text) => {
      if (!key || !text.trim()) return { text, from: null };
      try {
        return await translateText(text, target);
      } catch (error) {
        console.error("[feed] DeepL translation failed:", error);
        return { text, from: null };
      }
    }),
  );
}
