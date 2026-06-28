# AGENTS — Sương Mù Lịch Sử (suvietgame)

Hướng dẫn nhanh cho agent Cursor khi làm việc trên repo này.

## Dự án

| | |
|--|--|
| Game | Sương Mù Lịch Sử — 6 chương lịch sử VN, gamify |
| Stack | Phaser 3.80 + Vite 5, portrait ~375×812 |
| UI | Song ngữ **runtime** VN/EN |
| Entry | `src/main.js` |

**Scenes:** `BootScene` → `IntroScene` → `HubScene` → `ChapterScene` (6 mechanic) — victory overlay **trong** ChapterScene, không đổi scene.

## Đọc trước khi sửa i18n / overlay

**[docs/I18N_MULTISCENE_PLAYBOOK.md](docs/I18N_MULTISCENE_PLAYBOOK.md)** — bài học bắt buộc:

- Listener leak (`LangToggle`, `subscribeLangChange`)
- HTML modal vs Phaser input (click-through)
- BattleSim / demo lifecycle
- Ma trận smoke test trước push

## Đọc khi package portal

- [docs/GAMEPIX_INTEGRATION.md](docs/GAMEPIX_INTEGRATION.md)
- `.cursor/rules/gamepix-new-game.mdc`

## Quy ước code

- UI string → `uiStrings.json` + `t()`; content JSON → `pickBilingual()`
- Không hardcode paragraph dài trong scene
- Logic thắng/thua trong `src/core/controllers/`, không trong scene
- Overlay: `destroy()` idempotent, null ref scene cha, unsub listener
- Diff tối thiểu; match style file xung quanh

## Lệnh thường dùng

```bash
npm install
npm run dev      # http://localhost:5174
npm run build
npm run preview  # test bản production local
```

## Git

- Không commit/push trừ khi user yêu cầu rõ
- Không sửa `git config`

## Lưu ý

`docs/AGENT_BRIEF.md` mô tả game **khác** (sontinhgame template cũ) — **ưu tiên playbook và code trong repo này** khi làm suvietgame.
