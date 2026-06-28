import Phaser from 'phaser';
import { FONT_VI } from '../core/fonts.js';
import { t } from '../core/i18n.js';

/**
 * Rhythm lane view for Chapter 1.
 */
export class RhythmLaneView {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    const w = scene.cameras.main.width;
    this.hitY = 560;
    this.noteSprites = [];

    this.zone = scene.add.circle(w / 2, this.hitY, 34, 0xf4d03f, 0.15).setDepth(11);
    this.zone.setStrokeStyle(3, 0xf4d03f, 0.8);

    this.noteGroup = scene.add.group();
    this.feedback = scene.add
      .text(w / 2, scene.cameras.main.height * 0.45, '', {
        fontFamily: FONT_VI,
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#f4d03f',
      })
      .setOrigin(0.5)
      .setDepth(15)
      .setAlpha(0);

    this.instructionText = scene.add
      .text(w / 2, 680, t('mechanics.rhythmHint'), {
        fontFamily: FONT_VI,
        fontSize: '13px',
        color: '#95a5a6',
      })
      .setOrigin(0.5)
      .setDepth(15);

    this.tapArea = scene.add
      .rectangle(w / 2, scene.cameras.main.height / 2, w, scene.cameras.main.height, 0xffffff, 0.001)
      .setInteractive()
      .setDepth(20);
    this.tapArea.on('pointerdown', () => {
      if (this.onTap) this.onTap();
    });
  }

  /** @type {(() => void)|null} */
  onTap = null;

  /**
   * @param {Array<{id:number,y:number,resolved?:boolean}>} notes
   */
  syncNotes(notes) {
    const w = this.scene.cameras.main.width;
    const active = notes.filter((n) => !n.resolved);

    while (this.noteSprites.length < active.length) {
      const s = this.scene.add.circle(w / 2, 0, 16, 0x2d6a6a, 1).setDepth(12);
      s.setStrokeStyle(2, 0xf4d03f);
      this.noteGroup.add(s);
      this.noteSprites.push(s);
    }

    for (let i = 0; i < this.noteSprites.length; i++) {
      const sprite = this.noteSprites[i];
      const note = active[i];
      if (!note) {
        sprite.setVisible(false);
        continue;
      }
      sprite.setVisible(true);
      sprite.y = note.y;
    }
  }

  showFeedback(grade) {
    const labels = {
      perfect: t('common.perfect'),
      great: t('common.great'),
      good: t('common.good'),
      miss: t('common.miss'),
    };
    const colors = { perfect: '#f4d03f', great: '#58d68d', good: '#85c1e9', miss: '#e74c3c' };
    this.feedback.setText(labels[grade] ?? '');
    this.feedback.setColor(colors[grade] ?? '#fff');
    this.feedback.setAlpha(1);
    this.scene.tweens.add({ targets: this.feedback, alpha: 0, duration: 500, delay: 200 });
  }

  setInputEnabled(enabled) {
    if (enabled) {
      this.tapArea.setInteractive();
    } else {
      this.tapArea.disableInteractive();
    }
  }

  refreshLang() {
    this.instructionText?.setText(t('mechanics.rhythmHint'));
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    this.onTap = null;

    this.tapArea?.destroy();
    this.zone?.destroy();
    this.feedback?.destroy();

    for (const sprite of this.noteSprites) {
      if (sprite?.active) sprite.destroy();
    }
    this.noteSprites.length = 0;

    if (this.noteGroup?.scene) {
      this.noteGroup.destroy(true);
    }
    this.noteGroup = null;
  }
}
