/* tools/wayback-urls.js — Lấy danh sách URL cũ của muabanmayin.net từ Wayback Machine
 *
 * Mục đích: tên miền đã hết hạn rồi mua lại → backlink cũ đang trỏ vào các URL cũ.
 * Nếu URL cũ trả 404, backlink gần như mất giá trị. Tool này liệt kê URL cũ để
 * điền vào data/redirects.json (URL cũ → trang mới liên quan nhất), build.js sẽ tạo trang chuyển.
 *
 * Cách dùng:  node tools/wayback-urls.js
 * Kết quả:    data/wayback-urls.txt  (timestamp, mã HTTP, URL)
 *             data/redirects.suggest.json  (gợi ý map — DUYỆT TAY rồi chép sang redirects.json)
 *
 * Lưu ý: archive.org hay trả 429 nếu gọi nhiều — đợi vài phút rồi chạy lại.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const DOMAIN = 'muabanmayin.net';
const OUT = path.join(__dirname, '..', 'data');

function guess(p) {
  const s = p.toLowerCase();
  if (/thu-?mua|thanh-?ly/.test(s)) return '/thu-mua-may-in/';
  if (/sua|repair|loi|reset|ket-giay/.test(s)) return '/dich-vu/';
  if (/may-in|printer|san-pham|product|ban/.test(s)) return '/may-in-cu/';
  if (/lien-he|contact/.test(s)) return '/lien-he/';
  return '/';
}

(async () => {
  const url = `https://web.archive.org/cdx/search/cdx?url=${DOMAIN}&matchType=domain&output=json&fl=timestamp,original,statuscode,mimetype&collapse=urlkey&limit=5000`;
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (muabanmayin redirect audit)' } });
  if (!r.ok) { console.error(`archive.org trả ${r.status} — đợi vài phút rồi chạy lại.`); process.exit(1); }
  const rows = (await r.json()).slice(1);
  if (!rows.length) { console.log('Wayback không có bản lưu nào của', DOMAIN); return; }

  const lines = [];
  const suggest = {};
  for (const [ts, orig, code, mime] of rows) {
    lines.push(`${ts}\t${code}\t${orig}`);
    if (code !== '200' || !/html/.test(mime)) continue;
    let p;
    try { p = new URL(orig.startsWith('http') ? orig : 'http://' + orig).pathname; } catch { continue; }
    if (p === '/' || /\.(css|js|jpg|jpeg|png|gif|webp|svg|ico|xml|txt)$/i.test(p) || /wp-(content|includes|json|admin)/.test(p)) continue;
    suggest[decodeURIComponent(p)] = guess(p);
  }
  fs.writeFileSync(path.join(OUT, 'wayback-urls.txt'), lines.join('\n') + '\n');
  fs.writeFileSync(path.join(OUT, 'redirects.suggest.json'), JSON.stringify(suggest, null, 2));
  const years = [...new Set(rows.map((x) => x[0].slice(0, 4)))].sort();
  console.log(`✓ ${rows.length} URL lưu trữ (năm ${years[0]}–${years[years.length - 1]}), ${Object.keys(suggest).length} trang HTML gợi ý chuyển hướng.`);
  console.log('  Xem data/redirects.suggest.json → duyệt → chép vào data/redirects.json → npm run build');
})();
