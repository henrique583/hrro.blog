// Profile info for each platform. Avatars live in /public/avatars.

export type Source = "x" | "github" | "linkedin" | "goodreads" | "letterboxd";

export const profiles: Record<
  Source,
  { platform: string; name: string; handle: string; url: string; avatar: string }
> = {
  x: {
    platform: "X",
    name: "Henrique",
    handle: "@henrique_rro",
    url: "https://x.com/henrique_rro",
    avatar: "/avatars/x.webp",
  },
  github: {
    platform: "GitHub",
    name: "Henrique Rodrigues",
    handle: "henrique583",
    url: "https://github.com/henrique583",
    avatar: "/avatars/github.jpg",
  },
  linkedin: {
    platform: "LinkedIn",
    name: "Henrique Rodrigues",
    handle: "henrique-rrodrigues",
    url: "https://www.linkedin.com/in/henrique-rrodrigues",
    avatar: "/avatars/linkedin.jpg",
  },
  goodreads: {
    platform: "Goodreads",
    name: "Henrique",
    handle: "henrique_rro",
    url: "https://www.goodreads.com/henrique_rro",
    avatar: "/avatars/goodreads.jpg",
  },
  letterboxd: {
    platform: "Letterboxd",
    name: "Henrique Rodrigues",
    handle: "henrique583",
    url: "https://letterboxd.com/henrique583",
    avatar: "/avatars/letterboxd.jpg",
  },
};

// Order of the social buttons on the home page.
export const socialOrder: Source[] = ["x", "github", "linkedin", "goodreads", "letterboxd"];

export const GOODREADS_USER_ID = "143878744";

// Used when formatting post dates.
export const SITE_TIME_ZONE = "America/New_York";
