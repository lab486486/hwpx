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

/** Wrap HTML/text for RSS description so Naver can read the full body. */
export function cdata(value: string) {
  return `<![CDATA[${value.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

/** Naver sitemap examples use +09:00, not milliseconds Zulu. */
export function formatLastmod(date: Date) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = kst.getUTCFullYear();
  const mm = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(kst.getUTCDate()).padStart(2, "0");
  const hh = String(kst.getUTCHours()).padStart(2, "0");
  const mi = String(kst.getUTCMinutes()).padStart(2, "0");
  const ss = String(kst.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}+09:00`;
}

export function absUrl(path: string) {
  return new URL(path, `${site.url}/`).href;
}

export async function publicPages() {
  const posts = await getBlogPosts();
  const latest = posts[0]?.data.date;
  return [
    { loc: absUrl("/"), lastmod: latest, changefreq: "daily", priority: "1.0" },
    { loc: absUrl("/alhangeul"), changefreq: "weekly", priority: "0.8" },
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
    // Naver asks for full post body in each item, not a short excerpt.
    description: post.body?.trim() || post.data.description,
    pubDate: post.data.date,
    category: post.data.tags[0] ?? "한글뷰어",
  }));
}
