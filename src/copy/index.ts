import type { MarketingLocale } from '@utils/locale';
import { vi } from './vi';

/** Bảng chữ hiển thị. Web chỉ có tiếng Việt. */
export type Copy = typeof vi;

const tables: Record<MarketingLocale, Copy> = { vi };

export function getCopy(locale: MarketingLocale): Copy {
  return tables[locale];
}
