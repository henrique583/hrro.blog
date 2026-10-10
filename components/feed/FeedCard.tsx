import Image from "next/image";
import { FaHeart } from "react-icons/fa6";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { TranslatedItem } from "@/lib/feed";
import type {
  GitHubCommit,
  GoodreadsReview,
  LetterboxdEntry,
  LinkedInPost,
  XPost,
} from "@/lib/feed/types";
import { localeInfo, type Locale } from "@/lib/i18n";
import { profiles, SITE_TIME_ZONE, type Source } from "@/lib/site";
import { SourceIcon } from "./SourceIcon";

type FeedDict = Dictionary["feed"];
type Translated<T> = T & { translatedFrom: string | null };

interface CardProps<T> {
  item: Translated<T>;
  dict: FeedDict;
  locale: Locale;
}

/** Timestamps are shown in the site's time zone; plain dates ("2026-09-02") as-is. */
function formatDate(iso: string, locale: Locale) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  return new Intl.DateTimeFormat(localeInfo[locale].bcp47, {
    dateStyle: "medium",
    timeZone: dateOnly ? "UTC" : SITE_TIME_ZONE,
  }).format(new Date(iso));
}

function Avatar({ source, size = 40 }: { source: Source; size?: number }) {
  return (
    <Image
      src={profiles[source].avatar}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}

function TranslatedNote({ from, dict, className }: { from: string | null; dict: FeedDict; className?: string }) {
  if (!from) return null;
  const name = dict.languages[from as keyof FeedDict["languages"]] ?? from;
  return <p className={`mt-3 text-xs ${className ?? ""}`}>{dict.translatedFrom.replace("{lang}", name)}</p>;
}

/* ---------- X ---------- */

function XCard({ item, dict, locale }: CardProps<XPost>) {
  const p = profiles.x;
  return (
    <div className="rounded-[20px] border border-white/60 bg-black p-4 text-[15px] leading-6 text-[#e7e9ea]">
      <div className="flex items-start gap-3">
        <Avatar source="x" />
        <div className="min-w-0 flex-1 leading-5">
          <p className="truncate font-bold text-[#e7e9ea]">{p.name}</p>
          <p className="truncate text-[#71767b]">{p.handle}</p>
        </div>
        <SourceIcon source="x" className="mt-1 size-4 text-[#e7e9ea]" />
      </div>
      <p className="mt-3 line-clamp-[10] whitespace-pre-line break-words">{item.text}</p>
      <TranslatedNote from={item.translatedFrom} dict={dict} className="text-[#71767b]" />
      <p className="mt-3 text-sm text-[#71767b]">{formatDate(item.date, locale)}</p>
    </div>
  );
}

/* ---------- GitHub ---------- */

function GitHubCard({ item, dict, locale }: CardProps<GitHubCommit>) {
  const p = profiles.github;
  return (
    <div className="rounded-[20px] border border-[#3d444d] bg-[#0d1117] p-4 text-sm text-[#f0f6fc]">
      <div className="flex items-center gap-3">
        <Avatar source="github" size={32} />
        <p className="min-w-0 flex-1 leading-5 text-[#9198a1]">
          <span className="font-semibold text-[#f0f6fc]">{p.handle}</span> {dict.github.pushedTo}{" "}
          <span className="rounded-md bg-[#388bfd26] px-1.5 py-0.5 font-mono text-xs text-[#4493f8]">
            {item.branch}
          </span>{" "}
          {dict.github.in} <span className="font-semibold text-[#f0f6fc]">{item.repo}</span>
        </p>
        <SourceIcon source="github" className="size-5 shrink-0" />
      </div>
      <div className="mt-3 rounded-xl border border-[#3d444d] bg-[#151b23] p-3">
        <div className="flex items-start gap-3">
          <code className="mt-0.5 shrink-0 font-mono text-xs text-[#4493f8]">{item.sha}</code>
          <div className="min-w-0">
            <p className="font-semibold break-words">{item.title}</p>
            {item.body && (
              <p className="mt-1 line-clamp-3 whitespace-pre-line break-words text-[#9198a1]">{item.body}</p>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-between gap-3 text-xs text-[#9198a1]">
        <span>
          {item.extraCommits > 0 && dict.github.moreCommits.replace("{count}", String(item.extraCommits))}
        </span>
        <span>{formatDate(item.date, locale)}</span>
      </div>
    </div>
  );
}

/* ---------- LinkedIn ---------- */

function LinkedInCard({ item, dict, locale }: CardProps<LinkedInPost>) {
  const p = profiles.linkedin;
  return (
    <div className="rounded-[20px] border border-white/20 bg-[#1b1f23] p-4 text-sm leading-5 text-white/90">
      <div className="flex items-start gap-3">
        <Avatar source="linkedin" size={48} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{p.name}</p>
          <p className="text-xs text-white/60">{formatDate(item.date, locale)}</p>
        </div>
        <SourceIcon source="linkedin" className="size-5 text-[#71b7fb]" />
      </div>
      <p className="mt-3 line-clamp-5 whitespace-pre-line break-words">{item.text}</p>
      <p className="mt-1 text-white/60">{dict.linkedin.seeMore}</p>
      <TranslatedNote from={item.translatedFrom} dict={dict} className="text-white/50" />
    </div>
  );
}

/* ---------- Goodreads ---------- */

function GoodreadsStars({ rating }: { rating: number }) {
  return (
    <span className="tracking-[1px]" aria-label={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? "text-[#e87400]" : "text-[#d6d0c4]"}>
          ★
        </span>
      ))}
    </span>
  );
}

function GoodreadsCard({ item, dict, locale }: CardProps<GoodreadsReview>) {
  const p = profiles.goodreads;
  const g = dict.goodreads;
  const action = item.review ? g.reviewed : item.rating ? g.rated : g.read;
  return (
    <div className="rounded-[20px] border border-[#d8d8d8] bg-[#f4f1ea] p-4 text-sm text-[#181818]">
      <div className="flex items-center gap-3">
        <Avatar source="goodreads" size={36} />
        <p className="min-w-0 flex-1">
          <span className="font-bold text-[#00635d]">{p.name}</span> {action}
        </p>
        <SourceIcon source="goodreads" className="size-5 text-[#382110]" />
      </div>
      <div className="mt-3 flex gap-4 rounded-xl bg-white p-3">
        {item.cover && (
          // Remote covers come from several Goodreads/Amazon CDNs.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.cover} alt="" className="h-[108px] w-[72px] shrink-0 rounded-sm object-cover shadow" />
        )}
        <div className="min-w-0">
          <p className="font-serif text-base font-bold leading-snug text-[#382110]">{item.title}</p>
          <p className="mt-0.5 text-[#5a5a5a]">
            {g.by} {item.author}
          </p>
          {item.rating > 0 && (
            <p className="mt-2 flex items-center gap-2">
              <GoodreadsStars rating={item.rating} />
              <span className="text-xs text-[#767676]">{g.ratings[item.rating - 1]}</span>
            </p>
          )}
        </div>
      </div>
      {item.review && <p className="mt-3 line-clamp-5 whitespace-pre-line break-words font-serif leading-6">{item.review}</p>}
      <TranslatedNote from={item.translatedFrom} dict={dict} className="text-[#767676]" />
      <p className="mt-3 text-xs text-[#767676]">{formatDate(item.date, locale)}</p>
    </div>
  );
}

/* ---------- Letterboxd ---------- */

function letterboxdStars(rating: number) {
  return "★".repeat(Math.floor(rating)) + (rating % 1 ? "½" : "");
}

function LetterboxdCard({ item, dict, locale }: CardProps<LetterboxdEntry>) {
  const p = profiles.letterboxd;
  const l = dict.letterboxd;
  return (
    <div className="rounded-[20px] border border-[#456] bg-[#14181c] p-4 text-sm text-[#9ab]">
      <div className="flex gap-4">
        {item.poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.poster}
            alt=""
            className="h-[105px] w-[70px] shrink-0 rounded-[4px] object-cover ring-1 ring-white/15"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p className="flex min-w-0 flex-1 items-center gap-2 text-xs">
              <Avatar source="letterboxd" size={22} />
              <span>
                {item.review ? l.reviewBy : l.watchedBy} <span className="font-semibold text-white">{p.name}</span>
              </span>
            </p>
            <SourceIcon source="letterboxd" className="size-5 shrink-0 text-white" />
          </div>
          <p className="mt-2 text-lg leading-tight font-bold text-white">
            {item.film} <span className="text-base font-normal text-[#9ab]">{item.year}</span>
          </p>
          <p className="mt-1 flex items-center gap-2">
            {item.rating && <span className="text-[#00e054]">{letterboxdStars(item.rating)}</span>}
            {item.liked && <FaHeart className="size-3 text-[#ff8000]" aria-label={l.liked} />}
            {item.watchedDate && (
              <span className="text-xs">
                {item.rewatch ? l.rewatched : l.watched} {formatDate(item.watchedDate, locale)}
              </span>
            )}
          </p>
        </div>
      </div>
      {item.review && (
        <>
          {item.spoilers && <p className="mt-3 text-xs italic text-[#ee7000]">{l.spoilers}</p>}
          <p
            className={`mt-3 line-clamp-6 whitespace-pre-line break-words leading-6 text-[#def] ${item.spoilers ? "spoiler" : ""}`}
          >
            {item.review}
          </p>
        </>
      )}
      <TranslatedNote from={item.translatedFrom} dict={dict} className="text-[#678]" />
    </div>
  );
}

/* ---------- Wrapper ---------- */

function CardBody({ item, dict, locale }: CardProps<TranslatedItem>) {
  switch (item.source) {
    case "x":
      return <XCard item={item} dict={dict} locale={locale} />;
    case "github":
      return <GitHubCard item={item} dict={dict} locale={locale} />;
    case "linkedin":
      return <LinkedInCard item={item} dict={dict} locale={locale} />;
    case "goodreads":
      return <GoodreadsCard item={item} dict={dict} locale={locale} />;
    case "letterboxd":
      return <LetterboxdCard item={item} dict={dict} locale={locale} />;
  }
}

export default function FeedCard({ item, dict, locale }: CardProps<TranslatedItem>) {
  const p = profiles[item.source];
  return (
    <article>
      <p className="mb-2.5 text-lg text-muted">
        {p.handle} {dict.on} <span className="text-foreground/80">{p.platform}</span>
      </p>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-[20px] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        <CardBody item={item} dict={dict} locale={locale} />
      </a>
    </article>
  );
}
