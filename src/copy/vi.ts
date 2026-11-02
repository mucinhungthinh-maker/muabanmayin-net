/**
 * Chữ giao diện (nút, menu, nhãn) bằng tiếng Việt.
 * Nội dung trang (dịch vụ, bảng giá, FAQ…) nằm ở `@data/content`.
 */
export const vi = {
  site: {
    description:
      'Sửa máy in, bán máy in cũ đã kiểm tra, thu mua máy in cũ tại đường Tô Ký, Quận 12. Báo giá trước khi làm.',
    ogTitle: 'Máy In Tô Ký – Sửa chữa, mua bán, thu mua máy in Quận 12',
  },

  layout: {
    skipToContent: 'Bỏ qua menu',
    toggleNavigation: 'Mở/đóng menu',
    darkTheme: 'Bật giao diện tối',
    lightTheme: 'Bật giao diện sáng',
    toggleTheme: 'Đổi giao diện sáng/tối',
  },

  nav: {
    labels: {
      services: 'Dịch vụ',
      products: 'Máy in cũ',
      buyback: 'Thu mua',
      prices: 'Bảng giá',
      blog: 'Kinh nghiệm',
      contact: 'Liên hệ',
    },
    call: 'Gọi',
    footer: {
      sectionTitles: {
        services: 'Dịch vụ',
        company: 'Chi nhánh',
      },
      links: {
        repair: 'Sửa máy in',
        usedPrinters: 'Máy in cũ',
        buyback: 'Thu mua máy in',
        prices: 'Bảng giá',
        about: 'Giới thiệu',
        blog: 'Kinh nghiệm',
        contact: 'Liên hệ',
      },
      contactTitle: 'Liên hệ',
      address: 'Địa chỉ',
      hours: 'Giờ làm việc',
      memberOf: 'Thuộc',
    },
  },

  contact: {
    call: 'Gọi',
    zalo: 'Nhắn Zalo',
    chatZalo: 'Chat Zalo',
    directions: 'Chỉ đường Google Maps',
  },

  share: {
    share: 'Chia sẻ',
    shareOn: (platform: string) => `Chia sẻ lên ${platform}`,
    copied: 'Đã chép',
    copyLink: 'Chép link',
  },

  blog: {
    readMore: 'Đọc tiếp',
    minRead: (minutes: number) => `${minutes} phút đọc`,
    relatedArticles: 'Bài liên quan',
    ogSection: 'Kinh nghiệm',
  },

  products: {
    ogSection: 'Máy in cũ',
    tabs: 'Thông tin máy',
  },

  notFound: {
    title: 'Không tìm thấy trang',
    subTitle: 'Trang này đã chuyển hoặc không còn tồn tại.',
    content: 'Anh chị quay về trang chủ hoặc gọi hotline để được hỗ trợ ngay.',
    goHome: 'Về trang chủ',
    goBack: 'Quay lại',
  },
};
