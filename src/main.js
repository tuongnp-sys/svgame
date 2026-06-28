import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/600.css';
import '@fontsource/be-vietnam-pro/700.css';

import Phaser from 'phaser';
import { BootScene } from './BootScene.js';
import { IntroScene } from './IntroScene.js';
import { HubScene } from './HubScene.js';
import { ChapterScene } from './ChapterScene.js';
import { ChapterOverScene } from './ChapterOverScene.js';
import { platform } from '../platform/index.js';
import { registerGameAccessor, enterSystemPause, exitSystemPause } from './systemPause.js';
import { shouldResumeGameplay } from './gameSession.js';

/** @type {Phaser.Game|null} */
let game = null;

export const GAME_WIDTH = 375;
export const GAME_HEIGHT = 812;

export function getGame() {
  return game;
}

export function initGame() {
  const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#0a1628',
    scale: {
      mode: Phaser.Scale.EXPAND,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      autoRound: true,
    },
    scene: [BootScene, IntroScene, HubScene, ChapterScene, ChapterOverScene],
    audio: {
      disableWebAudio: false,
    },
    fps: {
      target: 60,
      smoothStep: true,
    },
  };

  game = new Phaser.Game(config);
  registerGameAccessor(() => game);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      enterSystemPause('tab_hidden');
    } else if (shouldResumeGameplay()) {
      exitSystemPause();
    }
  });

  platform.gameLoading(0);
  platform.gameLoading(100);
  platform.gameLoaded();
}

initGame();
