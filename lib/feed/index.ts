import { linkedinPosts } from "@/content/linkedin";
import { localeInfo, type Locale } from "@/lib/i18n";
import { getGitHubCommits } from "./github";
import { getGoodreadsReviews } from "./goodreads";
import { getLetterboxdEntries } from "./letterboxd";
import { translateTexts, type Translation } from "./translate";
import type { FeedItem, LinkedInPost } from "./types";
import { getXPosts } from "./x";

export type { FeedItem } from "./types";
export type TranslatedItem = FeedItem & { translatedFrom: string | null };

const MAX_ITEMS = 20;

function getLinkedInPosts(): LinkedInPost[] {
  return linkedinPosts.map((post) => ({
    source: "linkedin",
    id: post.url,
    url: post.url,
    date: new Date(post.date).toISOString(),
    text: post.text,
  }));
}

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

// The free-form text of each post; titles, names and commit messages stay as-is.
function translatable(item: FeedItem): string {
  switch (item.source) {
    case "x":
    case "linkedin":
      return item.text;
    case "goodreads":
    case "letterboxd":
      return item.review;
    default:
      return "";
  }
}

function withText(item: FeedItem, { text, from }: Translation): TranslatedItem {
  switch (item.source) {
    case "x":
    case "linkedin":
      return { ...item, text, translatedFrom: from };
    case "goodreads":
    case "letterboxd":
      return { ...item, review: text, translatedFrom: from };
    default:
      return { ...item, translatedFrom: null };
  }
}

export async function getTranslatedFeed(locale: Locale): Promise<TranslatedItem[]> {
  const items = await getFeed();
  const translations = await translateTexts(items.map(translatable), localeInfo[locale].deepl);
  return items.map((item, i) => withText(item, translations[i]));
}
