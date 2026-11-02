/* bot/setup.cjs — Cài đặt bot lần đầu: hỏi token + khóa Gemini, ghi vào .env */
'use strict';
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = path.join(__dirname, '..');
const ENV = path.join(ROOT, '.env');
if (!fs.existsSync(ENV)) fs.copyFileSync(path.join(ROOT, '.env.example'), ENV);

const get = k => ((fs.readFileSync(ENV, 'utf8').match(new RegExp(`^${k}=(.*)$`, 'm')) || [])[1] || '').trim();
function set(k, v) {
  let t = fs.readFileSync(ENV, 'utf8');
  const re = new RegExp(`^${k}=.*$`, 'm');
  t = re.test(t) ? t.replace(re, `${k}=${v}`) : `${t.replace(/\s*$/, '\n')}${k}=${v}\n`;
  fs.writeFileSync(ENV, t);
}

if (get('TELEGRAM_BOT_TOKEN') && get('GEMINI_API_KEY')) process.exit(0); // đã cài rồi → chạy bot luôn

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(r => rl.question(q, a => r(a.trim())));

(async () => {
  console.log('\n=== CÀI ĐẶT BOT ĐĂNG BÀI muabanmayin.net ===\n');
  if (!get('TELEGRAM_BOT_TOKEN')) {
    console.log('1) Vào Telegram, chat @BotFather → /newbot → đặt tên → copy TOKEN (dạng 123456:ABC...)');
    let t;
    while (!/^\d+:[\w-]{30,}$/.test((t = await ask('   Dán TOKEN rồi Enter: ')))) console.log('   Token không đúng dạng, thử lại.');
    set('TELEGRAM_BOT_TOKEN', t);
  } else console.log('1) Token bot: đã có ✓');

  if (!get('GEMINI_API_KEY')) {
    console.log('\n2) Khóa Google Gemini: dùng lại khóa của bot kỹ thuật, hoặc lấy mới ở https://aistudio.google.com/apikey');
    let k;
    while ((k = await ask('   Dán GEMINI_API_KEY rồi Enter: ')).length < 20) console.log('   Khóa quá ngắn, thử lại.');
    set('GEMINI_API_KEY', k);
  } else console.log('2) Khóa Gemini: đã có ✓');

  rl.close();
  console.log('\n✅ Đã lưu vào .env. Bot sẽ chạy ngay sau đây.\n');
  console.log('BƯỚC CUỐI (trong Telegram):');
  console.log('  a) Mở bot vừa tạo, bấm START  → anh thành QUẢN LÝ (người duyệt bài)');
  console.log('  b) Tạo nhóm cho nhân viên, thêm bot vào nhóm, cấp quyền QUẢN TRỊ VIÊN → bot tự nhận nhóm\n');
})();
