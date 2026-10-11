import { cacheLife, cacheTag } from "next/cache";
import { profiles } from "@/lib/site";
import type { GitHubCommit } from "./types";

const API = "https://api.github.com";

interface PushEvent {
  id: string;
  type: string;
  created_at: string;
  repo: { name: string };
  payload: { ref?: string; head?: string; before?: string };
}

interface Commit {
  sha: string;
  parents: unknown[];
  commit: { message: string };
}

function github<T>(path: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "hrro-blog",
  };
  // Optional: raises the rate limit from 60 to 5000 requests/hour.
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return fetch(`${API}${path}`, { headers }).then((res) => {
    if (!res.ok) throw new Error(`GitHub ${path}: HTTP ${res.status}`);
    return res.json() as Promise<T>;
  });
}

// The events API no longer includes commit messages, so look up the commits in
// each push and pick the newest one that isn't a merge commit.
async function commitsInPush(event: PushEvent): Promise<Commit[]> {
  const { repo, payload } = event;
  if (payload.before && !/^0+$/.test(payload.before)) {
    try {
      const compare = await github<{ commits: Commit[] }>(
        `/repos/${repo.name}/compare/${payload.before}...${payload.head}`,
      );
      if (compare.commits.length) return compare.commits;
    } catch {
      // Force-pushes can make `before` unreachable; fall through to the head commit.
    }
  }
  return [await github<Commit>(`/repos/${repo.name}/commits/${payload.head}`)];
}

export async function getGitHubCommits(limit = 3): Promise<GitHubCommit[]> {
  "use cache";
  cacheLife("feed");
  cacheTag("feed", "feed:github");

  try {
    const events = await github<PushEvent[]>(
      `/users/${profiles.github.handle}/events/public?per_page=50`,
    );
    const pushes = events.filter((e) => e.type === "PushEvent" && e.payload.head).slice(0, limit);

    const results = await Promise.all(
      pushes.map(async (event): Promise<GitHubCommit | null> => {
        try {
          const commits = await commitsInPush(event);
          const pick =
            [...commits].reverse().find((c) => c.parents.length < 2) ?? commits[commits.length - 1];
          const [title, ...rest] = pick.commit.message.split("\n");
          return {
            source: "github",
            id: event.id,
            url: `https://github.com/${event.repo.name}/commit/${pick.sha}`,
            date: event.created_at,
            repo: event.repo.name,
            branch: (event.payload.ref ?? "").replace("refs/heads/", ""),
            sha: pick.sha.slice(0, 7),
            title,
            body: rest.join("\n").trim(),
            extraCommits: commits.length - 1,
          };
        } catch (error) {
          console.error("[feed] GitHub commit lookup failed:", error);
          return null;
        }
      }),
    );
    return results.filter((r) => r !== null);
  } catch (error) {
    console.error("[feed] GitHub failed:", error);
    return [];
  }
}
