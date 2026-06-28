import Phaser from 'phaser';
import { FONT_VI } from '../core/fonts.js';
import { t } from '../core/i18n.js';

const ARROW = { up: '↑', down: '↓', left: '←', right: '→' };

/**
 * Swipe direction UI — Chapter 4.
 */
export class SwipeArrowsView {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    const w = scene.cameras.main.width;
    const h = scene.cameras.main.height;

    this.arrowText = scene.add
      .text(w / 2, h * 0.48, '', {
        fontFamily: FONT_VI,
        fontSize: '72px',
        fontStyle: 'bold',
        color: '#f4d03f',
      })
      .setOrigin(0.5)
      .setDepth(14)
      .setAlpha(0);

    this.timerBar = scene.add.rectangle(w / 2, h * 0.58, 200, 8, 0x1a2744).setDepth(13);
    this.timerFill = scene.add
      .rectangle(w / 2 - 100, h * 0.58, 200, 8, 0xe74c3c)
      .setOrigin(0, 0.5)
      .setDepth(14);

    this.feedback = scene.add
      .text(w / 2, h * 0.38, '', {
        fontFamily: FONT_VI,
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#58d68d',
      })
      .setOrigin(0.5)
      .setDepth(15)
      .setAlpha(0);

    this._startX = 0;
    this._startY = 0;
    this._lastGrade = null;
    scene.input.on('pointerdown', this._onDown, this);
    scene.input.on('pointerup', this._onUp, this);
  }

  /** @type {((dx:number,dy:number)=>void)|null} */
  onSwipe = null;

  _onDown(p) {
    this._startX = p.x;
    this._startY = p.y;
  }

  _onUp(p) {
    const dx = p.x - this._startX;
    const dy = p.y - this._startY;
    if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
      this.onSwipe?.(dx, dy);
    }
  }

  /**
   * @param {'up'|'down'|'left'|'right'|null} dir
   * @param {number} timerRatio
   */
  update(dir, timerRatio) {
    if (dir) {
      this.arrowText.setText(ARROW[dir] ?? '');
      this.arrowText.setAlpha(1);
      this.arrowText.setScale(1 + (1 - timerRatio) * 0.15);
    } else {
      this.arrowText.setAlpha(0);
    }
    this.timerFill.width = 200 * timerRatio;
  }

  showFeedback(grade) {
    this._lastGrade = grade;
    this.feedback.setText(grade === 'perfect' ? t('mechanics.swipeBlock') : t('common.miss'));
    this.feedback.setColor(grade === 'perfect' ? '#58d68d' : '#e74c3c');
    this.feedback.setAlpha(1);
    this.scene.tweens.add({ targets: this.feedback, alpha: 0, duration: 400, delay: 150 });
  }

  refreshLang() {
    if (this._lastGrade && this.feedback.alpha > 0) {
      this.feedback.setText(
        this._lastGrade === 'perfect' ? t('mechanics.swipeBlock') : t('common.miss'),
      );
    }
  }

  destroy() {
    this.scene.input.off('pointerdown', this._onDown, this);
    this.scene.input.off('pointerup', this._onUp, this);
    this.arrowText?.destroy();
    this.timerBar?.destroy();
    this.timerFill?.destroy();
    this.feedback?.destroy();
  }
}
