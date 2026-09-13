import { site } from "../data/site";
import { getBlogPosts, postPath } from "./posts";

export function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      default:
        return "&quot;";
    }
  });
}

export function absUrl(path: string) {
  return new URL(path, `${site.url}/`).href;
}

export async function publicPages() {
  const posts = await getBlogPosts();
  const latest = posts[0]?.data.date;
  return [
    { loc: absUrl("/"), lastmod: latest, changefreq: "daily", priority: "1.0" },
    { loc: absUrl("/alhangeul.html"), changefreq: "weekly", priority: "0.8" },
    { loc: absUrl("/search.html"), changefreq: "weekly", priority: "0.4" },
    { loc: absUrl("/p/privacy-policy.html"), changefreq: "yearly", priority: "0.2" },
    ...posts.map((post) => ({
      loc: absUrl(postPath(post)),
      lastmod: post.data.date,
      changefreq: "monthly",
      priority: "0.8",
    })),
  ];
}

export async function rssItems() {
  const posts = await getBlogPosts();
  return posts.slice(0, 30).map((post) => ({
    title: post.data.title,
    link: absUrl(postPath(post)),
    description: post.data.description,
    pubDate: post.data.date,
    category: post.data.tags[0] ?? "한글뷰어",
  }));
}
