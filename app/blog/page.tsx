import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default async function BlogPage() {
    const posts = await getAllPosts();

    return (
        <main className="mx-auto max-w-3xl px-6 py-12">
            <h1 className="text-3xl font-semibold">Blog</h1>

            <ul className="mt-8 space-y-6">
                {posts.map((p) => (
                    <li key={p.slug} className="rounded-xl border p-5 hover:bg-neutral-50/5">
                        <Link href={`/blog/${p.slug}`} className="block">
                            <h2 className="text-xl font-medium">{p.title}</h2>
                            {p.publishedAt && (
                                <p className="mt-1 text-sm opacity-70">
                                    Published {p.publishedAt}
                                    {p.updatedAt ? ` · Updated ${p.updatedAt}` : ""}
                                </p>
                            )}
                            {p.excerpt && <p className="mt-3 opacity-85">{p.excerpt}</p>}
                        </Link>
                    </li>
                ))}
            </ul>
        </main>
    );
}
