import Phaser from 'phaser';
import { FONT_VI } from '../core/fonts.js';
import { t, tFmt } from '../core/i18n.js';

const GRADE_COLORS = {
  perfect: '#f4d03f',
  great: '#58d68d',
  good: '#85c1e9',
  miss: '#e74c3c',
};

const GRADE_KEYS = {
  perfect: 'common.perfect',
  great: 'common.great',
  good: 'common.good',
  miss: 'common.miss',
};

const STAKE_BAR_H = 20;
const STAKE_GAP = 8;

/**
 * Timing bar UI — view only, no game logic.
 */
export class TimingBarView {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} centerY
   */
  constructor(scene, centerY) {
    this.scene = scene;
    this.y = centerY;
    this.width = 300;
    this.height = 28;
    this.x = scene.cameras.main.width / 2;
    const w = scene.cameras.main.width;
    const h = scene.cameras.main.height;
    this._stakesDriven = 0;
    this._stakesRequired = 10;
    this._lastGrade = null;

    this.container = scene.add.container(this.x, this.y).setDepth(12);

    this.bg = scene.add.rectangle(0, 0, this.width, this.height, 0x1a2744, 0.95);
    this.bg.setStrokeStyle(2, 0x4a6fa5);

    this.zoneGood = scene.add.rectangle(0, 0, 0, this.height - 4, 0x2980b9, 0.35);
    this.zoneGreat = scene.add.rectangle(0, 0, 0, this.height - 4, 0x27ae60, 0.45);
    this.zonePerfect = scene.add.rectangle(0, 0, 0, this.height - 4, 0xf4d03f, 0.55);

    this.marker = scene.add.rectangle(0, 0, 6, this.height + 8, 0xffffff, 1);
    this.marker.setStrokeStyle(2, 0xf4d03f);

    const stakeCenterY = this.height / 2 + STAKE_GAP + STAKE_BAR_H / 2;

    this.stakeLabel = scene.add
      .text(0, stakeCenterY - STAKE_BAR_H / 2 - 12, tFmt('hud.stakes', { done: 0, total: 10 }), {
        fontFamily: FONT_VI,
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#f4d03f',
      })
      .setOrigin(0.5);

    this.stakeBg = scene.add.rectangle(0, stakeCenterY, this.width, STAKE_BAR_H, 0x0d1526, 0.95);
    this.stakeBg.setStrokeStyle(2, 0x8b4513);

    this.stakeFill = scene.add.rectangle(
      -this.width / 2 + 2,
      stakeCenterY,
      0,
      STAKE_BAR_H - 4,
      0xf4d03f,
      0.85,
    );
    this.stakeFill.setOrigin(0, 0.5);

    this.feedbackText = scene.add
      .text(0, -72, '', {
        fontFamily: FONT_VI,
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#f4d03f',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.container.add([
      this.bg,
      this.zoneGood,
      this.zoneGreat,
      this.zonePerfect,
      this.marker,
      this.stakeBg,
      this.stakeFill,
      this.stakeLabel,
      this.feedbackText,
    ]);

    this.tapZone = scene.add
      .rectangle(w / 2, h / 2, w, h, 0xffffff, 0.001)
      .setDepth(17)
      .setVisible(false);

    this.tapZone.on('pointerup', () => {
      if (this._inputEnabled && this.onTap) this.onTap();
    });

    this._inputEnabled = false;
  }

  /** @type {(() => void) | null} */
  onTap = null;

  /**
   * @param {number} position — 0..1
   * @param {number} targetCenter
   * @param {{ perfect: number, great: number, good: number }} zones
   */
  updateMarker(position, targetCenter, zones) {
    const halfW = this.width / 2;
    const px = -halfW + position * this.width;
    this.marker.x = px;

    this.zonePerfect.width = zones.perfect * this.width;
    this.zonePerfect.x = (targetCenter - 0.5) * this.width;

    this.zoneGreat.width = zones.great * this.width;
    this.zoneGreat.x = (targetCenter - 0.5) * this.width;

    this.zoneGood.width = zones.good * this.width;
    this.zoneGood.x = (targetCenter - 0.5) * this.width;
  }

  /**
   * @param {number} driven
   * @param {number} required
   */
  updateStakeProgress(driven, required) {
    this._stakesDriven = driven;
    this._stakesRequired = required;
    const req = Math.max(1, required);
    const ratio = Phaser.Math.Clamp(driven / req, 0, 1);
    const fillW = (this.width - 4) * ratio;
    this.stakeFill.width = fillW;
    this.stakeFill.x = -this.width / 2 + 2 + fillW / 2;
    this.stakeLabel.setText(tFmt('hud.stakes', { done: driven, total: required }));
    if (ratio >= 1) {
      this.stakeFill.setFillStyle(0x58d68d, 0.9);
    } else {
      this.stakeFill.setFillStyle(0xf4d03f, 0.85);
    }
  }

  setActive(active) {
    this.container.setAlpha(active ? 1 : 0.35);
    this._inputEnabled = active;
    if (active) {
      this.tapZone.setVisible(true);
      this.tapZone.setInteractive();
    } else {
      this.tapZone.disableInteractive();
      this.tapZone.setVisible(false);
    }
  }

  /**
   * @param {'perfect'|'great'|'good'|'miss'} grade
   */
  showFeedback(grade) {
    this._lastGrade = grade;
    const key = GRADE_KEYS[grade];
    this.feedbackText.setText(key ? t(key) : '');
    this.feedbackText.setColor(GRADE_COLORS[grade] ?? '#ffffff');
    this.feedbackText.setAlpha(1);
    this.feedbackText.setScale(0.6);
    this.scene.tweens.add({
      targets: this.feedbackText,
      scale: 1.1,
      alpha: 0,
      duration: 700,
      ease: 'Cubic.easeOut',
    });
  }

  refreshLang() {
    this.stakeLabel.setText(
      tFmt('hud.stakes', { done: this._stakesDriven, total: this._stakesRequired }),
    );
    if (this._lastGrade && this.feedbackText.alpha > 0) {
      const key = GRADE_KEYS[this._lastGrade];
      if (key) this.feedbackText.setText(t(key));
    }
  }

  destroy() {
    this.tapZone?.destroy();
    this.container.destroy();
  }
}
