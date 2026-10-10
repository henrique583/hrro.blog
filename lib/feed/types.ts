// Normalized shape for every post shown in the home feed. Dates are ISO strings
// so items serialize cleanly through "use cache".

interface Base {
  id: string;
  url: string;
  date: string;
}

export interface XPost extends Base {
  source: "x";
  text: string;
}

export interface GitHubCommit extends Base {
  source: "github";
  repo: string;
  branch: string;
  sha: string;
  title: string;
  body: string;
  extraCommits: number;
}

export interface LinkedInPost extends Base {
  source: "linkedin";
  text: string;
}

export interface GoodreadsReview extends Base {
  source: "goodreads";
  title: string;
  author: string;
  cover: string | null;
  rating: number; // 0 = unrated
  review: string;
}

export interface LetterboxdEntry extends Base {
  source: "letterboxd";
  film: string;
  year: string;
  poster: string | null;
  rating: number | null; // 0.5 – 5
  review: string;
  watchedDate: string | null;
  rewatch: boolean;
  liked: boolean;
  spoilers: boolean;
}

export type FeedItem = XPost | GitHubCommit | LinkedInPost | GoodreadsReview | LetterboxdEntry;
