import { getStarGoalHint, getShortIntro, getChapterBattleName, getChapterEra } from '../core/chapterConfig.js';

import { COMBO_MILESTONE } from '../core/chapterConstants.js';

import { FONT_VI } from '../core/fonts.js';

import { t, tFmt } from '../core/i18n.js';

import { pickBilingual } from '../core/locale.js';



/**

 * Chapter HUD — stakes, ships, combo, intro, 3★ goal hint.

 */

export class ChapterHudView {

  /**

   * @param {Phaser.Scene} scene

   */

  constructor(scene) {

    const w = scene.cameras.main.width;

    this.scene = scene;

    this.chapterId = 1;

    this._comboPulse = null;



    this.chapterTitle = scene.add

      .text(w / 2, 78, '', {

        fontFamily: FONT_VI,

        fontSize: '15px',

        fontStyle: 'bold',

        color: '#f4d03f',

      })

      .setOrigin(0.5)

      .setDepth(15);



    this.chapterEra = scene.add

      .text(w / 2, 96, '', {

        fontFamily: FONT_VI,

        fontSize: '11px',

        fontStyle: 'bold',

        color: '#95a5a6',

      })

      .setOrigin(0.5)

      .setDepth(15);



    this.starGoalLabel = scene.add

      .text(w / 2, 114, '', {

        fontFamily: FONT_VI,

        fontSize: '11px',

        color: '#636e72',

        align: 'center',

        wordWrap: { width: w - 40 },

      })

      .setOrigin(0.5)

      .setDepth(15);



    this.hookText = scene.add

      .text(w / 2, 132, '', {

        fontFamily: FONT_VI,

        fontSize: '12px',

        color: '#95a5a6',

        align: 'center',

        wordWrap: { width: w - 48 },

      })

      .setOrigin(0.5)

      .setDepth(15);



    this.stakesLabel = scene.add

      .text(24, 52, '', {

        fontFamily: FONT_VI,

        fontSize: '13px',

        fontStyle: 'bold',

        color: '#f4d03f',

      })

      .setDepth(15);



    this.shipsLabel = scene.add

      .text(w - 24, 52, '', {

        fontFamily: FONT_VI,

        fontSize: '13px',

        fontStyle: 'bold',

        color: '#e74c3c',

      })

      .setOrigin(1, 0)

      .setDepth(15);



    this.comboLabel = scene.add

      .text(w / 2, 52, '', {

        fontFamily: FONT_VI,

        fontSize: '14px',

        fontStyle: 'bold',

        color: '#58d68d',

      })

      .setOrigin(0.5, 0)

      .setDepth(15);



    this.instruction = scene.add

      .text(w / 2, 680, t('hud.instruction.timing_bar'), {

        fontFamily: FONT_VI,

        fontSize: '13px',

        color: '#95a5a6',

      })

      .setOrigin(0.5)

      .setDepth(15);



    this.introOverlay = scene.add

      .rectangle(w / 2, 406, w, 160, 0x0a1628, 0.82)

      .setDepth(14);



    this.introText = scene.add

      .text(w / 2, 400, '', {

        fontFamily: FONT_VI,

        fontSize: '17px',

        fontStyle: 'bold',

        color: '#f4d03f',

        align: 'center',

        wordWrap: { width: w - 60 },

      })

      .setOrigin(0.5)

      .setDepth(15);

  }



  /**

   * @param {object} meta

   * @param {string} [mechanic]

   * @param {number} [chapterId]

   */

  setChapterMeta(meta, mechanic = 'timing_bar', chapterId = meta?.id ?? 1) {
    this._meta = meta;
    this.mechanic = mechanic;

    this.chapterId = chapterId;

    this.chapterTitle.setText(getChapterBattleName(chapterId));

    this.chapterEra.setText(getChapterEra(chapterId));

    this.hookText.setText(pickBilingual(meta?.hook) ?? '');

    this.introText.setText(getShortIntro(chapterId));

    this.starGoalLabel.setText(`${t('hud.goalPrefix')} ${getStarGoalHint(chapterId)}`);



    const hints = {

      timing_bar: t('hud.instruction.timing_bar'),

      rhythm: t('hud.instruction.rhythm'),

      binary_choice: t('hud.instruction.binary_choice'),

      rhythm_swipe: t('hud.instruction.rhythm_swipe'),

      path_draw: t('hud.instruction.path_draw'),

      runner: t('hud.instruction.runner'),

    };

    this.instruction.setText(hints[mechanic] ?? hints.timing_bar);

    this.shipsLabel.setVisible(

      mechanic === 'timing_bar' ||

        mechanic === 'rhythm_swipe' ||

        mechanic === 'rhythm' ||

        mechanic === 'binary_choice' ||

        mechanic === 'path_draw' ||

        mechanic === 'runner',

    );

  }



