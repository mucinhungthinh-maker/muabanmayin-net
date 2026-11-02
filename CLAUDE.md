# CLAUDE.md – muabanmayin.net (Astro + Tailwind)

> Khuôn chung "Web tĩnh dịch vụ máy in" — bản riêng cho muabanmayin.net. Dựng 02/11/2026.
> Chỉ web này dùng Astro; các web khác của HT Group giữ nguyên stack cũ.

## 1. Thông tin web
- **Tên miền:** muabanmayin.net (mua lại sau khi hết hạn ~1 năm — xem mục Backlink)
- **Thương hiệu:** Mua Bán Máy In Tô Ký (ngắn: Máy In Tô Ký) — **chi nhánh Tô Ký, Quận 12**
- **Chủ đề:** sửa máy in, bán máy in cũ, thu mua máy in cũ
- **Khu vực:** Quận 12 (trọng tâm), Hóc Môn, Gò Vấp
- **Hotline/Zalo:** 0931 867 301
- **Địa chỉ:** Đường Tô Ký, Quận 12 — **TODO số nhà**
- **Giờ làm việc / Google Maps / YouTube / TikTok / Facebook:** TODO
- **Màu:** #0B5ED7 (chính) · #F59E0B (nhấn — chữ trên nền nhấn dùng màu tối để đủ tương phản)
- **Chủ quản:** HT Group
→ Tất cả nằm ở `src/data/site.ts`. Không viết cứng ở nơi khác.

## 2. Từ khóa
- Chính: sửa máy in quận 12, máy in cũ quận 12, thu mua máy in cũ
- Phụ: mua bán máy in cũ, bán máy in cũ, máy in laser cũ, máy in kẹt giấy, thu mua máy in hỏng
- ⚠ Theo `D:/AUTOMATION/projects/phan-vung-keyword-2026-07.md`, sửa máy in local theo quận/phường là vùng của tinhocnamphong.
  Web này chỉ nhắm **Quận 12 / Tô Ký** (địa chỉ thật của chi nhánh) — KHÔNG làm trang landing cho quận khác.

## 3–4. Công nghệ & cấu trúc
Astro 7 (static) + Tailwind 4 (`@tailwindcss/vite`, typography) + `@astrojs/sitemap`.
```
src/data/site.ts        NAP, màu, mạng xã hội (1 nguồn duy nhất)
src/data/content.ts     dịch vụ, bảng giá (TODO giá thật), quy trình, FAQ
src/lib/schema.ts       FAQPage, BreadcrumbList   ·  LocalBusiness ở BaseLayout
src/components/         Header Footer Hero ServiceCard PriceTable FAQ ContactBlock FloatingContact Breadcrumb CTA PostCard YouTube
src/layouts/            BaseLayout (SEO head + schema), PostLayout (Article + Breadcrumb + bài liên quan + link dịch vụ)
src/pages/              index dich-vu may-in-cu thu-mua-may-in bang-gia gioi-thieu lien-he blog/ 404
src/content/blog/<slug>/index.md   bài viết (+ ảnh cùng thư mục, dùng ./anh.jpg → Astro tự xuất WebP)
data/redirects.json     URL cũ của domain → URL mới (astro.config đọc, sinh trang chuyển hướng)
tools/wayback-urls.cjs  lấy URL cũ từ archive.org → data/redirects.suggest.json
tools/og.mjs            sinh public/og-default.png (tạm)
bot/                    bot Telegram — CHƯA dùng, sẽ viết lại sau khi web chạy ổn (ghi .md vào src/content/blog)
```

## 7. Frontmatter bài viết
```yaml
title: ""            # ≤ 70
description: ""      # ≤ 160 (khuyến nghị ≤ 155)
pubDate: 2026-11-02
updatedDate:
category: sua-may-in # sua-may-in | may-in-cu | thu-mua-may-in → quyết định link về trang dịch vụ nào
tags: []
cover: ./anh-bia.jpg
coverAlt: ""
youtube: ""          # id video
draft: false
```
Quy tắc nội dung: giọng kỹ thuật viên thật, không bịa số liệu/đánh giá, không chép từ web HT Group khác.

## 9. Deploy
- Repo: `mucinhungthinh-maker/muabanmayin-net` (tài khoản GitHub mucinhungthinh-maker, email vivianha2000), public
- Push `main` → `.github/workflows/deploy.yml` (withastro/action + deploy-pages). Pages source = GitHub Actions.
- Git trong thư mục này dùng credential helper riêng lấy token `gh auth token -u mucinhungthinh-maker`.

### DNS (Cloudflare — KHÔNG đụng record `dashboard` đang chạy cloudflared)
- `A @` → 185.199.108.153 / .109.153 / .110.153 / .111.153 — **DNS only (mây xám)**
- `CNAME www` → `mucinhungthinh-maker.github.io` — DNS only
- Sau khi GitHub cấp cert: Settings → Pages → bật **Enforce HTTPS**, rồi khai báo Search Console + gửi sitemap-index.xml.

## Backlink tên miền cũ
archive.org đang chặn (429) từ máy này lúc dựng. Khi chạy được: `npm run wayback` → duyệt
`data/redirects.suggest.json` → chép cặp hợp lý vào `data/redirects.json` → build. URL cũ có backlink nên trỏ
về trang mới **cùng chủ đề** (không dồn hết về trang chủ).

## 10. Còn thiếu để "Xong"
- [ ] Số nhà, giờ làm việc, Google Maps (link + embed), mạng xã hội → `site.ts`
- [ ] Giá thật → `content.ts` (đang "Liên hệ")
- [ ] Xác nhận các câu cam kết trong `content.ts` (bảo hành, trả linh kiện cũ, đến tận nơi)
- [ ] Ảnh thật chi nhánh/kho máy, logo, og-default thật
- [ ] Trỏ DNS, Enforce HTTPS, Search Console
- [ ] Danh sách URL cũ (Wayback) → redirects
