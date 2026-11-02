import { SITE } from '@data/constants';
import { site, sameAs } from '@data/site';
import { getCopy } from '@/copy';
import { LOCALE_INFO, type MarketingLocale } from '@utils/locale';

/**
 * Sinh toàn bộ dữ liệu <head> của một trang: title, description, OG,
 * canonical và JSON-LD. Mọi trang đều có LocalBusiness của chi nhánh;
 * thêm Article / Product / FAQPage / BreadcrumbList tùy loại trang.
 */

export type PageKind =
  | { type: 'WebPage' }
  | {
      type: 'Article';
      image: string;
      datePublished: Date;
      dateModified?: Date;
      videos?: { src: string; poster: string; title: string }[];
    }
  | { type: 'Product'; image: string };

export interface Crumb {
  name: string;
  path: string;
}

export interface PageMetadataInput {
  locale: MarketingLocale;
  pathname: string;
  /** Tiêu đề trang đầy đủ (≤ 60 ký tự). Bỏ trống ở trang chủ. */
  title?: string;
  description?: string;
  ogTitle?: string;
  kind?: PageKind;
  breadcrumbs?: Crumb[];
  faqs?: { question: string; answer: string }[];
  noindex?: boolean;
}

export interface PageMetadata {
  lang: string;
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogLocale: string;
  ogType: string;
  canonical: string;
  robots: string;
  jsonLd: Record<string, unknown>;
}

export function absoluteUrl(path: string): string {
  return path === '/' ? `${SITE.url}/` : `${SITE.url}${path}`;
}

const businessId = `${site.url}/#business`;

function localBusiness() {
  return {
    '@type': 'LocalBusiness',
    '@id': businessId,
    name: site.brand,
    description: site.tagline,
    url: `${site.url}/`,
    telephone: site.hotlineTel,
    ...(site.email ? { email: site.email } : {}),
    image: `${site.url}/og-default.jpg`,
    parentOrganization: { '@type': 'Organization', name: site.owner },
    address: {
      '@type': 'PostalAddress',
      streetAddress: [site.address.street, site.address.ward]
        .filter(Boolean)
        .join(', '),
      addressLocality: site.address.district,
      addressRegion: site.address.city,
      addressCountry: site.address.country,
    },
    openingHours: site.hours.schema,
    areaServed: site.areaServed,
    ...(site.mapsLink ? { hasMap: site.mapsLink } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function buildPageMetadata(input: PageMetadataInput): PageMetadata {
  const { locale, pathname, kind = { type: 'WebPage' } } = input;
  const copy = getCopy(locale);
  const info = LOCALE_INFO[locale];

  const title = input.title ?? copy.site.ogTitle;
  const description = input.description ?? copy.site.description;
  const ogTitle = input.ogTitle ?? title;
  const canonical = absoluteUrl(pathname);

  const graph: Record<string, unknown>[] = [localBusiness()];

  switch (kind.type) {
    case 'Article':
      graph.push({
        '@type': 'Article',
        headline: title,
        description,
        image: kind.image,
        datePublished: kind.datePublished.toISOString(),
        dateModified: (kind.dateModified ?? kind.datePublished).toISOString(),
        author: { '@type': 'Organization', name: site.brand, url: site.url },
        publisher: { '@id': businessId },
        mainEntityOfPage: canonical,
        inLanguage: info.inLanguage,
      });
      for (const v of kind.videos ?? []) {
        graph.push({
          '@type': 'VideoObject',
          name: v.title,
          description,
          thumbnailUrl: absoluteUrl(v.poster),
          contentUrl: absoluteUrl(v.src),
          uploadDate: kind.datePublished.toISOString(),
        });
      }
      break;
    case 'Product':
      graph.push({
        '@type': 'Product',
        '@id': `${canonical}#product`,
        name: title,
        description,
        image: kind.image,
        // Không khai báo offers/giá: giá theo từng máy, báo qua hotline (không bịa giá).
      });
      break;
    default:
      graph.push({
        '@type': 'WebPage',
        '@id': canonical,
        url: canonical,
        name: title,
        description,
        inLanguage: info.inLanguage,
        isPartOf: { '@type': 'WebSite', url: `${site.url}/`, name: site.brand },
      });
  }

  if (input.breadcrumbs?.length) {
    const crumbs = [{ name: 'Trang chủ', path: '/' }, ...input.breadcrumbs];
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
        item: absoluteUrl(c.path),
      })),
    });
  }

  if (input.faqs?.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: input.faqs.map(f => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    });
  }

  return {
    lang: info.lang,
    title,
    description,
    ogTitle,
    ogDescription: description,
    ogLocale: info.ogLocale,
    ogType: kind.type === 'Article' ? 'article' : 'website',
    canonical,
    robots: input.noindex
      ? 'noindex, follow'
      : 'index, follow, max-image-preview:large',
    jsonLd: { '@context': 'https://schema.org', '@graph': graph },
  };
}
