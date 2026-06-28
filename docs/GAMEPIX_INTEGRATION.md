# GamePix Integration — Sương Mù Lịch Sử

## Build

```bash
npm run package:gamepix
```

Output: `packages/suvietgame-gamepix.zip`

## Checklist (manual)

1. Upload ZIP to GamePix Testing Toolkit
2. Start → play 15–30s with audio after user gesture
3. Open Tab → pause → return → resume
4. Complete chapter → Play Again (interstitial stub on local)
5. Console: no errors; `GAME_STOP` / `GAME_ACTION` when SDK wired

## Local dev

```bash
npm run dev
```

Platform adapter: `platform/index.js` (mock). Wire `GamePix.*` in `platform/gamepix.js` when deploying.

## Audio phases

| Scene | Track |
|-------|--------|
| Hub | menu |
| Chapter | chapter |
| ChapterOver win | victory + sfx_victory one-shot |

Mute toggles volume only — does not restart tracks.

## Storage

Progress and leaderboard use `platform/storage.js` → `localStorage` locally; `GamePix.localStorage` on portal.
