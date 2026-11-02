import { getCollection, type CollectionEntry } from 'astro:content';

/** Đường dẫn của từng loại nội dung. */
const ROUTES = { blog: '/blog', products: '/may-in-cu' } as const;

type Collection = keyof typeof ROUTES;

export function slugOf(entry: CollectionEntry<Collection>): string {
  return entry.id.replace(/\/index$/, '');
}

export function pathFor(entry: CollectionEntry<Collection>): string {
  return `${ROUTES[entry.collection]}/${slugOf(entry)}/`;
}

export async function getPosts(
  category?: CollectionEntry<'blog'>['data']['category']
) {
  const posts = await getCollection(
    'blog',
    ({ data }) => !data.draft && (!category || data.category === category)
  );
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export async function getProducts() {
  const items = await getCollection('products');
  return items.sort((a, b) => a.data.order - b.data.order);
}

/** Thời gian đọc ước tính (≈ 200 từ/phút). */
export function readTimeOf(entry: CollectionEntry<'blog'>): number {
  if (entry.data.readTime) return entry.data.readTime;
  const words = (entry.body ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
