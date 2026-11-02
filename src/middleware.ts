import { defineMiddleware } from 'astro:middleware';
import { DEFAULT_LOCALE } from '@utils/locale';
import { getCopy } from '@/copy';

/** Đưa locale + bảng chữ vào `Astro.locals` cho mọi component (web chỉ có tiếng Việt). */
export const onRequest = defineMiddleware((context, next) => {
  context.locals.locale = DEFAULT_LOCALE;
  context.locals.copy = getCopy(DEFAULT_LOCALE);
  return next();
});
