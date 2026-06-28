import balance from '../data/balance.json';
import chaptersData from '../data/chapters.json';
import historyTimeline from '../data/content/historyTimeline.json';
import historySummaries from '../data/content/historySummaries.json';
import milestoneMoments from '../data/content/milestoneMoments.json';
import { getChapterGoals, getStarGoalHint, getShortIntro } from './chapterGoals.js';
import { getLang, pickBilingual } from './locale.js';

export { getChapterGoals, getStarGoalHint, getShortIntro };

/**
 * @param {number} chapterId
 */
export function getChapterMeta(chapterId) {
  const id = Number(chapterId);
  return chaptersData.chapters.find((c) => c.id === id) ?? null;
}

/**
 * @param {number} chapterId
 */
export function getChapterConfig(chapterId) {
  const meta = getChapterMeta(chapterId);
  const chapterBalance = balance.chapters?.[String(chapterId)] ?? {};
  return {
    id: chapterId,
    meta,
    timing: { ...balance.timing },
    starRating: { ...balance.starRating },
    swipe: { ...balance.swipe, ...chapterBalance },
    path: { ...balance.path, ...chapterBalance },
    runner: { ...balance.runner, ...chapterBalance },
    stakeCount: chapterBalance.stakeCount ?? balance.chapters?.['2']?.stakeCount ?? 10,
    maxShipEscapes: chapterBalance.maxShipEscapes ?? 2,
    shipIntervalMs: chapterBalance.shipIntervalMs ?? 4200,
    stakeCooldownMs: chapterBalance.stakeCooldownMs ?? 750,
  };
}

export function getAllChapters() {
  return chaptersData.chapters;
}

/**
 * Tên trận hiển thị trên tab / nút (vd. TRẬN BẠCH ĐẰNG).
 * @param {number} chapterId
 * @param {import('./locale.js').GameLang} [lang]
 */
export function getChapterBattleName(chapterId, lang = getLang()) {
  const meta = getChapterMeta(chapterId);
  return (
    pickBilingual(meta?.battleName, lang) ||
    pickBilingual(meta?.title, lang) ||
    pickBilingual({ vi: `Chương ${chapterId}`, en: `Chapter ${chapterId}` }, lang)
  );
}

/**
 * Khoảng thời gian / giai đoạn lịch sử của trận.
 * @param {number} chapterId
 * @param {import('./locale.js').GameLang} [lang]
 */
export function getChapterEra(chapterId, lang = getLang()) {
  const meta = getChapterMeta(chapterId);
  return pickBilingual(meta?.era, lang);
}

/**
 * Tên ngắn trên tab CÁCH CHƠI (bỏ tiền tố TRẬN / Battle).
 * @param {number} chapterId
 * @param {import('./locale.js').GameLang} [lang]
 */
export function getChapterTabName(chapterId, lang = getLang()) {
  return getChapterBattleName(chapterId, lang).replace(/^(TRẬN\s+|BATTLE OF\s+|BATTLE\s+)/i, '');
}

/**
 * Sơ đồ dòng thời gian tổng (6 giai đoạn game).
 */
export function getHistoryTimeline() {
  return historyTimeline;
}

/**
 * Chiếu chỉ lịch sử tóm tắt theo chương.
 * @param {number} chapterId
 */
export function getHistorySummary(chapterId) {
  return historySummaries[`ch${chapterId}`] ?? null;
}

export function hasHistorySummary(chapterId) {
  return getHistorySummary(chapterId) != null;
}

/**
 * Cột mốc lịch sử (prose ngắn) sau khi thắng chương.
 * @param {number} chapterId
 */
export function getMilestoneMoment(chapterId) {
  return milestoneMoments[String(chapterId)] ?? null;
}
