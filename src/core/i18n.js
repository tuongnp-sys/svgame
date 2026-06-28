import uiStrings from '../data/uiStrings.json';
import { HOW_TO_PLAY } from '../data/howToPlayContent.js';
import { getLang, pickBilingual } from './locale.js';

/**
 * @param {string} key — dot path, e.g. "hub.title"
 * @param {import('./locale.js').GameLang} [lang]
 */
export function t(key, lang = getLang()) {
  const parts = key.split('.');
  let node = /** @type {Record<string, unknown>} */ (uiStrings);
  for (const p of parts) {
    node = /** @type {Record<string, unknown>} */ (node?.[p]);
    if (node == null) return key;
  }
  if (typeof node === 'object' && node !== null && ('vi' in node || 'en' in node)) {
    return pickBilingual(/** @type {{ vi?: string, en?: string }} */ (node), lang);
  }
  return key;
}

/**
 * @param {string} key
 * @param {Record<string, string | number>} vars
 * @param {import('./locale.js').GameLang} [lang]
 */
export function tFmt(key, vars = {}, lang = getLang()) {
  let s = t(key, lang);
  for (const [k, v] of Object.entries(vars)) {
    s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return s;
}

/**
 * @param {number} chapterId
 * @param {import('./locale.js').GameLang} [lang]
 */
export function getHowToContent(chapterId, lang = getLang()) {
  const raw = HOW_TO_PLAY[chapterId] ?? HOW_TO_PLAY[1];
  const pick = (pair) => pickBilingual(pair, lang);
  const pickArr = (arr) => (arr ?? []).map((item) => pick(item));
  return {
    title: pick(raw.title),
    era: pick(raw.era),
    action: pick(raw.action),
    win: pickArr(raw.win),
    lose: pickArr(raw.lose),
    steps: pickArr(raw.steps),
    mistakes: pickArr(raw.mistakes),
  };
}

/**
 * @param {import('./locale.js').GameLang} [lang]
 */
export function getDefaultPlayerName(lang = getLang()) {
  return t('leaderboard.defaultName', lang);
}

/**
 * @param {object} wp
 * @param {import('./locale.js').GameLang} [lang]
 */
export function localizeWaypoint(wp, lang = getLang()) {
  if (!wp) return wp;
  const asPair = (val) => (typeof val === 'object' && val !== null && ('vi' in val || 'en' in val) ? val : { vi: val ?? '', en: val ?? '' });
  return {
    ...wp,
    label: pickBilingual(asPair(wp.label), lang),
    title: pickBilingual(asPair(wp.title), lang),
    summary: pickBilingual(asPair(wp.summary), lang),
    era: pickBilingual(asPair(wp.era), lang),
  };
}

export function getBinaryPrompt(index, lang = getLang()) {
  const list = /** @type {{ vi?: string, en?: string }[]} */ (uiStrings.binaryPrompts ?? []);
  if (!list.length) return '';
  return pickBilingual(list[index % list.length], lang);
}

/**
 * @param {import('./locale.js').GameLang} [lang]
 */
export function getBattleSimBinaryLines(lang = getLang()) {
  const lines = uiStrings.battleSim?.binaryLines;
  if (!lines) return [];
  return lang === 'en' ? (lines.en ?? lines.vi ?? []) : (lines.vi ?? []);
}

/** @param {'rhythm'|'rhythm_swipe'|'path_draw'|'runner'} kind */
export function getBattleSimLines(kind, lang = getLang()) {
  const key = {
    rhythm: 'rhythmLines',
    rhythm_swipe: 'swipeLines',
    path_draw: 'pathLines',
    runner: 'runnerLines',
  }[kind];
  const lines = key ? uiStrings.battleSim?.[key] : null;
  if (!lines) return [t('battleSim.defaultProgress', lang)];
  return lang === 'en' ? (lines.en ?? lines.vi ?? []) : (lines.vi ?? []);
}

/**
 * @param {import('../data/content/historyTimeline.json')} timeline
 * @param {import('./locale.js').GameLang} [lang]
 */
export function localizeTimeline(timeline, lang = getLang()) {
  return {
    title: pickBilingual(timeline.title, lang),
    tcnHint: pickBilingual(timeline.tcnHint, lang),
    nodes: (timeline.nodes ?? []).map((node) => ({
      ...node,
      label: pickBilingual(node.label, lang),
      yearRange: pickBilingual(node.yearRange, lang),
      short: pickBilingual(node.short, lang),
    })),
  };
}
