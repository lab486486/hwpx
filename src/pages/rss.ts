import type { APIRoute } from "astro";
import { site } from "../data/site";
import { absUrl, cdata, escapeXml, rssItems } from "../lib/feed";

export const GET: APIRoute = async () => {
  const items = await rssItems();
  const self = absUrl("/rss");
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "  <channel>",
    `    <title>${escapeXml(site.name)}</title>`,
    `    <link>${escapeXml(absUrl("/"))}</link>`,
    `    <description>${escapeXml(site.description)}</description>`,
    "    <language>ko</language>",
    ...items.flatMap((item) => [
      "    <item>",
      `      <title>${escapeXml(item.title)}</title>`,
      `      <link>${escapeXml(item.link)}</link>`,
      `      <description>${cdata(item.description)}</description>`,
      `      <pubDate>${item.pubDate.toUTCString()}</pubDate>`,
      `      <guid>${escapeXml(item.link)}</guid>`,
      "    </item>",
    ]),
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");

  // Keep self URL out of the XML above intentionally: Naver's sample RSS is plain rss 2.0.
  void self;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
};
