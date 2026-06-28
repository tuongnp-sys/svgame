import { getChapterMeta, getChapterBattleName } from '../../core/chapterConfig.js';
import { getChapterMechanic } from '../../core/chapterControllerFactory.js';
import { createBattleSim } from './BattleSim.js';
import { FONT_VI } from '../../core/fonts.js';
import { getHowToContent, t } from '../../core/i18n.js';
import { pickBilingual } from '../../core/locale.js';

/** Demo zone height — keep footer text below this. */
const DEMO_H = 118;
const FOOTER_GAP = 16;

/**
 * Panel THIS BATTLE — win/lose + mini sim.
 */
export class ChapterBattleBriefingPanel {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} chapterId
   * @param {number} depth
   * @param {number} panelTopY
   * @param {{ compactHeader?: boolean }} [options]
   */
  constructor(scene, chapterId, depth, panelTopY = 200, options = {}) {
    this.scene = scene;
    this.nodes = [];
    const w = scene.cameras.main.width;
    const content = getHowToContent(chapterId);
    const meta = getChapterMeta(chapterId);
    const mechanic = getChapterMechanic(chapterId);
    const compact = options.compactHeader === true;

    const track = (o) => {
      this.nodes.push(o);
      return o;
    };

    let cursorY = panelTopY;

    if (!compact) {
      track(
        scene.add
          .text(w / 2, cursorY, getChapterBattleName(chapterId), {
            fontFamily: FONT_VI,
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#ffffff',
          })
          .setOrigin(0.5, 0)
          .setDepth(depth),
      );
      cursorY += 24;
    }

    if (content.era) {
      track(
        scene.add
          .text(w / 2, cursorY, content.era, {
            fontFamily: FONT_VI,
            fontSize: '11px',
            color: '#95a5a6',
          })
          .setOrigin(0.5, 0)
          .setDepth(depth),
      );
      cursorY += 22;
    }

    const winY = cursorY + 8;
    track(
      scene.add
        .text(28, winY, t('howTo.winWhen'), {
          fontFamily: FONT_VI,
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#58d68d',
        })
        .setDepth(depth),
    );
    track(
      scene.add
        .text(28, winY + 20, content.win.map((l) => `• ${l}`).join('\n'), {
          fontFamily: FONT_VI,
          fontSize: '11px',
          color: '#dfe6e9',
          lineSpacing: 5,
          wordWrap: { width: w / 2 - 36 },
        })
        .setDepth(depth),
    );

    track(
      scene.add
        .text(w / 2 + 8, winY, t('howTo.loseWhen'), {
          fontFamily: FONT_VI,
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#e74c3c',
        })
        .setDepth(depth),
    );
    track(
      scene.add
        .text(w / 2 + 8, winY + 20, content.lose.map((l) => `• ${l}`).join('\n'), {
          fontFamily: FONT_VI,
          fontSize: '11px',
          color: '#dfe6e9',
          lineSpacing: 5,
          wordWrap: { width: w / 2 - 36 },
        })
        .setDepth(depth),
    );

    const demoLabelY = winY + 76;
    track(
      scene.add
        .text(w / 2, demoLabelY, t('howTo.simLabel'), {
          fontFamily: FONT_VI,
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#f4d03f',
        })
        .setOrigin(0.5)
        .setDepth(depth),
    );

    const demoCenterY = demoLabelY + 24 + DEMO_H / 2;
    this.sim = createBattleSim(scene, chapterId, mechanic, w / 2, demoCenterY, depth);

    const footerY = demoLabelY + 24 + DEMO_H + FOOTER_GAP;
    track(
      scene.add
        .text(w / 2, footerY, `${t('howTo.actionFooter')} ${content.action}`, {
          fontFamily: FONT_VI,
          fontSize: '11px',
          color: '#95a5a6',
          align: 'center',
          wordWrap: { width: w - 56 },
        })
        .setOrigin(0.5, 0)
        .setDepth(depth),
    );

    const hook = pickBilingual(meta?.hook);
    if (hook) {
      track(
        scene.add
          .text(w / 2, footerY + 36, hook, {
            fontFamily: FONT_VI,
            fontSize: '10px',
            fontStyle: 'italic',
            color: '#636e72',
            align: 'center',
            wordWrap: { width: w - 56 },
            lineSpacing: 4,
          })
          .setOrigin(0.5, 0)
          .setDepth(depth),
      );
    }
  }

  destroy() {
    this.sim?.destroy();
    this.sim = null;
    for (const n of this.nodes) n.destroy();
    this.nodes = [];
  }
}
