import { getLeaderboard } from '../core/Leaderboard.js';
import { createPillButton } from './phaserUi.js';
import { FONT_VI } from '../core/fonts.js';
import { wireOverlayLang } from './langOverlayHelper.js';

import { t, tFmt } from '../core/i18n.js';

export class LeaderboardOverlayView {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    const w = scene.cameras.main.width;
    const h = scene.cameras.main.height;

    this.scene = scene;
    this.nodes = [];

    const backdrop = scene.add
      .rectangle(w / 2, h / 2, w, h, 0x000000, 0.75)
      .setInteractive()
      .setDepth(88);
    this.nodes.push(backdrop);

    const panel = scene.add.rectangle(w / 2, h * 0.48, w - 32, 400, 0x1a2744, 0.98).setDepth(89);
    panel.setStrokeStyle(2, 0xf4d03f);
    this.nodes.push(panel);

    const title = scene.add
      .text(w / 2, h * 0.28, t('leaderboard.title'), {
        fontFamily: FONT_VI,
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#f4d03f',
      })
      .setOrigin(0.5)
      .setDepth(90);
    this.titleText = title;
    this.nodes.push(title);

    const entries = getLeaderboard();
    const lines =
      entries.length === 0
        ? [t('leaderboard.empty')]
        : entries.map((e, i) =>
            tFmt('leaderboard.entry', {
              rank: i + 1,
              name: e.name,
              score: e.score,
              chapter: e.chapterId,
              stars: '★'.repeat(e.stars),
            }),
          );

    const body = scene.add
      .text(w / 2, h * 0.46, lines.join('\n'), {
        fontFamily: FONT_VI,
        fontSize: '13px',
        color: '#dfe6e9',
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5)
      .setDepth(90);
    this.bodyText = body;
    this.nodes.push(body);

    this.closeBtn = createPillButton(scene, w / 2, h * 0.68, 160, 40, t('common.close'), () => this.destroy(), true);
    this.closeBtn.setDepth(90);
    this.nodes.push(this.closeBtn);
    wireOverlayLang(scene, this, 92);
  }

  refreshLang() {
    this.titleText?.setText(t('leaderboard.title'));
    const entries = getLeaderboard();
    const lines =
      entries.length === 0
        ? [t('leaderboard.empty')]
        : entries.map((e, i) =>
            tFmt('leaderboard.entry', {
              rank: i + 1,
              name: e.name,
              score: e.score,
              chapter: e.chapterId,
              stars: '★'.repeat(e.stars),
            }),
          );
    this.bodyText?.setText(lines.join('\n'));
    this.closeBtn?.setLabel(t('common.close'));
  }

  destroy() {
    for (const n of this.nodes) n.destroy();
    this.nodes = [];
  }
}
