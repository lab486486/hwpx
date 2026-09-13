import type { APIRoute } from "astro";
import { getBlogPosts, postPath } from "../lib/posts";

export const GET: APIRoute = async () => {
  const posts = await getBlogPosts();
  const body = posts.map((post) => ({
    title: post.data.title,
    description: post.data.description,
    href: postPath(post),
    tags: post.data.tags,
    date: post.data.date.toISOString(),
  }));
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
