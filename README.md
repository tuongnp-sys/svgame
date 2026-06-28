# Sương Mù Lịch Sử

H5 mini game gamify lịch sử Việt Nam — Phaser 3 + Vite.

## Chạy thử

```bash
npm install
npm run dev
```

Flow: **Cold open** → **Hub Map** (6 vết nứt) → chọn chương.

## Chương playable

| Ch | Mechanic |
|----|----------|
| 1 | Rhythm — Gõ Trống Đồng |
| 2 | Timing bar — Đóng cọc Bạch Đằng |
| 3 | Binary — Hội nghị Diên Hồng (ĐÁNH/HÒA) |
| 4 | Swipe — chặn quân Thanh (Tây Sơn) |
| 5 | Path draw — mở cõi + cờ biển đảo |
| 6 | Runner — tiếp tế + xe tăng 843 |

## Package GamePix

```bash
npm run package:gamepix
```

Xem `docs/GAMEPIX_INTEGRATION.md`.

Xem **`docs/I18N_MULTISCENE_PLAYBOOK.md`** và **`AGENTS.md`** — bài học song ngữ VN/EN, overlay, lifecycle (cho agent/dev tiếp quản).

## Cấu trúc

```
src/core/controllers/   — TimingBar, Rhythm, BinaryChoice
src/ui/HubMapView.js    — bản đồ sương mù + unlock
src/core/saveProgress.js
platform/storage.js     — localStorage / GamePix.localStorage
```
