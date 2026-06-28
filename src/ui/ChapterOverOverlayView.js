import { bgmController } from '../audio/BgmController.js';
import { setGamePhase } from '../gameSession.js';
import { createPillButton, createDualLinePillButton } from './phaserUi.js';
import { createMuteToggle } from './MuteToggle.js';
import { wireOverlayLang } from './langOverlayHelper.js';
import { recordChapterResult, isChapterPlayable } from '../core/saveProgress.js';
import { addLeaderboardEntry, getPlayerName } from '../core/Leaderboard.js';
import { getChapterBattleName, getChapterEra, hasHistorySummary } from '../core/chapterConfig.js';
import { GameJuice } from '../core/GameJuice.js';
import { HistoryTimelineDiagramView } from './HistoryTimelineDiagramView.js';
import { HistoryScrollOverlayView } from './HistoryScrollOverlayView.js';
import { platform } from '../../platform/index.js';
import { getChapterMechanic } from '../core/chapterControllerFactory.js';
import {
  normalizeChapterOverResult,
  goToChapter,
  goToHub,
} from '../core/sceneTransition.js';
import { pickBilingual } from '../core/locale.js';
import { FONT_VI } from '../core/fonts.js';
import { t, tFmt } from '../core/i18n.js';

/** @param {number} chapterId */
function getVictoryHeadline(chapterId) {
  if (chapterId === 6) return t('chapterOver.grandVictory');
  return t('chapterOver.victory');
}

/** @param {number} nextId */
function getNextButtonLabel(nextId) {
  return tFmt('chapterOver.nextBattle', { name: getChapterBattleName(nextId) });
}

/**
 * Màn kết thúc chương — overlay trong ChapterScene (không đổi scene).
 */
