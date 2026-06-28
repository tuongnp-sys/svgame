import Phaser from 'phaser';
import { createPillButton } from './phaserUi.js';
import { FONT_VI } from '../core/fonts.js';
import { wireOverlayLang } from './langOverlayHelper.js';

import { t } from '../core/i18n.js';

/**
 * Tutorial chương 2 — thanh timing bar, hiện trước khi chơi lần đầu.
 */
export class TimingBarTutorialView {
  /**
   * @param {Phaser.Scene} scene
   * @param {() => void} onDone
   */
  constructor(scene, onDone) {
    this.scene = scene;
    this.onDone = onDone;
    const w = scene.cameras.main.width;
    const h = scene.cameras.main.height;
    this.depth = 80;

    this.nodes = [];
    const track = (obj) => {
      this.nodes.push(obj);
      return obj;
    };

    this.backdrop = track(scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.82).setDepth(this.depth));
    this.panel = track(
      scene.add
        .rectangle(w / 2, h * 0.46, w - 32, 480, 0x1a2744, 0.98)
        .setDepth(this.depth + 1)
        .setStrokeStyle(2, 0xf4d03f),
    );

    track(
      scene.add
        .text(w / 2, h * 0.2, t('tutorial.title'), {
          fontFamily: FONT_VI,
          fontSize: '22px',
          fontStyle: 'bold',
          color: '#f4d03f',
        })
        .setOrigin(0.5)
        .setDepth(this.depth + 2),
    );
    this.titleText = this.nodes[this.nodes.length - 1];

    track(
      scene.add
        .text(w / 2, h * 0.26, t('tutorial.bachDangTitle'), {
          fontFamily: FONT_VI,
          fontSize: '14px',
          color: '#dfe6e9',
        })
        .setOrigin(0.5)
        .setDepth(this.depth + 2),
    );
    this.subtitleText = this.nodes[this.nodes.length - 1];

    const steps = [t('tutorial.timingStep1'), t('tutorial.timingStep2'), t('tutorial.step3')];
    track(
      scene.add
        .text(w / 2, h * 0.34, steps.join('\n\n'), {
          fontFamily: FONT_VI,
          fontSize: '13px',
          color: '#ffffff',
          align: 'center',
          lineSpacing: 6,
          wordWrap: { width: w - 72 },
        })
        .setOrigin(0.5, 0)
        .setDepth(this.depth + 2),
    );
    this.stepsText = this.nodes[this.nodes.length - 1];

    this._buildDemoBar(w, h * 0.58, track);

    track(
      scene.add
        .text(w / 2, h * 0.7, t('tutorial.tapLikeThis'), {
          fontFamily: FONT_VI,
          fontSize: '12px',
          color: '#95a5a6',
        })
        .setOrigin(0.5)
        .setDepth(this.depth + 2),
    );
    this.tapLikeText = this.nodes[this.nodes.length - 1];

    this.startBtn = createPillButton(scene, w / 2, h * 0.8, 280, 52, t('tutorial.startPlay'), () => this.destroy(), false).setDepth(
      this.depth + 5,
    );
    wireOverlayLang(scene, this, this.depth + 20);
  }

  refreshLang() {
    this.titleText?.setText(t('tutorial.title'));
    this.subtitleText?.setText(t('tutorial.bachDangTitle'));
    const steps = [t('tutorial.timingStep1'), t('tutorial.timingStep2'), t('tutorial.step3')];
    this.stepsText?.setText(steps.join('\n\n'));
    this.tapLikeText?.setText(t('tutorial.tapLikeThis'));
    this.startBtn?.setLabel(t('tutorial.startPlay'));
    if (this.tapHint?.alpha > 0) {
      this.tapHint.setText(t('common.tap'));
    }
  }

  /**
   * @param {number} w
   * @param {number} centerY
   * @param {(obj: Phaser.GameObjects.GameObject) => Phaser.GameObjects.GameObject} track
   */
  _buildDemoBar(w, centerY, track) {
    const barW = 280;
    const barH = 28;
    const x = w / 2;

    const bg = track(
      this.scene.add
        .rectangle(x, centerY, barW, barH, 0x1a2744, 0.95)
        .setDepth(this.depth + 2)
        .setStrokeStyle(2, 0x4a6fa5),
    );

    const zone = track(
      this.scene.add
        .rectangle(x, centerY, barW * 0.22, barH - 4, 0xf4d03f, 0.55)
        .setDepth(this.depth + 2),
    );

    const marker = track(
      this.scene.add
        .rectangle(x - barW * 0.35, centerY, 6, barH + 8, 0xffffff, 1)
        .setDepth(this.depth + 3)
        .setStrokeStyle(2, 0xf4d03f),
    );

    this.demoMarker = marker;
    this.demoZone = zone;
    this.demoBarW = barW;
    this.demoCenterX = x;
    this.demoCenterY = centerY;

    this.tween = this.scene.tweens.add({
      targets: marker,
      x: x + barW * 0.35,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: () => this._pulseWhenAligned(),
    });

    this.tapHint = track(
      this.scene.add
        .text(x, centerY - 48, '', {
          fontFamily: FONT_VI,
          fontSize: '16px',
          fontStyle: 'bold',
          color: '#f4d03f',
        })
        .setOrigin(0.5)
        .setAlpha(0)
        .setDepth(this.depth + 4),
    );
  }

  _pulseWhenAligned() {
    if (!this.demoMarker || !this.demoZone) return;
    const dx = Math.abs(this.demoMarker.x - this.demoZone.x);
    if (dx < 18) {
      this.tapHint.setText(t('common.tap'));
      this.tapHint.setAlpha(1);
      this.demoZone.setFillStyle(0x58d68d, 0.7);
    } else {
      this.tapHint.setAlpha(0);
      this.demoZone.setFillStyle(0xf4d03f, 0.55);
    }
  }

  /**
   * @param {boolean} [silent]
   */
  destroy(silent = false) {
    if (this._done) return;
    this._done = true;
    this.tween?.stop();
    this.startBtn?.destroy();
    for (const node of this.nodes ?? []) node.destroy();
    if (!silent) this.onDone?.();
  }
}
