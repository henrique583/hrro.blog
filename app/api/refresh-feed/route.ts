import { createHash, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { locales } from "@/lib/i18n";

// Daily feed refresh, called by the Vercel cron job in vercel.json. Vercel
// sends `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set.
/** Constant-time comparison, so response timing doesn't reveal the secret. */
function matches(given: string, expected: string) {
  const hash = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(hash(given), hash(expected));
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !matches(request.headers.get("authorization") ?? "", `Bearer ${secret}`)) {
    return new Response("Unauthorized", { status: 401 });
  }

  revalidateTag("feed", "max");

  // Revalidation runs on the next request, so visit each language now to pull
  // the new posts at refresh time rather than on the next visitor's load.
  const origin = new URL(request.url).origin;
  await Promise.all(
    locales.map((locale) => fetch(`${origin}/${locale}`, { cache: "no-store" }).catch(() => null)),
  );

  return Response.json({ refreshed: true });
}
