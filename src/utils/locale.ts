/**
 * Web chỉ có tiếng Việt. Giữ lại module locale của theme ở dạng tối giản để
 * các component dùng chung API (`localePath`, `LOCALE_INFO`) mà không cần sửa.
 */

export const MARKETING_LOCALES = ['vi'] as const;
export type MarketingLocale = (typeof MARKETING_LOCALES)[number];

export const DEFAULT_LOCALE: MarketingLocale = 'vi';

export const LOCALE_INFO: Record<
  MarketingLocale,
  {
    label: string;
    lang: string;
    ogLocale: string;
    inLanguage: string;
    intl: string;
  }
> = {
  vi: {
    label: 'Tiếng Việt',
    lang: 'vi',
    ogLocale: 'vi_VN',
    inLanguage: 'vi-VN',
    intl: 'vi-VN',
  },
};

/** Đường dẫn trong site (giữ API cũ của theme; tiếng Việt không có tiền tố). */
export function localePath(_locale: MarketingLocale, path = '/'): string {
  if (path.startsWith('#') || /^[a-z]+:/i.test(path)) return path;
  return path.startsWith('/') ? path : `/${path}`;
}
