/* bot/bot.js — Bot Telegram đăng bài lên muabanmayin.net
 *
 * Cách gửi bài (trong chat riêng với bot):
 *   1. Gửi ảnh / video (1 hay nhiều tấm, gửi album cũng được).
 *   2. Gửi nội dung (hoặc ghi luôn vào caption của ảnh):
 *        #sua  HP LaserJet 1020 kẹt giấy liên tục      ← dòng 1 = TIÊU ĐỀ (+ hashtag chuyên mục)
 *        Khách ở Bình Tân mang máy tới, kéo giấy…      ← các dòng sau = thân bài
 *        - Thay bánh xe kéo giấy                        ← dòng "- " thành danh sách
 *   → Bot tạo bài, build web, đẩy GitHub, trả link.
 *
 * Hashtag chuyên mục: #sua (mặc định) · #ban / #maycu · #thumua
 * Lệnh: /start (hướng dẫn + chat id) · /huy (bỏ ảnh đang chờ) · /ds (10 bài mới) · /xoa <slug> (ẩn bài)
 *
 * Không dùng dependency ngoài — Node 18+ (fetch có sẵn). Cấu hình ở ../.env
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const STATE_FILE = path.join(__dirname, 'state.json');

// ---- .env tối giản ----
const env = {};
const envFile = path.join(ROOT, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2];
  }
}
const TOKEN = env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED = (env.ALLOWED_CHAT_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
const AUTO_PUSH = (env.AUTO_PUSH ?? '1') !== '0';
if (!TOKEN) { console.error('Thiếu TELEGRAM_BOT_TOKEN trong .env'); process.exit(1); }

const API = `https://api.telegram.org/bot${TOKEN}`;
const tg = async (method, body) => {
  const r = await fetch(`${API}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!j.ok) throw new Error(`${method}: ${j.description}`);
  return j.result;
};
const say = (chat_id, text) => tg('sendMessage', { chat_id, text, disable_web_page_preview: true }).catch((e) => console.error(e.message));
const log = (...a) => console.log(new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }), ...a);

// ---- trạng thái: offset + ảnh đang chờ theo chat ----
let state = { offset: 0, pending: {} };
try { state = { ...state, ...JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) }; } catch {}
const saveState = () => fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

const slugify = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase()
  .replace(/#\S+/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  .replace(/^(.{0,70})-.*$/s, (all, head) => (all.length > 70 ? head : all)) || 'bai-viet'; // tối đa 70 ký tự, cắt ở ranh giới từ

function parseText(text) {
  const tags = (text.match(/#[\p{L}\d_]+/gu) || []).map((t) => t.slice(1).toLowerCase());
  let category = 'sua-may-in';
  if (tags.some((t) => ['ban', 'maycu', 'banmay', 'maycu'].includes(t))) category = 'may-in-cu';
  if (tags.some((t) => ['thumua', 'mua', 'thanhly'].includes(t))) category = 'thu-mua-may-in';
  const lines = text.replace(/#[\p{L}\d_]+/gu, '').split('\n');
  const title = lines.shift().replace(/\s+/g, ' ').trim();
  return { title, category, body: lines.join('\n').trim() };
}

async function download(fileId, dest) {
  const f = await tg('getFile', { file_id: fileId }); // Telegram bot chỉ tải được file ≤ 20MB
  const r = await fetch(`https://api.telegram.org/file/bot${TOKEN}/${f.file_path}`);
  if (!r.ok) throw new Error('Tải file lỗi ' + r.status);
  fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
  return path.extname(f.file_path) || '';
}

// Lấy media trong 1 message → {type, file_id, w, h}
function mediaOf(msg) {
  if (msg.photo) { const p = msg.photo[msg.photo.length - 1]; return { type: 'image', file_id: p.file_id, width: p.width, height: p.height }; }
  if (msg.video) return { type: 'video', file_id: msg.video.file_id, size: msg.video.file_size };
  const d = msg.document;
  if (d && /^image\//.test(d.mime_type)) return { type: 'image', file_id: d.file_id };
  if (d && /^video\//.test(d.mime_type)) return { type: 'video', file_id: d.file_id, size: d.file_size };
  return null;
}

let queue = Promise.resolve(); // chạy tuần tự để không 2 bài build/push cùng lúc
const enqueue = (fn) => (queue = queue.then(fn).catch((e) => log('LỖI', e.message)));

async function createPost(chatId, text) {
  const pend = state.pending[chatId] || [];
  if (!pend.length) return say(chatId, 'Chưa có ảnh/video nào. Gửi ảnh trước, rồi gửi nội dung (dòng đầu là tiêu đề).');
  const { title, category, body } = parseText(text);
  if (title.length < 10) return say(chatId, 'Tiêu đề quá ngắn — dòng đầu nên ghi rõ máy + lỗi, vd: "HP 1020 kẹt giấy liên tục".');

  const day = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }); // YYYY-MM-DD
  let slug = slugify(title);
  if (fs.existsSync(path.join(POSTS_DIR, slug))) slug += '-' + day.replace(/-/g, '');
  const dir = path.join(POSTS_DIR, slug);
  fs.mkdirSync(dir, { recursive: true });

  await say(chatId, `⏳ Đang tạo bài "${title}" (${pend.length} file)…`);
  const media = [];
  let i = 0;
  for (const m of pend) {
    i++;
    if (m.type === 'video' && m.size > 20 * 1024 * 1024) { await say(chatId, `⚠ Video ${i} > 20MB, Telegram không cho bot tải — bỏ qua. Nén video nhỏ lại rồi gửi.`); continue; }
    const base = `${slug.slice(0, 50)}-${i}`;
    const ext = await download(m.file_id, path.join(dir, base + '.tmp'));
    const file = base + (ext || (m.type === 'video' ? '.mp4' : '.jpg'));
    fs.renameSync(path.join(dir, base + '.tmp'), path.join(dir, file));
    media.push({ type: m.type, file, ...(m.width ? { width: m.width, height: m.height } : {}), alt: `${title} – ${m.type === 'video' ? 'video' : 'ảnh'} ${i}` });
  }
  const post = { title, category, date: new Date().toISOString(), body, media, source: 'telegram' };
  fs.writeFileSync(path.join(dir, 'post.json'), JSON.stringify(post, null, 2));
  state.pending[chatId] = [];
  saveState();
  log('Bài mới', slug);

  const url = `https://muabanmayin.net/${category}/${slug}/`;
  if (!AUTO_PUSH) return say(chatId, `✅ Đã lưu bài (chưa đẩy web). Chạy DAY-WEB.bat để đăng.\n${url}`);
  try {
    publish(`Bài mới: ${title}`);
    await say(chatId, `✅ Đã đăng (web cập nhật sau 1–2 phút):\n${url}\n\nSlug: ${slug}  ·  ẩn bài: /xoa ${slug}`);
  } catch (e) {
    await say(chatId, `⚠ Đã lưu bài nhưng đẩy web lỗi: ${e.message.slice(0, 300)}`);
  }
}

function publish(message) {
  const run = (cmd, args) => execFileSync(cmd, args, { cwd: ROOT, stdio: 'pipe', encoding: 'utf8' });
  run(process.execPath, ['build.js']);
  run('git', ['add', '-A']);
  if (!run('git', ['status', '--porcelain']).trim()) return;
  run('git', ['commit', '-m', message]);
  run('git', ['push']);
}

const pendingTimers = {};
async function onMessage(msg) {
  const chatId = String(msg.chat.id);
  const text = (msg.text || msg.caption || '').trim();

  if (text === '/start' || text.startsWith('/start ')) {
    return say(chatId, `Chat id của anh: ${chatId}\n\nCách đăng bài:\n1) Gửi ảnh/video\n2) Gửi nội dung: dòng đầu = tiêu đề (vd "#sua HP 1020 kẹt giấy"), các dòng sau = mô tả\n\nChuyên mục: #sua · #ban (máy in cũ) · #thumua\nLệnh: /huy /ds /xoa <slug>`);
  }
  if (!ALLOWED.includes(chatId)) return say(chatId, `Bot chưa cho phép chat này. Thêm ${chatId} vào ALLOWED_CHAT_IDS trong .env rồi chạy lại bot.`);

  if (text === '/huy') { state.pending[chatId] = []; saveState(); return say(chatId, 'Đã bỏ các ảnh/video đang chờ.'); }
  if (text === '/ds') {
    const list = fs.existsSync(POSTS_DIR) ? fs.readdirSync(POSTS_DIR).map((s) => {
      try { return { s, ...JSON.parse(fs.readFileSync(path.join(POSTS_DIR, s, 'post.json'), 'utf8')) }; } catch { return null; }
    }).filter(Boolean).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10) : [];
    return say(chatId, list.length ? list.map((p) => `${p.hidden ? '🚫' : '•'} ${p.title}\n   ${p.s}`).join('\n') : 'Chưa có bài.');
  }
  if (text.startsWith('/xoa')) {
    const slug = text.split(/\s+/)[1];
    const f = slug && path.join(POSTS_DIR, path.basename(slug), 'post.json');
    if (!f || !fs.existsSync(f)) return say(chatId, 'Không thấy bài. Dùng /ds để xem slug.');
    const p = JSON.parse(fs.readFileSync(f, 'utf8')); p.hidden = true; fs.writeFileSync(f, JSON.stringify(p, null, 2));
    return enqueue(async () => { try { if (AUTO_PUSH) publish(`Ẩn bài: ${slug}`); await say(chatId, `Đã ẩn bài ${slug}.`); } catch (e) { await say(chatId, 'Lỗi: ' + e.message.slice(0, 300)); } });
  }

  const m = mediaOf(msg);
  if (m) {
    (state.pending[chatId] ||= []).push(m);
    saveState();
    // Album: Telegram gửi từng tấm riêng, caption nằm ở 1 tấm → đợi 4s cho đủ tấm rồi mới tạo bài
    if (text) state.pending[chatId + ':caption'] = text;
    clearTimeout(pendingTimers[chatId]);
    pendingTimers[chatId] = setTimeout(() => {
      const cap = state.pending[chatId + ':caption'];
      delete state.pending[chatId + ':caption'];
      if (cap) enqueue(() => createPost(chatId, cap));
      else say(chatId, `📎 Đang giữ ${state.pending[chatId].length} file. Gửi nội dung (dòng đầu là tiêu đề) để tạo bài, hoặc /huy.`);
    }, 4000);
    return;
  }
  if (text && !text.startsWith('/')) return enqueue(() => createPost(chatId, text));
}

async function loop() {
  log('Bot muabanmayin.net đang chạy. Tự đẩy web:', AUTO_PUSH ? 'BẬT' : 'TẮT');
  for (;;) {
    try {
      const updates = await tg('getUpdates', { offset: state.offset, timeout: 50, allowed_updates: ['message'] });
      for (const u of updates) {
        state.offset = u.update_id + 1;
        if (u.message) await onMessage(u.message).catch((e) => log('LỖI xử lý', e.message));
      }
      if (updates.length) saveState();
    } catch (e) {
      log('Mất kết nối Telegram:', e.message);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}
loop();
