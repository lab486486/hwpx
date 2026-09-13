import { getCollection, type CollectionEntry } from "astro:content";
import { pageSize } from "../data/site";

export type Post = CollectionEntry<"blog">;

export function postPath(post: Post): string {
  return `/${post.data.year}/${post.data.month}/${post.data.slug}.html`;
}

export function labelPath(tag: string): string {
  return `/label/${encodeURIComponent(tag)}.html`;
}

export async function getBlogPosts(): Promise<Post[]> {
  const posts = await getCollection("blog");
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function paginate<T>(items: T[], size = pageSize) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  return {
    pages,
    pageItems: (n: number) => items.slice((n - 1) * size, n * size),
  };
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function postsByTag(posts: Post[], tag: string): Post[] {
  return posts.filter((post) => post.data.tags.includes(tag));
}

export function relatedPosts(post: Post, all: Post[], limit = 4): Post[] {
  const tags = new Set(post.data.tags);
  return all
    .filter((item) => item.id !== post.id)
    .map((item) => ({
      item,
      score: item.data.tags.filter((tag) => tags.has(tag)).length,
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || b.item.data.date.valueOf() - a.item.data.date.valueOf())
    .slice(0, limit)
    .map((row) => row.item);
}
