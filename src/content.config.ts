// https://docs.astro.build/en/guides/content-collections/#defining-collections
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * Máy in cũ — mỗi file là 1 DÒNG MÁY đang có (laser trắng đen, đa năng…),
 * không phải 1 máy cụ thể. Trưng bày + gọi/Zalo hỏi, không giỏ hàng.
 * src/content/products/<slug>.md
 */
const productsCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/products' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(60),
      description: z.string().max(160),
      order: z.number().default(99),
      cardTitle: z.string(),
      intro: z.string(),
      image: image(),
      imageAlt: z.string(),
      suitableFor: z.array(z.object({ title: z.string(), subTitle: z.string() })),
      checks: z.array(z.object({ title: z.string(), subTitle: z.string() })),
      models: z.array(z.string()).default([]),
    }),
});

/**
 * Bài viết: src/content/blog/<slug>/index.md (+ ảnh cùng thư mục) hoặc <slug>.md
 */
const blogCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(70),
      description: z.string().max(160),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      // quyết định link về trang dịch vụ nào
      category: z
        .enum(['sua-may-in', 'may-in-cu', 'thu-mua-may-in'])
        .default('sua-may-in'),
      tags: z.array(z.string()).default([]),
      cardImage: image(),
      cardImageAlt: z.string(),
      readTime: z.number().optional(),
      youtube: z.string().optional(),
      // video tự host (bot nén bằng ffmpeg, để ở public/video/<slug>/)
      videos: z
        .array(z.object({ src: z.string(), poster: z.string(), title: z.string() }))
        .default([]),
      author: z.string().optional(), // tên nhân viên gửi bài (nội bộ, không hiển thị)
      draft: z.boolean().default(false),
    }),
});

export const collections = {
  products: productsCollection,
  blog: blogCollection,
};
