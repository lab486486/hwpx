import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    year: z.string(),
    month: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    cover_image: z.string().optional().default(""),
    tags: z.array(z.string()).default([]),
    blogger_id: z.string().optional(),
  }),
});

export const collections = { blog };
