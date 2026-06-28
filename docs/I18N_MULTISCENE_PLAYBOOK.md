# Playbook — Song ngữ (VN/EN) + nhiều màn chơi (Phaser 3)

Tài liệu kinh nghiệm từ **Sương Mù Lịch Sử** (`suvietgame`). Dành cho agent Cursor / dev tiếp quản hoặc làm game **cùng kiểu**: Phaser + Vite, UI song ngữ runtime, nhiều mechanic/chapter, overlay Phaser + modal HTML.

Đọc kèm: [AGENTS.md](../AGENTS.md) (entry nhanh), [GAMEPIX_INTEGRATION.md](./GAMEPIX_INTEGRATION.md) (portal).

---

## 1. Kiến trúc i18n (bắt buộc nắm)

| Thành phần | File | Vai trò |
|------------|------|---------|
| Ngôn ngữ lưu trữ | `src/core/locale.js` | `getLang()`, `setLang()`, `subscribeLangChange()`, `pickBilingual()` |
| Chuỗi UI | `src/data/uiStrings.json` | `t('key')`, `tFmt('key', vars)` qua `src/core/i18n.js` |
| Nội dung JSON | `src/data/content/*.json`, `facts.json`, … | Field `{ "vi": "...", "en": "..." }` |
| Toggle VN/EN | `src/ui/LangToggle.js` | Nút pill góc trái (52, 48) |
| Overlay wiring | `src/ui/langOverlayHelper.js` | `wireOverlayLang()` — toggle + `refreshLang` + cleanup destroy |

**Nguyên tắc:** Song ngữ là **vòng đời runtime**, không phải task dịch string một lần. Mọi màn phải trả lời: *“User bấm VN/EN thì UI cập nhật thế nào?”*

### Pattern chuẩn cho scene

```javascript
createLangToggle(this, depth);
const unsub = subscribeLangChange(() => this._refreshLang());
this.events.once('shutdown', unsub);
```

### Pattern chuẩn cho overlay Phaser

```javascript
wireOverlayLang(scene, overlay, depth + 20, onClose);
// overlay.refreshLang() { ... cập nhật text / rebuild panel an toàn ... }
// overlay.destroy() phải idempotent (_done guard)
```

### `setLang` phải an toàn

Mọi listener trong `locale.js` bọc `try/catch` — một listener crash không làm sập chuỗi i18n còn lại.

---

## 2. Hai lớp UI: Phaser canvas vs HTML modal

| Lớp | Ví dụ | Ghi chú |
|-----|-------|---------|
| Phaser | Hub, Chapter, HowTo, Victory, Briefing | `scene.add.text`, `createPillButton`, depth 25–90 |
| HTML | `MilestoneMomentOverlayView`, `HistoryScrollOverlayView` | `document.body`, `z-index: 100000`, `css/style.css` |

**Hai thế giới không chia sẻ input.** HTML che visually nhưng Phaser vẫn nhận pointer nếu modal biến mất cùng frame với click.

### Pattern bắt buộc (HTML modal)

File: `src/ui/htmlModalHelper.js`

1. **`lockPhaserInput(scene)`** khi mở modal  
2. **`unlockPhaserInput(scene)`** trong `destroy()`  
3. **`deferredAfterPointer(fn)`** — double `requestAnimationFrame` trước khi destroy + callback (cùng ý tưởng `sceneTransition.js`)  
4. Nút đóng HTML: `preventDefault()` + `stopPropagation()`  
5. Guard `_closing` chống double-click  

**Bug thực tế đã gặp:** Đóng “Lịch sử tóm tắt” → click xuyên xuống nút **Chơi lại** Phaser → `goToChapter` restart chương 6.

---

## 3. Listener leak — bug tinh vi nhất

### LangToggle

`createLangToggle()` đăng ký `subscribeLangChange(syncLabel)`. **Phải `unsub` trong `destroy()` của toggle**, không chỉ khi scene shutdown.

**Triệu chứng:** Spam console `[i18n] lang listener failed` + `Cannot read properties of null (reading 'drawImage'/'glTexture')` khi `setText` trên Text đã destroy.

**Nguyên nhân:** Mỗi overlay (`wireOverlayLang`) tạo toggle mới; đóng overlay destroy nút nhưng listener còn → tích lũy hàng chục listener “ma”.

### Quy tắc vàng

> **Mọi `subscribeLangChange` phải có `unsubscribe` trong `destroy()` của đúng owner.**

Áp dụng: LangToggle, overlay Phaser, HTML modal (`_unsubLang`), demo animation (BattleSim).

---

## 4. Lifecycle overlay & animation

### Destroy checklist

```
destroy() {
  1. alive = false / _done = true
  2. unsub mọi lang listener
  3. stop timers (scene.time) & tweens
  4. destroy children / demo / sim
  5. nodes.length = 0; null refs trên scene cha
  6. onClose?.()
}
```

### Các lỗi P0 đã sửa trong repo này

