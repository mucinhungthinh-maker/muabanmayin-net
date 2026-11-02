// MỘT NGUỒN DUY NHẤT cho thông tin chi nhánh. Không viết cứng hotline/địa chỉ/tên ở nơi khác.
export const site = {
  domain: 'muabanmayin.net',
  url: 'https://muabanmayin.net',
  brand: 'Mua Bán Máy In Tô Ký',
  shortBrand: 'Máy In Tô Ký',
  owner: 'HT Group',
  tagline: 'Sửa chữa – mua bán – thu mua máy in tại Tô Ký, Quận 12',

  hotline: '0931 867 301',
  hotlineTel: '+84931867301',
  zalo: 'https://zalo.me/0931867301',
  email: '', // TODO: email chi nhánh (để trống thì không hiện)
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
  // TODO: link Google Maps + link nhúng (Chia sẻ → Nhúng bản đồ → lấy src của iframe)
  mapsLink: '',
  mapsEmbed: '',
  social: {
    facebook: '',
    youtube: '',
    tiktok: '',
  },
  youtubeIntro: '', // TODO: id video YouTube giới thiệu chi nhánh
} as const;

export const fullAddress = [
  site.address.street,
  site.address.ward,
  site.address.district,
  site.address.city,
]
  .filter(Boolean)
  .join(', ');

export const sameAs = Object.values(site.social).filter(Boolean) as string[];
