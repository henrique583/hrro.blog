import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "articles");

export type PostMeta = {
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt?: string;
  updatedAt?: string;
};

export async function getAllPosts(): Promise<PostMeta[]> {
  const files = await fs.readdir(POSTS_DIR);

  const posts = await Promise.all(
    files
      .filter((f) => f.endsWith(".mdx"))
      .map(async (filename) => {
        const fullPath = path.join(POSTS_DIR, filename);
        const raw = await fs.readFile(fullPath, "utf8");
        const { data } = matter(raw);

        const slug =
          (data.slug as string) ?? filename.replace(/\.mdx$/, "");

        return {
          title: (data.title as string) ?? slug,
          slug,
          excerpt: data.excerpt as string | undefined,
          publishedAt: data.publishedAt as string | undefined,
          updatedAt: data.updatedAt as string | undefined,
        };
      })
  );

  // Example: sort newest published first
  posts.sort((a, b) => {
    const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return db - da;
  });

  return posts;
}

export async function getPostBySlug(slug: string): Promise<{ meta: PostMeta; content: string }> {
  const fullPath = path.join(POSTS_DIR, `${slug}.mdx`);
  const raw = await fs.readFile(fullPath, "utf8");
  const { data, content } = matter(raw);

  const meta: PostMeta = {
    title: (data.title as string) ?? slug,
    slug,
    excerpt: data.excerpt as string | undefined,
    publishedAt: data.publishedAt as string | undefined,
    updatedAt: data.updatedAt as string | undefined,
  };

  return { meta, content };
}