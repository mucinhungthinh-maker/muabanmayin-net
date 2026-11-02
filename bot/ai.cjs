/* bot/ai.cjs — Gemini viết bài từ ảnh + mô tả kỹ thuật của nhân viên */
'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');

const CATEGORIES = {
  'sua-may-in': 'ca sửa máy in, lỗi máy in, bảo dưỡng',
  'may-in-cu': 'máy in cũ đang bán, kinh nghiệm chọn máy cũ',
  'thu-mua-may-in': 'thu mua máy in cũ / máy hỏng / thanh lý',
};

const SYSTEM = `Bạn là biên tập viên của "Máy In Tô Ký" — chi nhánh HT Group trên đường Tô Ký, Quận 12, TP.HCM,
chuyên sửa máy in, bán máy in cũ, thu mua máy in cũ. Bạn viết bài cho website muabanmayin.net
từ ẢNH THẬT và MÔ TẢ KỸ THUẬT do kỹ thuật viên gửi.

QUY TẮC BẮT BUỘC
1. Chỉ dùng thông tin có trong mô tả hoặc nhìn thấy rõ trong ảnh. KHÔNG bịa: giá tiền, tên/địa chỉ/SĐT khách,
   số liệu, thời gian bảo hành, đánh giá khách hàng, "số 1", "rẻ nhất", "uy tín nhất".
2. Nếu không chắc model máy thì viết chung (vd "máy in laser HP") — không đoán mã model.
3. Giọng kỹ thuật viên thật: cụ thể, ngắn gọn, dễ hiểu cho người không rành kỹ thuật. Tiếng Việt có dấu chuẩn.
4. Không chép nguyên văn từ web khác. Không nhắc tên khách hàng. Nếu ảnh có giấy tờ/hóa đơn/biển số → không mô tả chi tiết đó.
5. Nhắc "chi nhánh Tô Ký, Quận 12" tự nhiên đúng 1 lần trong bài.
6. Mô tả quá ít để viết bài có giá trị (vd chỉ "sửa máy in") → đặt needMore là câu hỏi ngắn hỏi lại kỹ thuật viên.

CẤU TRÚC BÀI (Markdown, KHÔNG có H1)
- Đoạn mở đầu 2–3 câu: máy gì, gặp tình trạng gì.
- Các mục "## ..." phù hợp nội dung, thường là: Tình trạng máy · Nguyên nhân · Cách xử lý · Lưu ý khi sử dụng.
  Bài máy in cũ: Tình trạng máy · Đã kiểm tra những gì · Phù hợp với ai.  Bài thu mua: Máy nhận về · Đánh giá tình trạng.
- Dùng gạch đầu dòng cho các bước. 300–700 từ tùy lượng thông tin, không độn chữ.
- Chèn ảnh bằng ký hiệu [[ANH_n]] (n = số thứ tự ảnh, bắt đầu từ 1) vào chỗ hợp lý; KHÔNG chèn ảnh bìa.

SEO
- title: ≤ 65 ký tự, chứa model/hãng + lỗi/việc chính, tự nhiên (vd "Sửa máy in HP 1020 kẹt giấy liên tục").
- description: 120–155 ký tự, tóm tắt lỗi + cách xử lý.
- slug: không dấu, chữ thường, gạch ngang, ≤ 60 ký tự.
- tags: 2–5 tag ngắn (hãng, dòng máy, loại lỗi).

Trả về DUY NHẤT JSON:
{"needMore": null | "câu hỏi",
 "title": "", "description": "", "slug": "", "category": "sua-may-in|may-in-cu|thu-mua-may-in",
 "tags": [], "cover": <số thứ tự ảnh làm ảnh bìa>, "alts": ["alt ảnh 1", "alt ảnh 2", ...],
 "videoTitles": ["tiêu đề video 1", ...], "body": "markdown"}`;

function client() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Thiếu GEMINI_API_KEY trong .env');
  return new GoogleGenerativeAI(key).getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    systemInstruction: SYSTEM,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.6 },
  });
}

const slugify = s =>
  String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .replace(/^(.{0,60})-.*$/s, (all, head) => (all.length > 60 ? head : all)) || 'bai-viet';

function clean(out, nImages, nVideos) {
  const cut = (s, n) => (s = String(s || '').trim()).length > n ? s.slice(0, n - 1).replace(/\s\S*$/, '') + '…' : s;
  const category = CATEGORIES[out.category] ? out.category : 'sua-may-in';
  let cover = Number(out.cover) || 1;
  if (cover < 1 || cover > nImages) cover = 1;
  return {
    needMore: out.needMore ? String(out.needMore) : null,
    title: cut(out.title, 70),
    description: cut(out.description, 158),
    slug: slugify(out.slug || out.title),
    category,
    tags: (Array.isArray(out.tags) ? out.tags : []).map(String).slice(0, 5),
    cover,
    alts: Array.from({ length: nImages }, (_, i) => String(out.alts?.[i] || `${out.title} – ảnh ${i + 1}`)),
    videoTitles: Array.from({ length: nVideos }, (_, i) => String(out.videoTitles?.[i] || `${out.title} – video ${i + 1}`)),
    body: String(out.body || '').replace(/^#\s.*\n/, '').trim(),
  };
}

/**
 * @param {object} p  { description, images: [inlineData parts], nImages, nVideos, staffName, previous?, instruction? }
 */
async function writePost(p) {
  const parts = [];
  parts.push(
    `MÔ TẢ KỸ THUẬT của kỹ thuật viên ${p.staffName || ''}:\n"""${p.description || '(không có)'}"""\n\n` +
      `Có ${p.nImages} ảnh (đánh số 1..${p.nImages} theo thứ tự đính kèm) và ${p.nVideos} video` +
      (p.nVideos ? ' (ảnh cuối có thể là khung hình cắt từ video).' : '.') +
      `\nChuyên mục gợi ý: ${Object.entries(CATEGORIES).map(([k, v]) => `${k} = ${v}`).join('; ')}.`
  );
  if (p.previous && p.instruction) {
    parts.push(
      `BẢN NHÁP TRƯỚC (JSON):\n${JSON.stringify(p.previous)}\n\nYÊU CẦU SỬA CỦA QUẢN LÝ:\n"""${p.instruction}"""\n` +
        `Sửa đúng theo yêu cầu, giữ nguyên các quy tắc. Trả lại JSON đầy đủ.`
    );
  }
  parts.push(...p.images);
  const res = await client().generateContent(parts);
  const text = res.response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = JSON.parse(text.replace(/^```(json)?|```$/g, '').trim());
  }
  return clean(json, p.nImages, p.nVideos);
}

module.exports = { writePost, slugify, CATEGORIES };
