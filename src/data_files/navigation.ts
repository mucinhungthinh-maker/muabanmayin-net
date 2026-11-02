/**
 * Menu và chân trang. Nhãn hiển thị nằm trong `copy.nav` (src/copy/vi.ts).
 */
export type NavLinkId =
  | 'services'
  | 'products'
  | 'buyback'
  | 'prices'
  | 'blog'
  | 'contact';

export const navLinks: { id: NavLinkId; path: string }[] = [
  { id: 'services', path: '/dich-vu/' },
  { id: 'products', path: '/may-in-cu/' },
  { id: 'buyback', path: '/thu-mua-may-in/' },
  { id: 'prices', path: '/bang-gia/' },
  { id: 'blog', path: '/blog/' },
  { id: 'contact', path: '/lien-he/' },
];

export type FooterSectionId = 'services' | 'company';
export type FooterLinkId =
  | 'repair'
  | 'usedPrinters'
  | 'buyback'
  | 'prices'
  | 'about'
  | 'blog'
  | 'contact';

export const footerSections: {
  id: FooterSectionId;
  links: { id: FooterLinkId; path: string }[];
}[] = [
  {
    id: 'services',
    links: [
      { id: 'repair', path: '/dich-vu/' },
      { id: 'usedPrinters', path: '/may-in-cu/' },
      { id: 'buyback', path: '/thu-mua-may-in/' },
      { id: 'prices', path: '/bang-gia/' },
    ],
  },
  {
    id: 'company',
    links: [
      { id: 'about', path: '/gioi-thieu/' },
      { id: 'blog', path: '/blog/' },
      { id: 'contact', path: '/lien-he/' },
    ],
  },
];
