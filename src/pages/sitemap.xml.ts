import type { APIRoute } from "astro";
import { escapeXml, formatLastmod, publicPages } from "../lib/feed";

export const GET: APIRoute = async () => {
  const pages = await publicPages();
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...pages.flatMap((page) => {
      const rows = [
        "  <url>",
        `    <loc>${escapeXml(page.loc)}</loc>`,
      ];
      if (page.lastmod instanceof Date) {
        rows.push(`    <lastmod>${formatLastmod(page.lastmod)}</lastmod>`);
      }
      rows.push(
        `    <changefreq>${page.changefreq}</changefreq>`,
        `    <priority>${page.priority}</priority>`,
        "  </url>",
      );
      return rows;
    }),
    "</urlset>",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      // text/xml is widely accepted by Naver Search Advisor validators.
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
};
