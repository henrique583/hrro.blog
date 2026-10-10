import Link from "next/link";
import { getDictionary, getLocale } from "./dictionaries";

export default async function NotFound() {
  const locale = await getLocale();
  const dict = await getDictionary();
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-medium">{dict.notFound.title}</h1>
      <Link href={`/${locale}`} className="glass glass-interactive mt-6 inline-block rounded-full px-5 py-2">
        {dict.notFound.back}
      </Link>
    </div>
  );
}
