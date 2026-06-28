import Phaser from 'phaser';
import { markIntroSeen } from './core/saveProgress.js';
import { goToHub } from './core/sceneTransition.js';
import { INTRO_SCENE_AUTO_MS } from './core/chapterConstants.js';
import { FONT_VI } from './core/fonts.js';
import { t } from './core/i18n.js';
import { subscribeLangChange } from './core/locale.js';
import { createLangToggle } from './ui/LangToggle.js';

/**
 * Cold open — short hook before Hub.
 */
export class IntroScene extends Phaser.Scene {
  constructor() {
    super('IntroScene');
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.cameras.main.setBackgroundColor('#000000');

    const map = this.add
      .image(w / 2, h * 0.42, 'game_assets', 'fog_map')
      .setAlpha(0)
      .setScale(1.1);

    const crack = this.add.circle(w / 2, h * 0.38, 8, 0x9b59b6, 0).setStrokeStyle(4, 0xc39bd3, 0);

    this._title = this.add
      .text(w / 2, h * 0.55, '', {
        fontFamily: FONT_VI,
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#f4d03f',
        align: 'center',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this._sub = this.add
      .text(w / 2, h * 0.62, '', {
        fontFamily: FONT_VI,
        fontSize: '13px',
        color: '#95a5a6',
        align: 'center',
        wordWrap: { width: w - 48 },
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this._tap = this.add
      .text(w / 2, h * 0.82, '', {
        fontFamily: FONT_VI,
        fontSize: '14px',
        color: '#dfe6e9',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    createLangToggle(this, 25);

    const unsubLang = subscribeLangChange(() => this._refreshLang());
    this.events.once('shutdown', unsubLang);

    this.tweens.add({
      targets: map,
      alpha: 0.9,
      duration: 500,
      ease: 'Sine.easeOut',
    });

    this.time.delayedCall(250, () => {
      this.tweens.add({
        targets: crack,
        alpha: 1,
        scale: 3,
        duration: 450,
        ease: 'Back.easeOut',
      });
      this.cameras.main.shake(180, 0.006);
    });

    this.time.delayedCall(550, () => {
      this._title.setText(t('intro.title'));
      this._sub.setText(t('intro.subtitle'));
      this.tweens.add({ targets: [this._title, this._sub], alpha: 1, duration: 350 });
    });

    this.time.delayedCall(1200, () => {
      this._tap.setText(t('intro.tapToEnter'));
      this.tweens.add({
        targets: this._tap,
        alpha: 1,
        duration: 300,
        onComplete: () => {
          this.tweens.add({
            targets: this._tap,
            alpha: 0.35,
            duration: 500,
            yoyo: true,
            repeat: -1,
          });
        },
      });
    });

    const goHub = async () => {
      if (this._going) return;
      this._going = true;
      if (this.sound.context?.state === 'suspended') {
        await this.sound.context.resume();
      }
      markIntroSeen();
      goToHub(this);
    };

    // Tap zone below top chrome (VN/EN toggle) — not whole-scene pointerdown
    const topChrome = 88;
    this.add
      .rectangle(w / 2, topChrome + (h - topChrome) / 2, w, h - topChrome, 0xffffff, 0.001)
      .setDepth(10)
      .setInteractive({ useHandCursor: true })
      .once('pointerup', goHub);

    this.input.keyboard?.once('keydown-SPACE', goHub);
    this.time.delayedCall(INTRO_SCENE_AUTO_MS, goHub);
  }

  _refreshLang() {
    if (this._title?.alpha > 0) this._title.setText(t('intro.title'));
    if (this._sub?.alpha > 0) this._sub.setText(t('intro.subtitle'));
    if (this._tap?.alpha > 0) this._tap.setText(t('intro.tapToEnter'));
  }
}
