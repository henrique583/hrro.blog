import { localeInfo, type Locale } from "@/lib/i18n";
import { getGitHubCommits } from "./github";
import { getGoodreadsReviews } from "./goodreads";
import { getLetterboxdEntries } from "./letterboxd";
import { getLinkedInPosts } from "./linkedin";
import { translateTexts, type Translation } from "./translate";
import type { FeedItem } from "./types";
import { getXPosts } from "./x";

export type { FeedItem } from "./types";
export type TranslatedItem = FeedItem & { translatedFrom: string | null };

// The home page shows only the most recent posts across every source.
const MAX_ITEMS = 12;

/** All sources merged into one timeline, newest first. */
export async function getFeed(): Promise<FeedItem[]> {
  const sources = await Promise.all([
    getXPosts(),
    getGitHubCommits(),
    getLetterboxdEntries(),
    getGoodreadsReviews(),
    getLinkedInPosts(),
  ]);
  return sources
    .flat()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_ITEMS);
}

// The text of each post that gets translated. Film and book titles, names and
// repo names stay as-is, since they're proper nouns.
function translatable(item: FeedItem): string[] {
  switch (item.source) {
    case "x":
    case "linkedin":
      return [item.text];
    case "goodreads":
    case "letterboxd":
      return [item.review];
    case "github":
      return [item.title, item.body];
  }
}

function withText(item: FeedItem, t: Translation[]): TranslatedItem {
  const translatedFrom = t.find((x) => x.from)?.from ?? null;
  switch (item.source) {
    case "x":
    case "linkedin":
      return { ...item, text: t[0].text, translatedFrom };
    case "goodreads":
    case "letterboxd":
      return { ...item, review: t[0].text, translatedFrom };
    case "github":
      return { ...item, title: t[0].text, body: t[1].text, translatedFrom };
  }
}

export async function getTranslatedFeed(locale: Locale): Promise<TranslatedItem[]> {
  const items = await getFeed();
  const target = localeInfo[locale].deepl;
  return Promise.all(
    items.map(async (item) => withText(item, await translateTexts(translatable(item), target))),
  );
}
