// LinkedIn has no API for reading your own posts, so add them here by hand.
// Copy the post's link from its "•••" menu → "Copy link to post", paste the text,
// and set the date it was posted. Newest first is easiest to read, but the
// feed sorts everything by date anyway.

export interface LinkedInEntry {
  url: string;
  date: string; // ISO date, e.g. "2026-10-01" or "2026-10-01T14:30:00Z"
  text: string;
}

export const linkedinPosts: LinkedInEntry[] = [
  // {
  //   url: "https://www.linkedin.com/posts/henrique-rrodrigues_activity-1234567890",
  //   date: "2026-10-01",
  //   text: "Excited to share that…",
  // },
];
