import { getChapterMeta, getChapterBattleName } from '../core/chapterConfig.js';

import { markBriefingSeen } from '../core/saveProgress.js';

import { createPillButton } from './phaserUi.js';

import { wireOverlayLang } from './langOverlayHelper.js';

import { ChapterBattleBriefingPanel } from './howTo/ChapterBattleBriefingPanel.js';

import { FONT_VI } from '../core/fonts.js';

import { getHowToContent, t } from '../core/i18n.js';

import { pickBilingual } from '../core/locale.js';



/**

 * Briefing trận trước khi vào chương (lần đầu) — có thể bỏ qua.

 */

export class BattleBriefingOverlayView {

  /**

   * @param {Phaser.Scene} scene

   * @param {number} chapterId

   * @param {() => void} onEnter

   */

  constructor(scene, chapterId, onEnter) {

    this.scene = scene;

    this.chapterId = chapterId;

    this.onEnter = onEnter;

    const w = scene.cameras.main.width;

    const h = scene.cameras.main.height;

    this.depth = 82;

    this.nodes = [];



    const content = getHowToContent(chapterId);

    const meta = getChapterMeta(chapterId);



    this.nodes.push(scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.9).setDepth(this.depth));

    this.nodes.push(

      scene.add

        .rectangle(w / 2, h * 0.5, w - 24, h - 56, 0x1a2744, 0.98)

        .setDepth(this.depth + 1)

        .setStrokeStyle(2, 0xf4d03f),

    );



    this.nodes.push(

      scene.add

        .text(w / 2, h * 0.055, t('briefing.title'), {

          fontFamily: FONT_VI,

          fontSize: '22px',

          fontStyle: 'bold',

          color: '#f4d03f',

        })

        .setOrigin(0.5)

        .setDepth(this.depth + 2),

    );

    this.titleText = this.nodes[this.nodes.length - 1];



    this.nodes.push(

      scene.add

        .text(w / 2, h * 0.095, pickBilingual(meta?.hook) || content.title, {

          fontFamily: FONT_VI,

          fontSize: '12px',

          color: '#95a5a6',

          align: 'center',

          wordWrap: { width: w - 48 },

        })

        .setOrigin(0.5)

        .setDepth(this.depth + 2),

    );

    this.hookText = this.nodes[this.nodes.length - 1];



    this.panel = new ChapterBattleBriefingPanel(scene, chapterId, this.depth + 2, h * 0.12);



    this.skipBtn = createPillButton(

      scene,

      w / 2 - 72,

      h * 0.9,

      130,

      44,

      t('common.skip'),

      () => this._enter(true),

      true,

    ).setDepth(this.depth + 5);



    this.enterBtn = createPillButton(

      scene,

      w / 2 + 72,

      h * 0.9,

      130,

      44,

      t('common.play'),

      () => this._enter(true),

      false,

    ).setDepth(this.depth + 5);

    wireOverlayLang(scene, this, this.depth + 20);
  }



  refreshLang() {
    const content = getHowToContent(this.chapterId);
    const meta = getChapterMeta(this.chapterId);
    this.titleText?.setText(t('briefing.title'));
    this.hookText?.setText(pickBilingual(meta?.hook) || content.title);
    this.panel?.destroy();
    const h = this.scene.cameras.main.height;
    this.panel = new ChapterBattleBriefingPanel(this.scene, this.chapterId, this.depth + 2, h * 0.12);
    this.skipBtn?.setLabel(t('common.skip'));
    this.enterBtn?.setLabel(t('common.play'));
  }



  _enter(markSeen) {

    if (markSeen) markBriefingSeen(this.chapterId);

    this.destroy();

  }



  destroy(silent = false) {

    if (this._done) return;

    this._done = true;

    this.panel?.destroy();

    this.enterBtn?.destroy();

    this.skipBtn?.destroy();

    for (const n of this.nodes) n.destroy();

    if (!silent) this.onEnter?.();

  }

}

