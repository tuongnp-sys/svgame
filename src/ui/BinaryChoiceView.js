import Phaser from 'phaser';
import { createPillButton } from './phaserUi.js';
import { FONT_VI } from '../core/fonts.js';
import { t, tFmt } from '../core/i18n.js';

/**
 * PEACE / FIGHT choice UI for Chapter 3.
 */
export class BinaryChoiceView {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    const w = scene.cameras.main.width;
    const h = scene.cameras.main.height;

    this.promptText = scene.add
      .text(w / 2, h * 0.32, '', {
        fontFamily: FONT_VI,
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: w - 48 },
      })
      .setOrigin(0.5)
      .setDepth(15);

    this.timerBar = scene.add.rectangle(w / 2, h * 0.4, 260, 8, 0x1a2744).setDepth(14);
    this.timerFill = scene.add
      .rectangle(w / 2 - 130, h * 0.4, 260, 8, 0xf4d03f)
      .setOrigin(0, 0.5)
      .setDepth(15);

    this.fightBtn = createPillButton(scene, w / 2 - 78, h * 0.52, 140, 56, t('mechanics.fight'), () => {
      this.onChoice?.('fight');
    });
    this.fightBtn.setDepth(16);

    this.peaceBtn = createPillButton(
      scene,
      w / 2 + 78,
      h * 0.52,
      140,
      56,
      t('mechanics.peace'),
      () => {
        this.onChoice?.('peace');
      },
      true,
    );
    this.peaceBtn.setDepth(16);

    this.statsText = scene.add
      .text(w / 2, h * 0.64, '', {
        fontFamily: FONT_VI,
        fontSize: '12px',
        color: '#95a5a6',
      })
      .setOrigin(0.5)
      .setDepth(15);

    this.hintText = scene.add
      .text(w / 2, 680, t('mechanics.binaryHint'), {
        fontFamily: FONT_VI,
        fontSize: '12px',
        color: '#636e72',
      })
      .setOrigin(0.5)
      .setDepth(15);
  }

  refreshLang() {
    this.fightBtn.setLabel(t('mechanics.fight'));
    this.peaceBtn.setLabel(t('mechanics.peace'));
    this.hintText.setText(t('mechanics.binaryHint'));
  }

  /** @type {((c: 'fight'|'peace') => void)|null} */
  onChoice = null;

  /**
   * @param {string} prompt
   * @param {number} timerRatio — 0..1
   * @param {{ fight: number, peace: number, round: number, total: number }} stats
   */
  update(prompt, timerRatio, stats) {
    this.promptText.setText(prompt);
    this.timerFill.width = 260 * Phaser.Math.Clamp(timerRatio, 0, 1);
    this.statsText.setText(
      tFmt('mechanics.binaryStats', {
        round: stats.round,
        total: stats.total,
        fight: stats.fight,
        peace: stats.peace,
      }),
    );
  }

  flashWrong() {
    this.scene.cameras.main.flash(180, 200, 50, 50, false);
  }

  destroy() {
    this.promptText?.destroy();
    this.timerBar?.destroy();
    this.timerFill?.destroy();
    this.statsText?.destroy();
    this.fightBtn?.destroy();
    this.peaceBtn?.destroy();
    this.hintText?.destroy();
  }
}
