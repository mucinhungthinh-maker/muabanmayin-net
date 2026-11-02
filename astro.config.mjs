// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';

// URL cũ của tên miền (trước khi hết hạn) → URL mới, để giữ backlink.
// Điền ở data/redirects.json (khóa bắt đầu bằng "_" là ghi chú).
const redirects = Object.fromEntries(
  Object.entries(JSON.parse(fs.readFileSync('./data/redirects.json', 'utf8'))).filter(([k]) => !k.startsWith('_')),
);

export default defineConfig({
  site: 'https://muabanmayin.net',
  trailingSlash: 'always',
  redirects,
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
  vite: { plugins: [tailwindcss()] },
});
