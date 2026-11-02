import ogImageSrc from '@images/hero.jpg';
import { site } from './site';

// Thông tin chi nhánh nằm ở ./site.ts — file này chỉ ánh xạ sang tên mà theme dùng.
export const SITE = {
  title: site.shortBrand,
  tagline: site.tagline,
  url: site.url,
  author: site.brand,
};

export const OG = {
  image: ogImageSrc,
};
