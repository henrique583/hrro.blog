import { Suspense } from "react";
import FeedCard from "@/components/feed/FeedCard";
import SocialLinks from "@/components/SocialLinks";
import { getTranslatedFeed } from "@/lib/feed";
import { getDictionary, getLocale } from "./dictionaries";

async function Feed() {
  const locale = await getLocale();
  const dict = await getDictionary();
  const items = await getTranslatedFeed(locale);

  if (items.length === 0) {
    return <p className="text-center text-muted">{dict.home.empty}</p>;
  }
  return (
    <div className="flex flex-col gap-10">
      {items.map((item) => (
        <FeedCard key={`${item.source}:${item.id}`} item={item} dict={dict.feed} locale={locale} />
      ))}
    </div>
  );
}

function FeedSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-10">
      {[0, 1, 2].map((i) => (
        <div key={i}>
          <div className="mb-2.5 h-5 w-48 animate-pulse rounded bg-white/10" />
          <div className="h-36 animate-pulse rounded-[20px] border border-white/15 bg-white/[0.03]" />
        </div>
      ))}
    </div>
  );
}

export default async function Home() {
  const dict = await getDictionary();
  return (
    <>
      <SocialLinks />
      <h1 className="mt-10 mb-10 text-center text-xl tracking-wide">
        {dict.home.recentActivity}
      </h1>
      <Suspense fallback={<FeedSkeleton label={dict.home.loading} />}>
        <Feed />
      </Suspense>
    </>
  );
}
