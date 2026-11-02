/* bot/bot.cjs — Bot Telegram đăng bài lên muabanmayin.net
 *
 * LUỒNG
 *  1. Nhân viên (trong nhóm STAFF_GROUP_ID) gửi ảnh/video + mô tả kỹ thuật (caption hoặc tin nhắn ngay sau).
 *  2. Bot xử lý ảnh (xóa EXIF/GPS), nén video (ffmpeg), Gemini nhìn ảnh + đọc mô tả → viết bài.
 *  3. Bản nháp gửi riêng cho quản lý (ADMIN_IDS) với nút ✅ Đăng · ✏️ Sửa · 🔄 Viết lại · ❌ Hủy.
 *  4. ✅ Đăng → ghi src/content/blog/<slug>/ → build thử → git push → GitHub Actions deploy (~1–2 phút).
 *
 * LỆNH: /start /id (xem chat id, user id) /huy (bỏ ảnh đang gom) /ds (10 bài mới, quản lý) /an <slug> (ẩn bài, quản lý)
 * Chạy: START-BOT.bat   ·   Cấu hình: ../.env (xem .env.example)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { Telegraf, Markup } = require('telegraf');

const ROOT = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'src', 'content', 'blog');
const VIDEO_DIR = path.join(ROOT, 'public', 'video');
const DRAFTS = path.join(__dirname, 'drafts');
const STATE_FILE = path.join(__dirname, 'state.json');
const SITE = 'https://muabanmayin.net';

// ---------- .env ----------
for (const line of (fs.existsSync(path.join(ROOT, '.env')) ? fs.readFileSync(path.join(ROOT, '.env'), 'utf8') : '').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { download, processImage, processVideo, thumbForAI, MAX_TG_DOWNLOAD } = require('./media.cjs');
const { writePost } = require('./ai.cjs');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const STAFF_GROUP_ID = String(process.env.STAFF_GROUP_ID || '');
const ADMIN_IDS = String(process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const AUTO_PUSH = (process.env.AUTO_PUSH ?? '1') !== '0';
if (!TOKEN && require.main === module) {
  console.error('Thiếu TELEGRAM_BOT_TOKEN trong .env');
  process.exit(1);
}

const log = (...a) => console.log(new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }), ...a);
const isAdmin = id => ADMIN_IDS.includes(String(id));
const allowedChat = ctx =>
  (STAFF_GROUP_ID && String(ctx.chat.id) === STAFF_GROUP_ID) || (ctx.chat.type === 'private' && isAdmin(ctx.from.id));
const staffName = from => [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || String(from.id);

// ---------- trạng thái (nháp lưu đĩa → tắt bot không mất) ----------
let state = { editing: {} };
try { state = { ...state, ...JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) }; } catch {}
const saveState = () => fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
const draftDir = id => path.join(DRAFTS, id);
const loadDraft = id => { try { return JSON.parse(fs.readFileSync(path.join(draftDir(id), 'draft.json'), 'utf8')); } catch { return null; } };
const saveDraft = d => fs.writeFileSync(path.join(draftDir(d.id), 'draft.json'), JSON.stringify(d, null, 2));

// Chạy tuần tự (xử lý video/AI/git) để không giẫm chân nhau
let queue = Promise.resolve();
const enqueue = fn => (queue = queue.then(fn).catch(e => log('LỖI', e.stack || e.message)));

const run = (cmd, args, opts = {}) =>
  new Promise((resolve, reject) =>
    execFile(cmd, args, { cwd: ROOT, windowsHide: true, maxBuffer: 1 << 25, ...opts }, (err, stdout, stderr) =>
      err ? reject(new Error(String(stderr || stdout || err.message).slice(-800))) : resolve(stdout)
    )
  );

const bot = new Telegraf(TOKEN || 'test:token', { handlerTimeout: 15 * 60 * 1000 });

// ======================= GOM ẢNH / VIDEO =======================
const collecting = new Map(); // key chatId:userId → { media:[], text:[], from, chatId, timer, prompted }

function mediaOf(msg) {
  if (msg.photo) {
    const p = msg.photo[msg.photo.length - 1];
    return { type: 'image', fileId: p.file_id, size: p.file_size };
  }
  if (msg.video) return { type: 'video', fileId: msg.video.file_id, size: msg.video.file_size };
  const d = msg.document;
  if (d && /^image\//.test(d.mime_type)) return { type: 'image', fileId: d.file_id, size: d.file_size };
  if (d && /^video\//.test(d.mime_type)) return { type: 'video', fileId: d.file_id, size: d.file_size };
  return null;
}

function schedule(ctx, key, ms) {
  const c = collecting.get(key);
  clearTimeout(c.timer);
  c.timer = setTimeout(() => {
    if (!c.text.length) {
      if (!c.prompted) {
        c.prompted = true;
        ctx.telegram.sendMessage(c.chatId,
          `📎 ${staffName(c.from)}: đã nhận ${c.media.length} ảnh/video.\nGửi tiếp MÔ TẢ KỸ THUẬT: máy gì, lỗi/tình trạng gì, đã xử lý thế nào, thay linh kiện gì.`,
          { reply_to_message_id: c.lastMsgId }).catch(() => {});
      }
      return;
    }
    collecting.delete(key);
    enqueue(() => createDraft(ctx.telegram, c));
  }, ms);
}

bot.on(['photo', 'video', 'document'], ctx => {
  if (!allowedChat(ctx)) return;
  const m = mediaOf(ctx.message);
  if (!m) return;
  const key = `${ctx.chat.id}:${ctx.from.id}`;
  if (!collecting.has(key)) collecting.set(key, { media: [], text: [], from: ctx.from, chatId: ctx.chat.id, startedAt: Date.now() });
  const c = collecting.get(key);
  c.media.push(m);
  c.lastMsgId = ctx.message.message_id;
  if (ctx.message.caption) c.text.push(ctx.message.caption);
  schedule(ctx, key, 6000); // album đến từng tấm → đợi đủ rồi mới xử lý
});

// ======================= LỆNH =======================
bot.start(ctx =>
  ctx.reply(
    'Bot đăng bài muabanmayin.net\n\n' +
      'CÁCH GỬI BÀI (trong nhóm nhân viên):\n' +
      '1) Gửi ảnh / video ca sửa, máy cũ, máy thu mua (gửi 1 lần nhiều tấm được)\n' +
      '2) Ghi mô tả kỹ thuật ở chú thích hoặc tin nhắn ngay sau:\n' +
      '   • Máy gì (hãng, model nếu biết)\n   • Tình trạng / lỗi khách báo\n   • Nguyên nhân, cách xử lý, linh kiện thay\n' +
      '3) AI viết bài → quản lý duyệt → lên web.\n\n' +
      '⚠ Không chụp mặt khách, hóa đơn, địa chỉ, SĐT khách.\nVideo ≤ 20MB (quay ngắn 30–60 giây).\n\n' +
      'Lệnh: /huy (bỏ ảnh đang gửi dở) · /id'
  )
);

bot.command('id', ctx => ctx.reply(`chat id: ${ctx.chat.id}\nuser id của bạn: ${ctx.from.id}`));

bot.command('huy', ctx => {
  const key = `${ctx.chat.id}:${ctx.from.id}`;
  const c = collecting.get(key);
  if (c) clearTimeout(c.timer);
  collecting.delete(key);
  ctx.reply('Đã bỏ ảnh/video đang gom.');
});

bot.command('ds', ctx => {
  if (!isAdmin(ctx.from.id)) return;
  const posts = fs.readdirSync(BLOG_DIR).map(slug => {
    try {
      const md = fs.readFileSync(path.join(BLOG_DIR, slug, 'index.md'), 'utf8');
      return { slug, date: (md.match(/^pubDate:\s*(.+)$/m) || [])[1] || '', hidden: /^draft:\s*true/m.test(md) };
    } catch { return null; }
  }).filter(Boolean).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  ctx.reply(posts.map(p => `${p.hidden ? '🚫' : '•'} ${p.date.slice(0, 10)} ${p.slug}`).join('\n') || 'Chưa có bài.');
});

bot.command('an', ctx => {
  if (!isAdmin(ctx.from.id)) return;
  const slug = path.basename(ctx.message.text.split(/\s+/)[1] || '');
  const f = path.join(BLOG_DIR, slug, 'index.md');
  if (!slug || !fs.existsSync(f)) return ctx.reply('Không thấy bài. Dùng /ds để xem slug.');
  enqueue(async () => {
    const md = fs.readFileSync(f, 'utf8');
    fs.writeFileSync(f, /^draft:/m.test(md) ? md.replace(/^draft:.*$/m, 'draft: true') : md.replace(/^---\n/, '---\ndraft: true\n'));
    try {
      await gitPublish(`Ẩn bài: ${slug}`);
      await ctx.reply(`🚫 Đã ẩn bài ${slug} (web cập nhật sau 1–2 phút).`);
    } catch (e) {
      await ctx.reply('Lỗi khi đẩy web: ' + e.message.slice(0, 300));
    }
  });
});

// ======================= TIN NHẮN CHỮ =======================
bot.on('text', ctx => {
  const text = ctx.message.text.trim();
  if (text.startsWith('/')) return;

  // Quản lý đang nhắn yêu cầu sửa bản nháp
  const editingId = ctx.chat.type === 'private' && state.editing[ctx.from.id];
  if (editingId) {
    delete state.editing[ctx.from.id];
    saveState();
    return enqueue(() => reviseDraft(ctx.telegram, editingId, text, ctx.chat.id));
  }

  if (!allowedChat(ctx)) return;
  const key = `${ctx.chat.id}:${ctx.from.id}`;
  const c = collecting.get(key);
  if (!c) return; // chat thường trong nhóm, không có ảnh đang gom → bỏ qua
  c.text.push(text);
  c.lastMsgId = ctx.message.message_id;
  schedule(ctx, key, 3000); // nhân viên có thể gõ mô tả thành nhiều tin
});

// ======================= TẠO BẢN NHÁP =======================
async function createDraft(telegram, c) {
  const id = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) + '-' + String(c.from.id).slice(-4);
  const dir = draftDir(id);
  fs.mkdirSync(path.join(dir, 'raw'), { recursive: true });
  const status = await telegram.sendMessage(c.chatId, `⏳ Đang xử lý ${c.media.length} file và viết bài…`, { reply_to_message_id: c.lastMsgId }).catch(() => null);
  const say = t => telegram.sendMessage(c.chatId, t, { reply_to_message_id: c.lastMsgId }).catch(() => {});

  try {
    const images = [];
    const videos = [];
    let i = 0;
    for (const m of c.media) {
      i++;
      if (m.size && m.size > MAX_TG_DOWNLOAD) {
        await say(`⚠ File ${i} lớn hơn 20MB, Telegram không cho bot tải — bỏ qua. Quay video ngắn lại (30–60 giây) rồi gửi lại nếu cần.`);
        continue;
      }
      const raw = await download(telegram, m.fileId, path.join(dir, 'raw', `f${i}`));
      if (m.type === 'image') {
        const n = images.length + 1;
        const out = await processImage(raw, path.join(dir, `img-${n}.jpg`));
        images.push({ file: path.basename(out.file) });
      } else {
        const n = videos.length + 1;
        await processVideo(raw, path.join(dir, `video-${n}.mp4`), path.join(dir, `poster-${n}.jpg`));
        videos.push({ file: `video-${n}.mp4`, poster: `poster-${n}.jpg` });
      }
    }
    fs.rmSync(path.join(dir, 'raw'), { recursive: true, force: true });
    if (!images.length && !videos.length) throw new Error('Không có ảnh/video nào dùng được.');

    const draft = {
      id,
      createdAt: new Date().toISOString(),
      staff: { id: c.from.id, name: staffName(c.from) },
      chatId: c.chatId,
      replyTo: c.lastMsgId,
      description: c.text.join('\n'),
      images,
      videos,
    };
    draft.post = await askAI(draft);
    if (draft.post.needMore) {
      saveDraft(draft);
      await say(`❓ AI cần thêm thông tin để viết bài:\n${draft.post.needMore}\n\nGửi lại ảnh kèm mô tả đầy đủ hơn nhé.`);
      fs.rmSync(dir, { recursive: true, force: true });
      return;
    }
    saveDraft(draft);
    await sendReview(telegram, draft);
    await say(`✅ Đã viết xong bài "${draft.post.title}" — đang chờ quản lý duyệt.`);
  } catch (e) {
    log('createDraft lỗi', e);
    await say('❌ Lỗi khi tạo bài: ' + e.message.slice(0, 300));
    fs.rmSync(dir, { recursive: true, force: true });
  } finally {
    if (status) telegram.deleteMessage(c.chatId, status.message_id).catch(() => {});
  }
}

async function askAI(draft, previous, instruction) {
  const dir = draftDir(draft.id);
  // Ảnh cho AI xem: toàn bộ ảnh (tối đa 8) + khung hình video
  const files = [...draft.images.map(x => x.file), ...draft.videos.map(v => v.poster)].slice(0, 10);
  const parts = await Promise.all(files.map(f => thumbForAI(path.join(dir, f))));
  return writePost({
    description: draft.description,
    images: parts,
    nImages: draft.images.length || 1,
    nVideos: draft.videos.length,
    staffName: draft.staff.name,
    previous,
    instruction,
  });
}

// ======================= GỬI DUYỆT =======================
function reviewText(d) {
  const p = d.post;
  const body = p.body.replace(/\[\[ANH_(\d+)\]\]/g, '[ảnh $1]');
  const head =
    `📝 BÀI MỚI CHỜ DUYỆT — từ ${d.staff.name}\n` +
    `Chuyên mục: ${p.category} · ${d.images.length} ảnh${d.videos.length ? ` · 🎬 ${d.videos.length} video` : ''}\n` +
    `Link: ${SITE}/blog/${p.slug}/\n\n` +
    `TIÊU ĐỀ: ${p.title}\nMÔ TẢ: ${p.description}\nTAG: ${p.tags.join(', ')}\n` +
    `────────────\n`;
  const room = 4000 - head.length;
  return head + (body.length > room ? body.slice(0, room - 20) + '\n…(còn tiếp)' : body);
}

const reviewKeyboard = id =>
  Markup.inlineKeyboard([
    [Markup.button.callback('✅ Đăng', `ok:${id}`), Markup.button.callback('✏️ Sửa', `edit:${id}`)],
    [Markup.button.callback('🔄 Viết lại', `redo:${id}`), Markup.button.callback('❌ Hủy', `del:${id}`)],
  ]);

async function sendReview(telegram, d) {
  const dir = draftDir(d.id);
  const shots = [...d.images.map(x => x.file), ...d.videos.map(v => v.poster)].slice(0, 10);
  const targets = ADMIN_IDS.length ? ADMIN_IDS : [d.chatId];
  d.reviewMsgs = [];
  for (const chatId of targets) {
    try {
      if (shots.length > 1) {
        await telegram.sendMediaGroup(chatId, shots.map(f => ({ type: 'photo', media: { source: path.join(dir, f) } })));
      } else if (shots.length === 1) {
        await telegram.sendPhoto(chatId, { source: path.join(dir, shots[0]) });
      }
      const msg = await telegram.sendMessage(chatId, reviewText(d), { ...reviewKeyboard(d.id), link_preview_options: { is_disabled: true } });
      d.reviewMsgs.push({ chatId, messageId: msg.message_id });
    } catch (e) {
      log(`Không gửi được bản duyệt tới ${chatId} (quản lý đã /start bot riêng chưa?)`, e.message);
    }
  }
  saveDraft(d);
}

async function markReviewed(telegram, d, note) {
  for (const m of d.reviewMsgs || []) {
    await telegram.editMessageText(m.chatId, m.messageId, undefined, `${note}\n\n${d.post.title}`, { link_preview_options: { is_disabled: true } }).catch(() => {});
  }
}

async function reviseDraft(telegram, id, instruction, replyChat) {
  const d = loadDraft(id);
  if (!d) return telegram.sendMessage(replyChat, 'Bản nháp không còn.');
  await telegram.sendMessage(replyChat, '⏳ AI đang sửa theo yêu cầu…');
  try {
    d.post = await askAI(d, d.post, instruction);
    saveDraft(d);
    await markReviewed(telegram, d, '✏️ Đã gửi bản sửa mới bên dưới');
    await sendReview(telegram, d);
  } catch (e) {
    await telegram.sendMessage(replyChat, 'Lỗi khi sửa: ' + e.message.slice(0, 300));
  }
}

bot.action(/^(ok|edit|redo|del):(.+)$/, async ctx => {
  if (!isAdmin(ctx.from.id)) return ctx.answerCbQuery('Chỉ quản lý được duyệt bài.', { show_alert: true });
  const [, act, id] = ctx.match;
  const d = loadDraft(id);
  if (!d) return ctx.answerCbQuery('Bản nháp không còn (đã đăng hoặc hủy).', { show_alert: true });
  await ctx.answerCbQuery();

  if (act === 'del') {
    await markReviewed(ctx.telegram, d, `❌ Đã hủy bởi ${staffName(ctx.from)}`);
    fs.rmSync(draftDir(id), { recursive: true, force: true });
    return;
  }
  if (act === 'edit') {
    state.editing[ctx.from.id] = id;
    saveState();
    return ctx.telegram.sendMessage(ctx.from.id, '✏️ Nhắn yêu cầu sửa (vd: "đổi tiêu đề thành…", "bỏ đoạn lưu ý", "máy là Canon 2900 không phải HP").');
  }
  if (act === 'redo') {
    return enqueue(async () => {
      await ctx.telegram.sendMessage(ctx.from.id, '⏳ Đang viết lại…');
      d.post = await askAI(d);
      saveDraft(d);
      await markReviewed(ctx.telegram, d, '🔄 Đã viết lại — bản mới bên dưới');
      await sendReview(ctx.telegram, d);
    });
  }
  if (act === 'ok') {
    await markReviewed(ctx.telegram, d, `⏳ Đang đăng… (${staffName(ctx.from)} duyệt)`);
    return enqueue(() => publish(ctx.telegram, d, ctx.from));
  }
});

// ======================= ĐĂNG BÀI =======================
const yamlStr = s => JSON.stringify(String(s)); // chuỗi JSON là YAML hợp lệ

function buildMarkdown(d, slug) {
  const p = d.post;
  const coverIdx = d.images.length ? p.cover : 0;
  const used = new Set([coverIdx]);
  let body = p.body.replace(/\[\[ANH_(\d+)\]\]/g, (_, n) => {
    n = Number(n);
    if (!d.images[n - 1] || used.has(n)) return '';
    used.add(n);
    return `![${p.alts[n - 1].replace(/[\[\]]/g, '')}](./img-${n}.jpg)`;
  });
  const rest = d.images.map((_, i) => i + 1).filter(n => !used.has(n));
  if (rest.length) {
    body += '\n\n## Hình ảnh thực tế\n\n' + rest.map(n => `![${p.alts[n - 1].replace(/[\[\]]/g, '')}](./img-${n}.jpg)`).join('\n\n');
  }
  const cover = d.images.length ? `./img-${coverIdx}.jpg` : './cover.jpg';
  const coverAlt = d.images.length ? p.alts[coverIdx - 1] : p.videoTitles[0];
  const videos = d.videos.map((v, i) => ({
    src: `/video/${slug}/video-${i + 1}.mp4`,
    poster: `/video/${slug}/poster-${i + 1}.jpg`,
    title: p.videoTitles[i],
  }));
  const fm = [
    '---',
    `title: ${yamlStr(p.title)}`,
    `description: ${yamlStr(p.description)}`,
    `pubDate: ${new Date().toISOString()}`,
    `category: ${yamlStr(p.category)}`,
    `tags: ${JSON.stringify(p.tags)}`,
    `cardImage: ${yamlStr(cover)}`,
    `cardImageAlt: ${yamlStr(coverAlt)}`,
    `videos: ${JSON.stringify(videos)}`,
    `author: ${yamlStr(d.staff.name)}`,
    '---',
    '',
  ];
  return fm.join('\n') + body.replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

async function gitPublish(message) {
  if (!AUTO_PUSH) return;
  await run('git', ['add', '-A', 'src/content/blog', 'public/video']);
  const st = await run('git', ['status', '--porcelain', 'src/content/blog', 'public/video']);
  if (!st.trim()) return;
  await run('git', ['commit', '-m', message, '--', 'src/content/blog', 'public/video']);
  await run('git', ['push']);
}

async function publish(telegram, d, approver) {
  const src = draftDir(d.id);
  let slug = d.post.slug;
  for (let n = 2; fs.existsSync(path.join(BLOG_DIR, slug)); n++) slug = `${d.post.slug}-${n}`;
  const postDir = path.join(BLOG_DIR, slug);
  const vidDir = path.join(VIDEO_DIR, slug);
  try {
    if (AUTO_PUSH) await run('git', ['pull', '--rebase', '--autostash']).catch(e => log('git pull lỗi (bỏ qua):', e.message));
    fs.mkdirSync(postDir, { recursive: true });
    d.images.forEach((img, i) => fs.copyFileSync(path.join(src, img.file), path.join(postDir, `img-${i + 1}.jpg`)));
    if (!d.images.length && d.videos.length) fs.copyFileSync(path.join(src, d.videos[0].poster), path.join(postDir, 'cover.jpg'));
    if (d.videos.length) {
      fs.mkdirSync(vidDir, { recursive: true });
      d.videos.forEach((v, i) => {
        fs.copyFileSync(path.join(src, v.file), path.join(vidDir, `video-${i + 1}.mp4`));
        fs.copyFileSync(path.join(src, v.poster), path.join(vidDir, `poster-${i + 1}.jpg`));
      });
    }
    fs.writeFileSync(path.join(postDir, 'index.md'), buildMarkdown(d, slug));

    // Build thử trước khi đẩy — lỗi thì gỡ bài, không làm hỏng web
    await run(process.execPath, [path.join(ROOT, 'node_modules', 'astro', 'bin', 'astro.mjs'), 'build']);
    await gitPublish(`Bài mới: ${d.post.title} (${d.staff.name}, duyệt: ${staffName(approver)})`);

    const url = `${SITE}/blog/${slug}/`;
    await markReviewed(telegram, d, `✅ Đã đăng (web cập nhật sau 1–2 phút):\n${url}`);
    await telegram.sendMessage(d.chatId, `🎉 Bài của ${d.staff.name} đã lên web:\n${url}`, { reply_to_message_id: d.replyTo }).catch(() => {});
    fs.rmSync(src, { recursive: true, force: true });
    log('Đã đăng', slug);
  } catch (e) {
    log('publish lỗi', e);
    fs.rmSync(postDir, { recursive: true, force: true });
    fs.rmSync(vidDir, { recursive: true, force: true });
    await markReviewed(telegram, d, '❌ Đăng lỗi: ' + e.message.slice(0, 500) + '\n\nBản nháp vẫn giữ — báo kỹ thuật kiểm tra.');
    await sendReview(telegram, d);
  }
}

// ======================= CHẠY =======================
if (require.main === module) {
  fs.mkdirSync(DRAFTS, { recursive: true });
  bot.catch((e, ctx) => log('Lỗi xử lý update', ctx?.updateType, e.message));
  bot.launch({ allowedUpdates: ['message', 'callback_query'] });
  log(`Bot muabanmayin.net đang chạy · nhóm NV: ${STAFF_GROUP_ID || '(chưa đặt)'} · quản lý: ${ADMIN_IDS.join(', ') || '(chưa đặt)'} · tự đẩy web: ${AUTO_PUSH ? 'BẬT' : 'TẮT'}`);
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

module.exports = { buildMarkdown, reviewText };
