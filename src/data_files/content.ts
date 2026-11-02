// Nội dung dùng lại giữa các trang. NAP (hotline, địa chỉ…) KHÔNG để ở đây — xem site.ts.
// ⚠ Các câu cam kết (bảo hành, đến tận nơi, trả linh kiện cũ) cần anh xác nhận là đúng thực tế.
import hero from '@images/hero.jpg';
import mayInQuay from '@images/may-in-quay.jpg';
import mayInCuaSo from '@images/may-in-cua-so.jpg';
import mayInBan from '@images/may-in-ban.jpg';
import mayInCan from '@images/may-in-can.jpg';
import mayInSanGo from '@images/may-in-san-go.jpg';
import bamNut from '@images/bam-nut.jpg';
import suaMach from '@images/sua-mach.jpg';

export const images = {
  hero,
  mayInQuay,
  mayInCuaSo,
  mayInBan,
  mayInCan,
  mayInSanGo,
  bamNut,
  suaMach,
};

/** Khối "vì sao chọn" (FeaturesGeneral) — svg là tên icon trong icons.ts */
export const reasons = [
  {
    heading: 'Báo giá trước khi làm',
    content:
      'Kỹ thuật viên kiểm tra lỗi, báo giá rõ ràng. Anh chị đồng ý mới sửa — không phát sinh sau.',
    svg: 'verified',
  },
  {
    heading: 'Cửa hàng có địa chỉ thật',
    content:
      'Chi nhánh trên đường Tô Ký, Quận 12. Mang máy đến xem trực tiếp, nhận máy tận tay.',
    svg: 'mapPin',
  },
  {
    heading: 'Sửa – bán – thu mua một chỗ',
    content:
      'Máy hỏng nặng không đáng sửa có thể bán lại hoặc đổi sang máy in cũ đã kiểm tra.',
    svg: 'tools',
  },
  {
    heading: 'Thuộc HT Group',
    content:
      'Chi nhánh của hệ thống kỹ thuật máy in HT Group tại TP.HCM, có đội kỹ thuật riêng.',
    svg: 'groups',
  },
];

/** 3 dịch vụ chính — dùng cho tab trang chủ, trang dịch vụ */
export const services = [
  {
    slug: 'sua-may-in',
    href: '/dich-vu/',
    title: 'Sửa máy in',
    summary:
      'Sửa máy in laser, máy in phun, máy in đa năng các hãng HP, Canon, Brother, Epson. Kiểm tra và báo giá trước khi làm.',
    long: 'Kỹ thuật viên kiểm tra trực tiếp tại chi nhánh Tô Ký, xác định đúng linh kiện hỏng rồi mới báo giá. Lỗi thường gặp như kẹt giấy, in mờ, in sọc, báo đèn được xử lý ngay trong ngày; lỗi cần thay linh kiện sẽ báo rõ thời gian.',
    points: [
      'Kẹt giấy, kéo nhiều tờ, không kéo giấy',
      'Bản in mờ, có sọc, lem mực, bị nhòe',
      'Máy báo lỗi đèn, lỗi trên màn hình',
      'Không nhận lệnh in, mất kết nối mạng / Wi-Fi',
      'Kêu to, có tiếng lạ khi in',
    ],
    svg: 'tools',
    images: [
      { src: bamNut, alt: 'Kỹ thuật viên kiểm tra bảng điều khiển máy in văn phòng' },
      { src: suaMach, alt: 'Sửa bo mạch điện tử bằng tua vít chuyên dụng' },
    ],
  },
  {
    slug: 'may-in-cu',
    href: '/may-in-cu/',
    title: 'Bán máy in cũ',
    summary:
      'Máy in cũ đã kiểm tra, vệ sinh và in thử trước khi giao. Phù hợp gia đình, văn phòng nhỏ, cửa hàng.',
    long: 'Máy được kiểm tra số trang đã in, tình trạng trống, trục sấy, bánh xe kéo giấy; vệ sinh đường giấy và in thử nhiều trang trước khi bán. Anh chị xem máy và in thử trực tiếp tại cửa hàng.',
    points: [
      'Kiểm tra số trang đã in, trống, cụm sấy',
      'Vệ sinh, thay linh kiện hao mòn nếu cần',
      'In thử tại cửa hàng trước khi giao',
      'Cài driver và hướng dẫn sử dụng',
    ],
    svg: 'dashboard',
    images: [{ src: mayInQuay, alt: 'Máy in laser màu đa năng đặt trên kệ' }],
  },
  {
    slug: 'thu-mua-may-in',
    href: '/thu-mua-may-in/',
    title: 'Thu mua máy in cũ',
    summary:
      'Thu mua máy in cũ, máy in hỏng, máy thanh lý văn phòng. Gửi hình qua Zalo để được báo giá sơ bộ.',
    long: 'Chụp hình máy và tem ghi model gửi qua Zalo, cửa hàng báo giá sơ bộ. Sau đó xem máy thực tế và chốt giá. Nhận cả máy còn chạy, máy hỏng và máy thanh lý số lượng.',
    points: [
      'Máy in còn chạy tốt hoặc đang hỏng',
      'Máy thanh lý số lượng từ văn phòng, cửa hàng',
      'Định giá theo model, tình trạng, số trang đã in',
    ],
    svg: 'house',
    images: [{ src: mayInCuaSo, alt: 'Máy in laser HP cũ đặt cạnh cửa sổ văn phòng' }],
  },
] as const;

