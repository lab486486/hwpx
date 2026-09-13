#!/usr/bin/env node
/**
 * Blogger official Atom feed → Markdown.
 * Uses max-results=150 + start-index. Does not scrape HTML pages.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const blogDir = path.join(root, "src/content/blog");
const uploadDir = path.join(root, "public/uploads");
const feedBase = "https://www.hwpx.co.kr/feeds/posts/default";
const pageSize = 150;

const UA =
  "Mozilla/5.0 (compatible; hwpx-import/1.0; +https://www.hwpx.co.kr/)";

function decodeXml(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");
}

function tagText(xml, name) {
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i");
  const match = xml.match(re);
  return match ? decodeXml(match[1].trim()) : "";
}

function splitEntries(xml) {
  const chunks = [];
  const re = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = re.exec(xml))) chunks.push(match[1]);
  return chunks;
}

function categories(xml) {
  const tags = [];
  const re =
    /<category\b[^>]*scheme=["']http:\/\/www\.blogger\.com\/atom\/ns#["'][^>]*term=["']([^"']+)["'][^>]*\/?>/g;
  let match;
  while ((match = re.exec(xml))) tags.push(decodeXml(match[1]));
  return [...new Set(tags)];
}

function alternateHref(xml) {
  const re =
    /<link\b[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["'][^>]*\/?>/g;
  let match;
  while ((match = re.exec(xml))) {
    const href = decodeXml(match[1]);
    if (href.includes("hwpx.co.kr")) return href;
  }
  return "";
}

function thumbnail(xml) {
  const match = xml.match(/<media:thumbnail\b[^>]*url=["']([^"']+)["']/);
  return match ? decodeXml(match[1]) : "";
}

function permalinkParts(url) {
  const parsed = new URL(url);
  const parts = parsed.pathname.split("/").filter(Boolean);
  if (parts.length === 3 && /^\d{4}$/.test(parts[0]) && /^\d{2}$/.test(parts[1])) {
    return {
      year: parts[0],
      month: parts[1],
      slug: decodeURIComponent(parts[2].replace(/\.html$/i, "")),
    };
  }
  throw new Error(`Unexpected permalink: ${url}`);
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function descriptionFrom(html, title) {
  const text = stripHtml(html);
  if (!text) return title;
  return text.length > 160 ? `${text.slice(0, 157)}…` : text;
}

function yamlQuote(value) {
  return JSON.stringify(value ?? "");
}

function hiResImage(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("blogger.googleusercontent.com")) return url;
    parsed.pathname = parsed.pathname.replace(
      /\/(?:[swh]\d+(?:-[cwh]\d+)*-?c?)\//,
      "/s1600/",
    );
    return parsed.toString();
  } catch {
    return url;
  }
}

function collectImageUrls(html, cover) {
  const urls = new Set();
  if (cover) urls.add(cover);
  const re =
    /https?:\/\/(?:lh\d+\.googleusercontent\.com|blogger\.googleusercontent\.com)\/[^"'\\\s>]+/gi;
  let match;
  while ((match = re.exec(html))) urls.add(decodeXml(match[0]));
  return [...urls];
}

function extFrom(url, contentType) {
  const fromType = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
  }[contentType?.split(";")[0] ?? ""];
  if (fromType) return fromType;
  try {
    const name = decodeURIComponent(new URL(url).pathname.split("/").pop() || "");
    const ext = path.extname(name).toLowerCase();
    if (ext && ext.length <= 5) return ext;
  } catch {
    /* ignore */
  }
  return ".jpg";
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function fetchFeedPage(startIndex) {
  const url = `${feedBase}?alt=atom&max-results=${pageSize}&start-index=${startIndex}`;
  console.log("GET", url);
  return fetchText(url);
}

const imageCache = new Map();

async function downloadImage(url) {
  const fetchUrl = hiResImage(url);
  if (imageCache.has(fetchUrl)) return imageCache.get(fetchUrl);
  const hash = crypto.createHash("sha1").update(fetchUrl).digest("hex").slice(0, 16);
  const pending = (async () => {
    const res = await fetch(fetchUrl, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    const ext = extFrom(url, res.headers.get("content-type"));
    const file = `${hash}${ext}`;
    const dest = path.join(uploadDir, file);
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    }
    return `/uploads/${file}`;
  })();
  imageCache.set(fetchUrl, pending);
  try {
    return await pending;
  } catch (error) {
    imageCache.delete(fetchUrl);
    console.warn("image skip:", fetchUrl, error.message);
    return url;
  }
}

