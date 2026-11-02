// Nội dung dùng lại giữa các trang (dịch vụ, bảng giá, FAQ, quy trình).
// NAP (hotline, địa chỉ…) KHÔNG để ở đây — xem site.ts.

export const services = [
  {
    slug: 'sua-may-in',
    href: '/dich-vu/#sua-may-in',
    title: 'Sửa máy in',
    summary: 'Sửa máy in laser, máy in phun, máy in đa năng các hãng HP, Canon, Brother, Epson.',
    errors: [
      'Kẹt giấy, kéo nhiều tờ, không kéo giấy',
      'Bản in mờ, có sọc, lem mực, bị nhòe',
      'Máy báo lỗi đèn, lỗi trên màn hình',
      'Máy không nhận lệnh in, mất kết nối mạng/Wi-Fi',
      'Kêu to, có tiếng lạ khi in',
    ],
    time: 'Lỗi thường gặp xử lý trong ngày; lỗi cần thay linh kiện báo thời gian sau khi kiểm tra.',
  },
  {
    slug: 'may-in-cu',
    href: '/may-in-cu/',
    title: 'Bán máy in cũ',
    summary: 'Máy in cũ đã kiểm tra, vệ sinh và in thử trước khi giao, phù hợp gia đình và văn phòng nhỏ.',
    errors: [
      'Kiểm tra số trang đã in, tình trạng trống, trục sấy',
      'Vệ sinh đường giấy, thay linh kiện hao mòn nếu cần',
      'In thử tại cửa hàng trước khi giao',
      'Cài đặt driver và hướng dẫn sử dụng',
    ],
    time: 'Xem máy và lấy ngay tại chi nhánh nếu còn hàng.',
  },
  {
    slug: 'thu-mua-may-in',
    href: '/thu-mua-may-in/',
    title: 'Thu mua máy in cũ',
    summary: 'Thu mua máy in cũ, máy in hỏng, máy thanh lý văn phòng. Gửi hình qua Zalo để được báo giá.',
    errors: [
      'Máy in còn chạy tốt hoặc đang hỏng',
      'Máy thanh lý số lượng từ văn phòng, cửa hàng',
      'Định giá theo model, tình trạng, số trang đã in',
    ],
    time: 'Báo giá sơ bộ qua hình ảnh; xem máy thực tế rồi chốt giá.',
  },
];

// TODO: anh xác nhận giá thật — hiện để "Liên hệ" để không đưa con số chưa kiểm chứng lên web.
export const prices = [
  { item: 'Kiểm tra, chẩn đoán lỗi máy in', price: 'Liên hệ', note: '' },
  { item: 'Vệ sinh, bảo dưỡng máy in laser', price: 'Liên hệ', note: '' },
  { item: 'Sửa lỗi kẹt giấy, thay bánh xe kéo giấy', price: 'Liên hệ', note: 'Tùy model' },
  { item: 'Thay bao lụa / trục sấy', price: 'Liên hệ', note: 'Tùy model' },
  { item: 'Thay trống (drum), trục từ, gạt mực', price: 'Liên hệ', note: 'Tùy model' },
  { item: 'Sửa máy in phun: thông đầu phun, reset tràn mực', price: 'Liên hệ', note: '' },
  { item: 'Cài driver, kết nối mạng / Wi-Fi', price: 'Liên hệ', note: '' },
];

export const steps = [
  { title: 'Tiếp nhận', text: 'Gọi hotline, nhắn Zalo hoặc mang máy đến chi nhánh Tô Ký.' },
  { title: 'Kiểm tra & báo giá', text: 'Kỹ thuật viên kiểm tra lỗi, báo giá rõ ràng trước khi làm.' },
  { title: 'Xử lý', text: 'Chỉ làm khi khách đồng ý giá. Thay linh kiện cũ được trả lại cho khách xem.' },
  { title: 'Bàn giao', text: 'In thử trước mặt khách, hướng dẫn sử dụng và ghi phiếu bảo hành.' },
];

export const reasons = [
  { title: 'Báo giá trước', text: 'Kiểm tra xong mới báo giá, khách đồng ý mới sửa.' },
  { title: 'Cửa hàng có địa chỉ', text: 'Chi nhánh trên đường Tô Ký, Quận 12 — mang máy đến xem trực tiếp.' },
  { title: 'Sửa – bán – thu mua', text: 'Máy hỏng nặng không đáng sửa có thể thu lại hoặc đổi sang máy cũ khác.' },
  { title: 'Thuộc HT Group', text: 'Hệ thống kỹ thuật máy in nhiều năm tại TP.HCM.' },
];

export const homeFaq = [
  {
    q: 'Máy in hỏng có nên sửa hay mua máy cũ khác?',
    a: 'Kỹ thuật viên sẽ kiểm tra và báo chi phí sửa. Nếu chi phí gần bằng giá một máy cũ cùng loại, chúng tôi sẽ nói rõ để anh chị chọn: sửa, đổi máy cũ hoặc bán lại máy hỏng.',
  },
  {
    q: 'Có cần mang máy đến cửa hàng không?',
    a: 'Anh chị có thể mang máy đến chi nhánh Tô Ký, Quận 12, hoặc gọi hotline để hẹn kỹ thuật viên đến tận nơi trong khu vực gần.',
  },
  {
    q: 'Bán máy in cũ cho cửa hàng cần chuẩn bị gì?',
    a: 'Chụp hình máy (mặt trước, tem model, bản in thử nếu còn in được) và gửi qua Zalo. Cửa hàng báo giá sơ bộ, sau đó xem máy thực tế rồi chốt giá.',
  },
  {
    q: 'Máy in cũ mua ở đây có bảo hành không?',
    a: 'Có. Thời gian bảo hành ghi trên phiếu theo từng máy — anh chị hỏi trực tiếp khi xem máy.',
  },
];