  /**

   * @param {object} state

   * @param {{ shipDanger?: boolean }} [extra]

   */

  update(state, extra = {}) {

    if (this.mechanic === 'timing_bar' && state.stakesRequired != null) {

      this.stakesLabel.setText(tFmt('hud.stakes', { done: state.stakesDriven, total: state.stakesRequired }));

      this.shipsLabel.setText(tFmt('hud.shipsEscaped', { n: state.shipsEscaped, max: state.maxShipEscapes }));

      if (extra.shipDanger) {

        this.shipsLabel.setColor('#ff6b6b');

      } else {

        this.shipsLabel.setColor('#e74c3c');

      }

    } else if (this.mechanic === 'rhythm' && state.notesRequired != null) {

      this.stakesLabel.setText(tFmt('hud.notes', { done: state.notesHit, total: state.notesRequired }));

      this.shipsLabel.setText(tFmt('hud.missCount', { n: state.missCount }));

    } else if (this.mechanic === 'binary_choice') {

      this.stakesLabel.setText(tFmt('hud.fightCount', { n: state.fightCount }));

      this.shipsLabel.setText(tFmt('hud.peaceCount', { n: state.peaceCount }));

    } else if (this.mechanic === 'rhythm_swipe') {

      this.stakesLabel.setText(tFmt('hud.blocks', { done: state.wavesHit, total: state.wavesRequired }));

      this.shipsLabel.setText(tFmt('hud.missRatio', { n: state.missCount, max: state.maxMiss }));

    } else if (this.mechanic === 'path_draw') {

      this.stakesLabel.setText(tFmt('hud.waypoints', { done: state.waypointsDone, total: state.waypointsTotal }));

      this.shipsLabel.setText(tFmt('hud.storms', { n: state.stormHits, max: state.maxStormHits }));

    } else if (this.mechanic === 'runner') {

      if (state.runPhase === 'supply') {

        this.stakesLabel.setText(tFmt('hud.rice', { n: state.riceCollected, total: state.riceRequired }));

        this.shipsLabel.setText(tFmt('hud.supplyMiss', { n: state.supplyMiss, max: state.maxSupplyMiss }));

      } else {

        const left = Math.max(0, state.obstaclesTotal - state.obstaclesPassed);

        this.stakesLabel.setText(

          tFmt('hud.obstacles', { done: state.obstaclesPassed, total: state.obstaclesTotal }),

        );

        this.shipsLabel.setText(tFmt('hud.obstaclesLeft', { left }));

      }

    }



    const combo = state.combo ?? 0;

    if (combo > 1) {

      this.comboLabel.setText(tFmt('common.combo', { combo }));

      if (combo >= COMBO_MILESTONE) {

        this.comboLabel.setColor('#f4d03f');

        this._pulseComboLabel();

      } else {

        this.comboLabel.setColor('#58d68d');

      }

    } else {

      this.comboLabel.setText('');

    }



    const showIntro = state.phase === 'intro';

    this.introOverlay.setVisible(showIntro);

    this.introText.setVisible(showIntro);

    this.starGoalLabel.setVisible(!showIntro);

    this.hookText.setVisible(showIntro);

    this.instruction.setVisible(state.phase === 'playing' || state.phase === 'cooldown');

  }



  _pulseComboLabel() {

    if (this._comboPulse?.isPlaying()) return;

    this._comboPulse = this.scene.tweens.add({

      targets: this.comboLabel,

      scale: { from: 1, to: 1.12 },

      duration: 220,

      yoyo: true,

      ease: 'Sine.easeInOut',

    });

  }



  hideGameplay() {

    this.chapterTitle.setVisible(false);

    this.chapterEra.setVisible(false);

    this.stakesLabel.setVisible(false);

    this.shipsLabel.setVisible(false);

    this.comboLabel.setVisible(false);

    this.instruction.setVisible(false);

    this.introOverlay.setVisible(false);

    this.introText.setVisible(false);

    this.starGoalLabel.setVisible(false);

    this.hookText.setVisible(false);

  }



  setPathDrawFlagPhase(active) {

    if (!active || this.mechanic !== 'path_draw') return;

    this.instruction.setText(t('hud.pathFlag'));

    this.instruction.setColor('#f4d03f');

    this.instruction.setVisible(true);

  }



  setRunnerTankPhase(active) {

    if (!active || this.mechanic !== 'runner') return;

    this.instruction.setText(t('hud.runnerTank'));

    this.instruction.setColor('#f4d03f');

    this.instruction.setVisible(true);

  }

  /** @param {object} [meta] */
  refreshLang(meta) {
    if (meta) this._meta = meta;
    if (this._meta) this.setChapterMeta(this._meta, this.mechanic, this.chapterId);
  }

}