| Bug | File | Fix |
|-----|------|-----|
| Crash khi đổi ngôn ngữ trong HowTo | `BattleSim.js`, demos | `createSimLifecycle`, flag `alive`, dừng tween/timer trước destroy |
| HowTo/Leaderboard không mở lại | `HubScene.js` | `onClose` null ref; không `if (howTo) return` sau destroy |
| `refreshLang` rebuild panel | `HowToPlayOverlayView`, briefing panels | `contentPanel?.destroy()` + null trước rebuild |
| Runner crash khi trượt rào | `RunnerView.flashTankMiss` | **Không** đặt `const t` trùng import `t()` i18n (TDZ) |
| Tank intro thiếu VN/EN | `RunnerView.showTankPhaseIntro` | Toggle depth > overlay (40+); `_refreshTankIntroLang` |

### Stale ref trên scene

Hub/Chapter giữ ref overlay (`this.howTo`, `this.leaderboard`, `this._historyOverlay`). Khi destroy overlay **bắt buộc** null ref qua `onClose` hoặc trong handler destroy.

---

## 5. Phaser + JavaScript — cạm bẫy

1. **Shadow import:** Không `const t = scene.add.text` trong function dùng `t('key')`.
2. **`setLabel` guard:** `if (!text?.active) return` (`phaserUi.js`).
3. **Depth:** Toggle scene depth 30 bị overlay depth 40+ che → “thiếu nút VN/EN”.
4. **Passive listener:** Tránh `preventDefault` trên `pointerdown` Phaser (warning console).
5. **Rebuild on lang change:** Destroy sim/demo **trước** khi tạo panel mới (`ChapterBattleBriefingPanel`, `BattleSim`).

---

## 6. Luồng scene & mechanic (repo này)

```
BootScene → IntroScene → HubScene → ChapterScene (×6 mechanic)
```

| Ch | Mechanic | View chính |
|----|----------|------------|
| 1 | rhythm | `RhythmLaneView` |
| 2 | timing_bar | `TimingBarView` + tutorial |
| 3 | binary_choice | `BinaryChoiceView` |
| 4 | rhythm_swipe | `SwipeArrowsView` |
| 5 | path_draw | `PathDrawView` + waypoint card |
| 6 | runner | `RunnerView` (supply + tank intro) |

**ChapterScene** là hub: briefing, tutorial, milestone HTML, victory overlay, milestone moment HTML.

Mỗi mechanic cần **`refreshLang()`** riêng. Sửa Hub **không** đảm bảo Ch.6 ổn.

---

## 7. Ma trận smoke test (trước push / deploy)

Chạy `npm run build` + kiểm tra Console (F12) **không đỏ** khi spam VN/EN.

| Khu vực | Việc cần làm |
|---------|--------------|
| Hub | Start, VN/EN, HowTo mở/đóng/mở lại, Leaderboard |
| Intro | Tap vào Hub (không chặn toggle), VN/EN |
| Ch.2 | Briefing → Tutorial → START PLAYING |
| HowTo (Hub) | Tab Battle/Controls, đổi ngôn ngữ khi demo timing_bar chạy |
| Ch.6 runner | Tank intro có VN/EN; nhảy/trượt rào không crash |
| Victory ch.6 | Milestone HTML → Continue; Lịch sử tóm tắt → **ĐÓNG** (ở lại victory, không restart trận) |
| Lang spam | 10× VN/EN trên Hub + overlay + HTML modal — không leak listener |

---

## 8. Deploy cho bạn bè test

| Bước | Lệnh / cấu hình |
|------|-----------------|
| Build | `npm run build` → `dist/` |
| Vite base | `base: './'` trong `vite.config.js` (relative assets) |
| GitHub | `git push origin main` |
| Vercel | Framework Vite, build `npm run build`, output `dist` |

Repo: `https://github.com/tuongnp-sys/svgame`

---

## 9. Git — bài học quy trình

- **Không push một cục lớn** khi chưa smoke test — khó revert nếu chỉ có 1 commit trên remote.
- Commit theo cụm: `i18n core` → `overlay lifecycle` → `RunnerView` → `HTML modal input`.
- Không `git commit` / `push` trừ khi user yêu cầu.

---

## 10. Definition of done (agent)

Task i18n/overlay coi **xong** khi:

- [ ] Mọi surface mới có `refreshLang` hoặc lý do documented không cần
- [ ] Mọi subscribe có unsub trong destroy
- [ ] HTML modal dùng lock/unlock Phaser input + deferred close
- [ ] Animation/demo có lifecycle (timer/tween stop)
- [ ] Ma trận smoke test §7 pass
- [ ] `npm run build` pass

---

## 11. File tham chiếu nhanh

```
src/core/locale.js          — lang pub/sub
src/core/i18n.js            — t(), tFmt()
src/ui/LangToggle.js        — toggle + unsub on destroy
src/ui/langOverlayHelper.js — wireOverlayLang
src/ui/htmlModalHelper.js   — lockPhaserInput, deferredAfterPointer
src/ui/howTo/BattleSim.js   — sim lifecycle pattern
src/ui/RunnerView.js        — tank intro lang, flashTankMiss naming
src/ui/ChapterOverOverlayView.js — victory + history open
src/ui/HistoryScrollOverlayView.js — HTML history modal
src/core/sceneTransition.js — deferred navigation (double rAF)
```

---

*Cập nhật: 2026-06 — kinh nghiệm debug i18n/overlay suvietgame beta.*
