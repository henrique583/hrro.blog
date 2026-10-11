// Tiny helpers for turning the HTML snippets inside RSS feeds into plain text.

const entities: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isNaN(n) ? match : String.fromCodePoint(n);
    }
    return entities[code.toLowerCase()] ?? match;
  });
}

export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Returns `url` only if it's https and on one of the given domains (or their
 * subdomains), else null. Feed links and images come from third-party RSS, so
 * this keeps anything unexpected (like `javascript:` URLs) off the page.
 */
export function safeUrl(url: string | undefined | null, domains: string[]): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    const allowed = domains.some((d) => host === d || host.endsWith(`.${d}`));
    return parsed.protocol === "https:" && allowed ? parsed.toString() : null;
  } catch {
    return null;
  }
}
