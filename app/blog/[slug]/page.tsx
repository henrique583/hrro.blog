import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPostBySlug } from "@/lib/posts";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let meta: Awaited<ReturnType<typeof getPostBySlug>>["meta"];
  let content: string;

  try {
    const post = await getPostBySlug(slug);
    meta = post.meta;
    content = post.content;
  } catch {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold">{meta.title}</h1>

      {(meta.publishedAt || meta.updatedAt) && (
        <p className="mt-2 text-sm opacity-70">
          {meta.publishedAt ? `Published ${meta.publishedAt}` : ""}
          {meta.updatedAt ? ` · Updated ${meta.updatedAt}` : ""}
        </p>
      )}

      <article className="prose prose-invert mt-10 max-w-none">
        <MDXRemote source={content} />
      </article>
    </main>
  );
};