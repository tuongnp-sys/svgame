import { bgmController } from './audio/BgmController.js';
import { platform } from '../platform/index.js';
import {
  getGamePhase,
  setSystemPaused,
  isSystemPaused,
  shouldResumeGameplay,
} from './gameSession.js';

/** @type {() => import('phaser').Game | null} */
let getGameRef = () => null;

export function registerGameAccessor(fn) {
  getGameRef = fn;
}

export function enterSystemPause(reason = 'system') {
  if (isSystemPaused()) return;
  setSystemPaused(true);
  bgmController.pause();
  if (getGamePhase() === 'PLAYING') {
    platform.gameplayStop();
    const scene = getGameRef()?.scene.getScene('ChapterScene');
    if (scene?.controller) scene.controller.setPaused(true);
  }
  if (reason !== 'silent') console.log('[Pause]', reason);
}

export function exitSystemPause() {
  if (!isSystemPaused()) return;
  setSystemPaused(false);
  if (shouldResumeGameplay()) {
    bgmController.resume();
    platform.gameplayStart();
    const scene = getGameRef()?.scene.getScene('ChapterScene');
    if (scene?.controller) scene.controller.setPaused(false);
  }
}
