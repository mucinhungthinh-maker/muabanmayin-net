/* bot/media.cjs — Tải + xử lý ảnh/video từ Telegram
 *  - Ảnh: xoay đúng chiều, thu về ≤1600px, JPEG 82, XÓA EXIF (GPS, model điện thoại…)
 *  - Video: nén 720p H.264 bằng ffmpeg (+faststart để phát ngay trên web), cắt 1 khung làm ảnh bìa
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const sharp = require('sharp');

const MAX_TG_DOWNLOAD = 20 * 1024 * 1024; // giới hạn Bot API: chỉ tải được file ≤ 20MB

function ffmpegPath(name = 'ffmpeg') {
  const env = process.env[name === 'ffmpeg' ? 'FFMPEG_PATH' : 'FFPROBE_PATH'];
  if (env) return env;
  const winget = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Links', `${name}.exe`);
  return fs.existsSync(winget) ? winget : name;
}

const run = (cmd, args) =>
  new Promise((resolve, reject) =>
    execFile(cmd, args, { windowsHide: true, maxBuffer: 1 << 24 }, (err, stdout, stderr) =>
      err ? reject(new Error(`${path.basename(cmd)}: ${String(stderr || err.message).slice(-400)}`)) : resolve(stdout)
    )
  );

async function download(telegram, fileId, dest) {
  const link = await telegram.getFileLink(fileId);
  const res = await fetch(link.href);
  if (!res.ok) throw new Error(`Tải file Telegram lỗi ${res.status}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return dest;
}

/** Ảnh → JPEG sạch metadata. Trả { file, width, height } */
async function processImage(src, dest) {
  const info = await sharp(src)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(dest); // sharp mặc định KHÔNG giữ EXIF → mất GPS
  return { file: dest, width: info.width, height: info.height };
}

/** Video → MP4 720p + ảnh bìa. Trả { file, poster } */
async function processVideo(src, dest, posterDest) {
  await run(ffmpegPath(), [
    '-y', '-i', src,
    '-vf', "scale='min(1280,iw)':-2",
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '96k',
    '-movflags', '+faststart',
    dest,
  ]);
  await run(ffmpegPath(), ['-y', '-ss', '1', '-i', dest, '-frames:v', '1', '-vf', "scale='min(1280,iw)':-2", '-q:v', '3', posterDest]).catch(() =>
    run(ffmpegPath(), ['-y', '-i', dest, '-frames:v', '1', '-q:v', '3', posterDest])
  );
  return { file: dest, poster: posterDest };
}

/** Ảnh thu nhỏ base64 để gửi AI xem (tiết kiệm token) */
async function thumbForAI(file) {
  const buf = await sharp(file).resize({ width: 1024, height: 1024, fit: 'inside' }).jpeg({ quality: 75 }).toBuffer();
  return { inlineData: { data: buf.toString('base64'), mimeType: 'image/jpeg' } };
}

module.exports = { MAX_TG_DOWNLOAD, download, processImage, processVideo, thumbForAI, ffmpegPath };