export const steps = [
  { title: 'Tiếp nhận', text: 'Gọi hotline, nhắn Zalo hoặc mang máy đến chi nhánh Tô Ký.' },
  { title: 'Kiểm tra & báo giá', text: 'Kỹ thuật viên kiểm tra lỗi, báo giá rõ ràng trước khi làm.' },
  { title: 'Xử lý', text: 'Chỉ sửa khi khách đồng ý giá. Linh kiện thay ra được đưa khách xem.' },
  { title: 'Bàn giao', text: 'In thử trước mặt khách, hướng dẫn sử dụng, ghi phiếu bảo hành.' },
];

// TODO: anh xác nhận giá thật — đang để "Liên hệ" để không đưa con số chưa kiểm chứng lên web.
export const prices = [
  { item: 'Kiểm tra, chẩn đoán lỗi máy in', price: 'Liên hệ', note: '' },
  { item: 'Vệ sinh, bảo dưỡng máy in laser', price: 'Liên hệ', note: '' },
  { item: 'Sửa kẹt giấy, thay bánh xe kéo giấy', price: 'Liên hệ', note: 'Tùy model' },
  { item: 'Thay bao lụa / trục sấy', price: 'Liên hệ', note: 'Tùy model' },
  { item: 'Thay trống (drum), trục từ, gạt mực', price: 'Liên hệ', note: 'Tùy model' },
  { item: 'Máy in phun: thông đầu phun, reset tràn mực', price: 'Liên hệ', note: '' },
  { item: 'Cài driver, kết nối mạng / Wi-Fi', price: 'Liên hệ', note: '' },
];

export const homeFaq = {
  subTitle: 'Những câu khách hay hỏi khi mang máy đến chi nhánh Tô Ký.',
  faqs: [
    {
      question: 'Máy in hỏng có nên sửa hay mua máy cũ khác?',
      answer:
        'Kỹ thuật viên sẽ kiểm tra và báo chi phí sửa. Nếu chi phí gần bằng giá một máy cũ cùng loại, cửa hàng nói rõ để anh chị chọn: sửa, đổi máy cũ hoặc bán lại máy hỏng.',
    },
    {
      question: 'Có cần mang máy đến cửa hàng không?',
      answer:
        'Anh chị có thể mang máy đến chi nhánh Tô Ký, Quận 12, hoặc gọi hotline để hẹn kỹ thuật viên đến tận nơi ở khu vực gần.',
    },
    {
      question: 'Bán máy in cũ cho cửa hàng cần chuẩn bị gì?',
      answer:
        'Chụp hình máy (mặt trước, tem ghi model, trang in thử nếu còn in được) và gửi qua Zalo. Cửa hàng báo giá sơ bộ, sau đó xem máy thực tế rồi chốt giá.',
    },
    {
      question: 'Máy in cũ mua ở đây có bảo hành không?',
      answer:
        'Có. Thời gian bảo hành ghi trên phiếu theo từng máy — anh chị hỏi trực tiếp khi xem máy.',
    },
    {
      question: 'Sửa máy in mất bao lâu?',
      answer:
        'Lỗi thường gặp như kẹt giấy, in mờ, vệ sinh máy thường xong trong ngày. Lỗi cần đặt linh kiện sẽ được báo thời gian cụ thể khi kiểm tra.',
    },
  ],
};
