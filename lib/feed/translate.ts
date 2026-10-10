import { cacheLife } from "next/cache";

// Translates post text with DeepL when DEEPL_API_KEY is set (the free plan
// covers 500k characters/month). Without a key, posts are shown as written.

export interface Translation {
  text: string;
  /** DeepL source language code (e.g. "PT") when the text was translated. */
  from: string | null;
}

export async function translateTexts(texts: string[], target: string): Promise<Translation[]> {
  "use cache";
  cacheLife("max"); // Same input always yields the same translation.

  const original = texts.map((text) => ({ text, from: null }));
  const key = process.env.DEEPL_API_KEY;
  const indexes = texts.flatMap((t, i) => (t.trim() ? [i] : []));
  if (!key || indexes.length === 0) return original;

  const host = key.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";
  try {
    const res = await fetch(`https://${host}/v2/translate`, {
      method: "POST",
      headers: { Authorization: `DeepL-Auth-Key ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: indexes.map((i) => texts[i]), target_lang: target }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text()}`);
    const { translations } = (await res.json()) as {
      translations: { text: string; detected_source_language: string }[];
    };

    const result: Translation[] = [...original];
    const targetBase = target.split("-")[0];
    indexes.forEach((textIndex, i) => {
      const t = translations[i];
      // Already in the target language: keep the original wording.
      if (t && t.detected_source_language !== targetBase) {
        result[textIndex] = { text: t.text, from: t.detected_source_language };
      }
    });
    return result;
  } catch (error) {
    console.error("[feed] DeepL translation failed:", error);
    return original;
  }
}
