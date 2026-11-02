import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Mỗi bài: src/content/blog/<slug>/index.md (+ ảnh cùng thư mục) hoặc src/content/blog/<slug>.md
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(70),
      description: z.string().max(160),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      // sua-may-in | may-in-cu | thu-mua-may-in → quyết định trang dịch vụ mà bài link về
      category: z.enum(['sua-may-in', 'may-in-cu', 'thu-mua-may-in']).default('sua-may-in'),
      tags: z.array(z.string()).default([]),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      youtube: z.string().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { blog };
