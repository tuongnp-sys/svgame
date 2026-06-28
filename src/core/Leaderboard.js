import { storageGet, storageSet } from '../../platform/storage.js';
import { getDefaultPlayerName } from './i18n.js';

const LB_KEY = 'suviet_leaderboard';
const MAX_ENTRIES = 10;

/**
 * @typedef {{ name: string, score: number, chapterId: number, stars: number, ts: number }} LbEntry
 */

/** @returns {LbEntry[]} */
export function getLeaderboard() {
  return storageGet(LB_KEY, []) ?? [];
}

/**
 * @param {LbEntry} entry
 */
export function addLeaderboardEntry(entry) {
  const list = getLeaderboard();
  list.push({ ...entry, ts: Date.now() });
  list.sort((a, b) => b.score - a.score);
  storageSet(LB_KEY, list.slice(0, MAX_ENTRIES));
  return list.slice(0, MAX_ENTRIES);
}

export function getPlayerName() {
  return storageGet('suviet_player_name', getDefaultPlayerName()) || getDefaultPlayerName();
}

export function setPlayerName(name) {
  storageSet('suviet_player_name', (name || getDefaultPlayerName()).trim().slice(0, 16));
}
