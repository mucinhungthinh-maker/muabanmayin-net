// MỘT NGUỒN DUY NHẤT cho thông tin web. Không viết cứng hotline/địa chỉ/tên ở nơi khác.
export const site = {
  domain: 'muabanmayin.net',
  url: 'https://muabanmayin.net',
  brand: 'Mua Bán Máy In Tô Ký',
  shortBrand: 'Máy In Tô Ký',
  owner: 'HT Group',
  tagline: 'Sửa chữa – mua bán – thu mua máy in tại Tô Ký, Quận 12',
  topic: 'Sửa máy in, bán máy in cũ, thu mua máy in cũ',

  hotline: '0931 867 301',
  hotlineTel: '+84931867301',
  zalo: 'https://zalo.me/0931867301',
  // TODO: số nhà chính xác của chi nhánh
  address: {
    street: 'Đường Tô Ký',
    ward: '',
    district: 'Quận 12',
    city: 'TP. Hồ Chí Minh',
    country: 'VN',
  },
  areaServed: ['Quận 12', 'Hóc Môn', 'Gò Vấp', 'TP. Hồ Chí Minh'],
  // TODO: giờ mở cửa thật
  hours: { text: '7:30 – 18:00, Thứ 2 – Thứ 7', schema: ['Mo-Sa 07:30-18:00'] },
  // TODO: link Google Maps + mã nhúng của chi nhánh
  mapsLink: '',
  mapsEmbed: '',
  social: {
    youtube: '',
    tiktok: '',
    facebook: '',
  },
  youtubeIntro: '', // TODO: id video YouTube giới thiệu chi nhánh
  colors: { primary: '#0B5ED7', accent: '#F59E0B' },
  ogImage: '/og-default.png',
} as const;

export const fullAddress = [site.address.street, site.address.ward, site.address.district, site.address.city]
  .filter(Boolean)
  .join(', ');

export const nav = [
  { href: '/dich-vu/', label: 'Dịch vụ' },
  { href: '/may-in-cu/', label: 'Máy in cũ' },
  { href: '/thu-mua-may-in/', label: 'Thu mua' },
  { href: '/bang-gia/', label: 'Bảng giá' },
  { href: '/blog/', label: 'Kinh nghiệm' },
  { href: '/lien-he/', label: 'Liên hệ' },
];

export const sameAs = Object.values(site.social).filter(Boolean) as string[];
