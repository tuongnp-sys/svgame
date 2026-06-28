import { storageGet, storageSet } from '../../platform/storage.js';

const LANG_KEY = 'suviet_lang';
const LEGACY_KEY = 'suviet_summary_lang';

/** @typedef {'vi' | 'en'} GameLang */

/** @type {Set<(lang: GameLang) => void>} */
const langListeners = new Set();

/**
 * @param {(lang: GameLang) => void} fn
 * @returns {() => void} unsubscribe
 */
export function subscribeLangChange(fn) {
  langListeners.add(fn);
  return () => langListeners.delete(fn);
}

/** @returns {GameLang} */
export function getLang() {
  let v = storageGet(LANG_KEY, null);
  if (v == null) {
    v = storageGet(LEGACY_KEY, 'vi');
    storageSet(LANG_KEY, v === 'en' ? 'en' : 'vi');
  }
  return v === 'en' ? 'en' : 'vi';
}

/** @param {GameLang} lang */
export function setLang(lang) {
  const val = lang === 'en' ? 'en' : 'vi';
  if (getLang() === val) return;
  storageSet(LANG_KEY, val);
  storageSet(LEGACY_KEY, val);
  for (const fn of langListeners) {
    try {
      fn(val);
    } catch (err) {
      console.error('[i18n] lang listener failed', err);
    }
  }
}

/** @deprecated use getLang */
export const getSummaryLang = getLang;

/** @deprecated use setLang */
export const setSummaryLang = setLang;

/**
 * @param {{ vi?: string, en?: string }} pair
 * @param {GameLang} mode
 * @returns {string[]}
 */
export function resolveBilingualLines(pair, mode) {
  const vi = pair?.vi?.trim() ?? '';
  const en = pair?.en?.trim() ?? '';
  if (mode === 'en') return en ? [en] : vi ? [vi] : [];
  return vi ? [vi] : en ? [en] : [];
}

/**
 * @param {{ vi?: string, en?: string } | string | null | undefined} pair
 * @param {GameLang} [mode]
 */
export function pickBilingual(pair, mode = getLang()) {
  if (typeof pair === 'string') return pair;
  const lines = resolveBilingualLines(pair ?? {}, mode);
  return lines[0] ?? '';
}
