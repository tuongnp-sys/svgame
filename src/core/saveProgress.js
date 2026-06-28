import { storageGet, storageSet } from '../../platform/storage.js';
import { getAllChapters } from './chapterConfig.js';

const SAVE_KEY = 'suviet_progress';

const DEFAULT_SAVE = {
  introSeen: false,
  completed: {},
  unlocked: [],
  cliffhangerChapterId: null,
  tutorialsSeen: {},
  briefingsSeen: {},
  artifacts: {},
  titles: [],
  totalStars: 0,
};

function recomputeMeta(base) {
  base.totalStars = Object.values(base.completed ?? {}).reduce(
    (sum, c) => sum + (c?.won ? (c.stars ?? 1) : 0),
    0,
  );

  if (!base.artifacts) base.artifacts = {};
  for (const [id, c] of Object.entries(base.completed ?? {})) {
    if (c?.won) {
      const prev = base.artifacts[id] ?? {};
      base.artifacts[id] = {
        collected: true,
        bestStars: Math.max(prev.bestStars ?? 0, c.stars ?? 1),
      };
    }
  }

  if (!base.titles) base.titles = [];
  return base;
}

function normalizeSave(raw) {
  const base = recomputeMeta({ ...DEFAULT_SAVE, ...(raw ?? {}) });
  const chapters = getAllChapters();
  const defaultUnlocked = chapters.filter((c) => c.unlockedByDefault).map((c) => c.id);
  const unlocked = new Set([...(base.unlocked ?? []), ...defaultUnlocked]);
  for (const id of Object.keys(base.completed ?? {})) {
    const n = Number(id);
    if (base.completed[id]?.won) unlocked.add(n + 1);
  }
  base.unlocked = [...unlocked].sort((a, b) => a - b);
  return base;
}

export function loadProgress() {
  return normalizeSave(storageGet(SAVE_KEY, null));
}

export function saveProgress(data) {
  storageSet(SAVE_KEY, normalizeSave(data));
}

export function isChapterUnlocked(chapterId) {
  const p = loadProgress();
  return p.unlocked.includes(chapterId);
}

export function isChapterPlayable(chapterId) {
  const meta = getAllChapters().find((c) => c.id === chapterId);
  if (!meta) return false;
  const implemented = [
    'timing_bar',
    'rhythm',
    'binary_choice',
    'rhythm_swipe',
    'path_draw',
    'runner',
  ];
  return isChapterUnlocked(chapterId) && implemented.includes(meta.mechanic);
}

/**
 * @param {number} chapterId
 * @param {{ won: boolean, stars: number, score: number, title?: string }} result
 */
export function recordChapterResult(chapterId, result) {
  const p = loadProgress();
  const prev = p.completed[String(chapterId)];
  const best = {
    won: result.won || prev?.won,
    stars: Math.max(result.stars ?? 0, prev?.stars ?? 0),
    score: Math.max(result.score ?? 0, prev?.score ?? 0),
  };
  p.completed[String(chapterId)] = best;

  if (result.won) {
    const id = String(chapterId);
    const art = p.artifacts[id] ?? {};
    p.artifacts[id] = {
      collected: true,
      bestStars: Math.max(art.bestStars ?? 0, result.stars ?? 1),
    };

    const next = chapterId + 1;
    if (getAllChapters().some((c) => c.id === next) && !p.unlocked.includes(next)) {
      p.unlocked.push(next);
      p.unlocked.sort((a, b) => a - b);
      p.cliffhangerChapterId = next;
    }
  }

  if (result.title && !p.titles.includes(result.title)) {
    p.titles.push(result.title);
  }

  saveProgress(p);
  return p;
}

export function getTotalStars() {
  return loadProgress().totalStars ?? 0;
}

export function markIntroSeen() {
  const p = loadProgress();
  p.introSeen = true;
  saveProgress(p);
}

export function clearCliffhanger() {
  const p = loadProgress();
  p.cliffhangerChapterId = null;
  saveProgress(p);
}

export function getCompletedRegions() {
  const p = loadProgress();
  return Object.entries(p.completed)
    .filter(([, v]) => v.won)
    .map(([id]) => Number(id));
}

export function isTutorialSeen(chapterId) {
  const p = loadProgress();
  return Boolean(p.tutorialsSeen?.[String(chapterId)]);
}

export function markTutorialSeen(chapterId) {
  const p = loadProgress();
  if (!p.tutorialsSeen) p.tutorialsSeen = {};
  p.tutorialsSeen[String(chapterId)] = true;
  saveProgress(p);
}

export function isBriefingSeen(chapterId) {
  const p = loadProgress();
  return Boolean(p.briefingsSeen?.[String(chapterId)]);
}

export function markBriefingSeen(chapterId) {
  const p = loadProgress();
  if (!p.briefingsSeen) p.briefingsSeen = {};
  p.briefingsSeen[String(chapterId)] = true;
  saveProgress(p);
}

/**
 * Người mới: ch.1 trước, rồi ch.2, rồi chương chưa thắng tiếp theo.
 */
export function getRecommendedChapter() {
  const p = loadProgress();
  if (!p.completed?.['1']?.won && isChapterPlayable(1)) return 1;
  if (!p.completed?.['2']?.won && isChapterPlayable(2)) return 2;
  for (const ch of getAllChapters()) {
    if (isChapterPlayable(ch.id) && !p.completed?.[String(ch.id)]?.won) return ch.id;
  }
  return 1;
}
