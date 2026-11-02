import { getCollection, type CollectionEntry } from 'astro:content';

export async function getPosts(category?: CollectionEntry<'blog'>['data']['category']) {
  const all = await getCollection('blog', ({ data }) => !data.draft && (!category || data.category === category));
  return all.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