export class ChapterOverOverlayView {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} rawResult
   */
  constructor(scene, rawResult) {
    this.scene = scene;
    this.rawResult = rawResult;
    this.result = normalizeChapterOverResult(rawResult);
    this._exiting = false;
    this._done = false;
    this._fireworks = null;
    this._timelineDiagram = null;
    this._historyOverlay = null;
    this.depth = 90;
    this.nodes = [];
    this.buttons = [];

    setGamePhase('GAMEOVER');
    bgmController.stop();

    const { won, stars, chapterId, score } = this.result;
    if (won) {
      recordChapterResult(chapterId, { won: true, stars, score });
      addLeaderboardEntry({
        name: getPlayerName(),
        score,
        chapterId,
        stars,
      });
      bgmController.play(scene, 'victory');
      bgmController.playVictoryFinale(scene);
      bgmController.playSfx(scene, 'unlock');
    }

    createMuteToggle(scene, this.depth + 60);
    wireOverlayLang(scene, this, this.depth + 62);
    this._buildUI(false);
  }

  /** @param {boolean} isRefresh */
  _buildUI(isRefresh) {
    const scene = this.scene;
    const w = scene.cameras.main.width;
    const h = scene.cameras.main.height;
    const { won, stars, stats, chapterId } = this.result;
    const artifact = pickBilingual(this.rawResult.artifact);
    const fact = pickBilingual(this.rawResult.fact);
    const cliffhanger = pickBilingual(this.rawResult.cliffhanger);
    const mechanic = getChapterMechanic(chapterId);
    const missLabel = mechanic === 'binary_choice' ? t('chapterOver.peaceLabel') : t('chapterOver.missLabel');
    const d = this.depth;
    const battleName = getChapterBattleName(chapterId);
    const era = getChapterEra(chapterId);
    const nextId = chapterId + 1;
    const showNext = won && isChapterPlayable(nextId);
    const isFinale = won && chapterId === 6;

    this.nodes.push(scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, isFinale ? 0.88 : 0.82).setDepth(d));

    const panelH = isFinale ? 620 : showNext ? 520 : won && chapterId < 6 ? 500 : 460;
    const panelY = isFinale ? h * 0.46 : h * 0.48;
    const panelW = w - (isFinale ? 28 : 40);

    if (isFinale) {
      this.nodes.push(
        scene.add
          .rectangle(w / 2, panelY, panelW, panelH, 0x2c1810, 0.98)
          .setDepth(d + 1)
          .setStrokeStyle(3, 0xc9a227),
      );
      this.nodes.push(
        scene.add
          .rectangle(w / 2, panelY - panelH / 2 + 10, panelW - 16, 28, 0xc9a227, 0.35)
          .setDepth(d + 2),
      );
      this.nodes.push(
        scene.add
          .text(w / 2, panelY - panelH / 2 + 24, t('chapterOver.journeyComplete'), {
            fontFamily: FONT_VI,
            fontSize: '11px',
            fontStyle: 'bold',
            color: '#f4d03f',
          })
          .setOrigin(0.5)
          .setDepth(d + 3),
      );
      if (!isRefresh) {
        this._fireworks = GameJuice.playVictoryFireworks(scene, d + 1);
      }
    } else {
      const panel = scene.add
        .rectangle(w / 2, panelY, panelW, panelH, 0x1a2744, 0.98)
        .setDepth(d + 1);
      panel.setStrokeStyle(3, won ? 0xf4d03f : 0xe74c3c);
      this.nodes.push(panel);
    }

    const y0 = isFinale ? h * 0.148 : h * 0.215;

    this.nodes.push(
      scene.add
        .text(w / 2, y0, won ? getVictoryHeadline(chapterId) : t('chapterOver.defeat'), {
          fontFamily: FONT_VI,
          fontSize: isFinale ? '24px' : chapterId === 6 && won ? '22px' : '24px',
          fontStyle: 'bold',
          color: won ? '#f4d03f' : '#e74c3c',
        })
        .setOrigin(0.5)
        .setDepth(d + 2),
    );

    if (era) {
      this.nodes.push(
        scene.add
          .text(w / 2, y0 + 28, era, {
            fontFamily: FONT_VI,
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#f4d03f',
          })
          .setOrigin(0.5)
          .setDepth(d + 2),
      );
    }

    this.nodes.push(
      scene.add
        .text(w / 2, y0 + (era ? 52 : 28), battleName, {
          fontFamily: FONT_VI,
          fontSize: '14px',
          fontStyle: 'bold',
          color: won ? '#ffffff' : '#dfe6e9',
        })
        .setOrigin(0.5)
        .setDepth(d + 2),
    );

    const yStars = y0 + (era ? (isFinale ? 68 : 82) : isFinale ? 48 : 58);
    const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    this.nodes.push(
      scene.add
        .text(w / 2, yStars, starStr, {
          fontFamily: FONT_VI,
          fontSize: isFinale ? '22px' : '28px',
          color: '#f4d03f',
        })
        .setOrigin(0.5)
        .setDepth(d + 2),
    );

    if (won && artifact) {
      this.nodes.push(
        scene.add
          .text(w / 2, yStars + (isFinale ? 28 : 38), tFmt('chapterOver.artifact', { name: artifact }), {
            fontFamily: FONT_VI,
            fontSize: isFinale ? '13px' : '15px',
            fontStyle: 'bold',
            color: '#ffffff',
          })
          .setOrigin(0.5)
          .setDepth(d + 2),
      );
    }

    let yCliffLabel;
    if (isFinale) {
      this._timelineDiagram = new HistoryTimelineDiagramView(
        scene,
        w / 2,
        h * 0.46,
        w - 48,
        d + 2,
        { highlightChapterId: 6 },
      );
      yCliffLabel = h * 0.565;
    } else {
      this.nodes.push(
        scene.add
          .text(w / 2, yStars + (won && artifact ? 68 : 42), fact ?? '', {
            fontFamily: FONT_VI,
            fontSize: '13px',
            color: '#dfe6e9',
            align: 'center',
            wordWrap: { width: w - 72 },
          })
          .setOrigin(0.5)
          .setDepth(d + 2),
      );
      yCliffLabel = yStars + (won && artifact ? 108 : 82);
    }
    if (won && cliffhanger) {
      const cliffLabel = chapterId >= 6 ? t('chapterOver.cliffEnd') : t('chapterOver.cliffNext');
      this.nodes.push(
        scene.add
          .text(w / 2, yCliffLabel, cliffLabel, {
            fontFamily: FONT_VI,
            fontSize: '11px',
            fontStyle: 'bold',
            color: '#95a5a6',
          })
          .setOrigin(0.5)
          .setDepth(d + 2),
      );
      this.nodes.push(
        scene.add
          .text(w / 2, yCliffLabel + 26, cliffhanger, {
            fontFamily: FONT_VI,
            fontSize: '12px',
            fontStyle: 'italic',
            color: '#f4d03f',
            align: 'center',
            wordWrap: { width: w - 72 },
          })
          .setOrigin(0.5)
          .setDepth(d + 2),
      );
    }

    if (stats) {
      const perfectLabel = mechanic === 'binary_choice' ? t('chapterOver.fightLabel') : t('chapterOver.perfectLabel');
      this.nodes.push(
        scene.add
          .text(
            w / 2,
            yCliffLabel + (won && cliffhanger ? 58 : 24),
            tFmt('chapterOver.statsLine', {
              perfect: perfectLabel,
              miss: missLabel,
              p: stats.perfect,
              m: stats.miss,
              c: stats.maxCombo,
            }),
            {
              fontFamily: FONT_VI,
              fontSize: '12px',
              color: '#95a5a6',
            },
          )
          .setOrigin(0.5)
          .setDepth(d + 2),
      );
    }

    let btnY = isFinale ? h * 0.815 : h * 0.585;

    if (hasHistorySummary(chapterId)) {
      this.buttons.push(
        createDualLinePillButton(
          scene,
          w / 2,
          btnY,
          300,
          56,
          t('howTo.historySummary'),
          era || getChapterBattleName(chapterId),
          () => this._openHistory(chapterId),
          true,
        ).setDepth(d + 10),
      );
      btnY += 54;
    }

    if (showNext) {
      this.buttons.push(
        createPillButton(
          scene,
          w / 2,
          btnY,
          300,
          52,
          getNextButtonLabel(nextId),
          () => this._exitToChapter(nextId),
        ).setDepth(d + 10),
      );
      btnY += 56;
    }

    this.buttons.push(
      createPillButton(scene, w / 2, btnY, 260, 48, t('chapterOver.replay'), () => this._exitToChapter(chapterId)).setDepth(
        d + 10,
      ),
    );
    btnY += 52;

    this.buttons.push(
      createPillButton(scene, w / 2, btnY, 260, 44, t('chapterOver.backToMap'), () => this._exitToHub(), true).setDepth(d + 10),
    );
  }

  _tearDownUI() {
    this._fireworks?.stop();
    this._fireworks = null;
    this._timelineDiagram?.destroy();
    this._timelineDiagram = null;
    for (const btn of this.buttons) btn.destroy();
    for (const n of this.nodes) n.destroy();
    this.buttons = [];
    this.nodes = [];
  }

  refreshLang() {
    if (this._done || this._exiting) return;
    this._historyOverlay?.refreshLang?.();
    this._tearDownUI();
    this._buildUI(true);
  }

  _openHistory(chapterId) {
    if (this._historyOverlay) return;
    this._historyOverlay = new HistoryScrollOverlayView(this.scene, chapterId, {
      depth: this.depth + 12,
      onClose: () => {
        this._historyOverlay = null;
      },
    });
  }

  _exitToChapter(chapterId) {
    if (this._exiting) return;
    this._exiting = true;
    const scene = this.scene;
    bgmController.stop();
    void platform.showInterstitial();
    this.destroy(true);
    scene.overOverlay = null;
    scene._ending = false;
    goToChapter(scene, chapterId);
  }

  _exitToHub() {
    if (this._exiting) return;
    this._exiting = true;
    const scene = this.scene;
    bgmController.stop();
    this.destroy(true);
    scene.overOverlay = null;
    scene._ending = false;
    goToHub(scene);
  }

  /**
   * @param {boolean} [silent]
   */
  destroy(silent = false) {
    if (this._done) return;
    this._done = true;
    this._tearDownUI();
    this._historyOverlay?.destroy();
    this._historyOverlay = null;
    if (!silent) this.scene.overOverlay = null;
  }
}