async function mapLimit(items, limit, worker) {
  const out = new Array(items.length);
  let i = 0;
  async function run() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await worker(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return out;
}

function rewriteHtml(html, mapping) {
  let next = html;
  for (const [remote, local] of mapping) {
    if (remote === local) continue;
    next = next.split(remote).join(local);
    const escaped = remote.replace(/&/g, "&amp;");
    next = next.split(escaped).join(local);
  }
  return next
    .replace(/\s(?:style|imageanchor|border|data-original-width|data-original-height)="[^"]*"/gi, "")
    .replace(/<div class="separator"[^>]*>/gi, "<div>")
    .replace(/(<img\b[^>]*?)\swidth="\d+"/gi, "$1")
    .replace(/(<img\b[^>]*?)\sheight="\d+"/gi, "$1");
}

function frontmatter(data) {
  return [
    "---",
    `title: ${yamlQuote(data.title)}`,
    `slug: ${yamlQuote(data.slug)}`,
    `year: ${yamlQuote(data.year)}`,
    `month: ${yamlQuote(data.month)}`,
    `date: ${data.date}`,
    `description: ${yamlQuote(data.description)}`,
    `cover_image: ${yamlQuote(data.cover)}`,
    `blogger_id: ${yamlQuote(data.id)}`,
    "tags:",
    ...data.tags.map((tag) => `  - ${yamlQuote(tag)}`),
    "---",
    "",
    data.body,
    "",
  ].join("\n");
}

function safeFileName(year, month, slug) {
  const cleaned = slug.replace(/[\/\\?%*:|"<>]/g, "-");
  return `${year}-${month}-${cleaned}.md`;
}

async function main() {
  fs.mkdirSync(blogDir, { recursive: true });
  fs.mkdirSync(uploadDir, { recursive: true });

  const posts = [];
  let start = 1;
  let total = Number.POSITIVE_INFINITY;

  while (start <= total) {
    const xml = await fetchFeedPage(start);
    const totalMatch = xml.match(/<openSearch:totalResults>(\d+)<\/openSearch:totalResults>/);
    if (totalMatch) total = Number(totalMatch[1]);
    const entries = splitEntries(xml);
    if (!entries.length) break;
    for (const entry of entries) posts.push(entry);
    console.log(`fetched ${posts.length} / ${Number.isFinite(total) ? total : "?"}`);
    start += pageSize;
  }

  if (Number.isFinite(total) && posts.length !== total) {
    console.warn(`expected ${total} posts, got ${posts.length}`);
  }

  const written = [];
  const seen = new Set();

  for (const [index, entry] of posts.entries()) {
    const title = tagText(entry, "title");
    const published = tagText(entry, "published");
    const id = tagText(entry, "id");
    const href = alternateHref(entry);
    const html = tagText(entry, "content");
    const tags = categories(entry);
    const { year, month, slug } = permalinkParts(href);
    const key = `${year}/${month}/${slug}`;
    if (seen.has(key)) {
      console.warn("duplicate permalink", key);
      continue;
    }
    seen.add(key);

    const remotes = collectImageUrls(html, thumbnail(entry));
    const locals = await mapLimit(remotes, 6, downloadImage);
    const mapping = remotes.map((remote, i) => [remote, locals[i]]);
    const body = rewriteHtml(html, mapping);
    const cover = mapping.find(([, local]) => local.startsWith("/uploads/"))?.[1] ?? "";

    const file = safeFileName(year, month, slug);
    fs.writeFileSync(
      path.join(blogDir, file),
      frontmatter({
        title,
        slug,
        year,
        month,
        date: published.slice(0, 10),
        description: descriptionFrom(body, title),
        cover,
        id,
        tags,
        body,
      }),
    );
    written.push(key);
    if ((index + 1) % 25 === 0 || index + 1 === posts.length) {
      console.log(`wrote ${index + 1}/${posts.length}  ${key}`);
    }
  }

  console.log(`done: ${written.length} posts, ${imageCache.size} images`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
