import balance from '../data/balance.json';
import { getChapterMeta } from './chapterConfig.js';
import { getLang, pickBilingual } from './locale.js';
import { t } from './i18n.js';

/**
 * @param {number} chapterId
 */
export function getChapterGoals(chapterId) {
  const id = String(chapterId);
  const defaults = balance.chapterGoals?.default ?? {};
  const specific = balance.chapterGoals?.[id] ?? {};
  return {
    ...defaults,
    ...specific,
    twoStar: { ...defaults.twoStar, ...specific.twoStar },
    threeStar: { ...defaults.threeStar, ...specific.threeStar },
  };
}

/**
 * One-line HUD hint for hunting 3★.
 * @param {number} chapterId
 * @param {import('./locale.js').GameLang} [lang]
 */
export function getStarGoalHint(chapterId, lang = getLang()) {
  const goals = getChapterGoals(chapterId);
  if (goals.hudThreeStar) return pickBilingual(goals.hudThreeStar, lang);
  return t('hud.defaultThreeStar', lang);
}

/**
 * Short in-chapter intro line (replaces long hook on intro overlay).
 * @param {number} chapterId
 * @param {import('./locale.js').GameLang} [lang]
 */
export function getShortIntro(chapterId, lang = getLang()) {
  const goals = getChapterGoals(chapterId);
  if (goals.shortIntro) return pickBilingual(goals.shortIntro, lang);
  const meta = getChapterMeta(chapterId);
  return pickBilingual(meta?.hook, lang) || t('hud.defaultIntro', lang);
}

/**
 * @param {object} state
 * @param {string} mechanic
 */
export function getRatingMetrics(state, mechanic) {
  switch (mechanic) {
    case 'binary_choice': {
      const total = Math.max(1, state.fightCount + state.peaceCount);
      return {
        goodRatio: state.fightCount / total,
        perfectRatio: state.fightCount / Math.max(1, state.roundsTotal ?? 8),
        missCount: state.peaceCount ?? 0,
        maxCombo: state.maxCombo ?? 0,
        shipsEscaped: 0,
        stormHits: 0,
        supplyMiss: 0,
      };
    }
    case 'rhythm_swipe': {
      const total = Math.max(1, (state.perfectCount ?? 0) + (state.missCount ?? 0));
      return {
        goodRatio: (state.wavesHit ?? 0) / Math.max(1, (state.wavesHit ?? 0) + (state.missCount ?? 0)),
        perfectRatio: (state.perfectCount ?? 0) / total,
        missCount: state.missCount ?? 0,
        maxCombo: state.maxCombo ?? 0,
        shipsEscaped: 0,
        stormHits: 0,
        supplyMiss: 0,
      };
    }
    case 'path_draw':
      return {
        goodRatio: (state.waypointsDone ?? 0) / Math.max(1, state.waypointsTotal ?? 8),
        perfectRatio: (state.waypointsDone ?? 0) / Math.max(1, state.waypointsTotal ?? 8),
        missCount: state.missCount ?? 0,
        maxCombo: state.maxCombo ?? 0,
        shipsEscaped: 0,
        stormHits: state.stormHits ?? 0,
        supplyMiss: 0,
      };
    case 'runner':
      return {
        goodRatio: state.perfectRatio ?? 0,
        perfectRatio: state.perfectRatio ?? 0,
        missCount: (state.missCount ?? 0) + (state.supplyMiss ?? 0),
        maxCombo: state.maxCombo ?? 0,
        shipsEscaped: 0,
        stormHits: 0,
        supplyMiss: state.supplyMiss ?? 0,
      };
    case 'rhythm':
    case 'timing_bar':
    default: {
      const total = Math.max(1, state.totalHits ?? 0);
      const perfect = state.perfectCount ?? 0;
      const great = state.greatCount ?? 0;
      return {
        goodRatio: (perfect + great) / total,
        perfectRatio: perfect / total,
        missCount: state.missCount ?? 0,
        maxCombo: state.maxCombo ?? 0,
        shipsEscaped: state.shipsEscaped ?? 0,
        stormHits: 0,
        supplyMiss: 0,
      };
    }
  }
}

/**
 * @param {object} metrics
 * @param {object} threeStar
 * @param {object} state
 */
function meetsThreeStar(metrics, threeStar, state) {
  if (metrics.perfectRatio < (threeStar.minPerfectPercent ?? 0.9)) return false;
  if (metrics.missCount > (threeStar.maxMiss ?? 0)) return false;
  if (metrics.maxCombo < (threeStar.minCombo ?? 0)) return false;
  if ((metrics.shipsEscaped ?? 0) > (threeStar.maxShipEscapes ?? 0)) return false;
  if ((metrics.stormHits ?? 0) > (threeStar.maxStormHits ?? 0)) return false;
  if ((metrics.supplyMiss ?? 0) > (threeStar.maxSupplyMiss ?? 0)) return false;
  if (threeStar.minFightCount != null && (state.fightCount ?? 0) < threeStar.minFightCount) return false;
  return true;
}

/**
 * @param {object} state — chapter state with isVictory()
 * @param {number} chapterId
 * @returns {1|2|3}
 */
export function computeStars(state, chapterId) {
  if (!state.isVictory?.()) return 1;

  const meta = getChapterMeta(chapterId);
  const mechanic = meta?.mechanic ?? 'timing_bar';
  const goals = getChapterGoals(chapterId);
  const metrics = getRatingMetrics(state, mechanic);
  const global = balance.starRating ?? {};

  if (meetsThreeStar(metrics, goals.threeStar ?? {}, state)) return 3;

  const twoThreshold = goals.twoStar?.minGoodPercent ?? global.twoStarGoodPercent ?? 0.7;
  if (metrics.goodRatio >= twoThreshold) return 2;

  return 1;
}
