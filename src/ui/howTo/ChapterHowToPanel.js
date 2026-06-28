import { getChapterMeta, getChapterBattleName } from '../../core/chapterConfig.js';
import { getChapterMechanic } from '../../core/chapterControllerFactory.js';
import { createRhythmHowToDemo } from './RhythmHowToDemo.js';
import { createTimingBarHowToDemo } from './TimingBarHowToDemo.js';
import { createStaticHowToDemo } from './StaticHowToDemo.js';
import { FONT_VI } from '../../core/fonts.js';
import { getHowToContent, t } from '../../core/i18n.js';
import { pickBilingual } from '../../core/locale.js';

const DEMO_H = 118;
const FOOTER_GAP = 16;

/**
 * Nội dung hướng dẫn 1 chương (demo + text thao tác).
 */
export class ChapterHowToPanel {
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
      cursorY += 28;
    }

    track(
      scene.add
        .text(w / 2, cursorY, compact ? content.action : `${t('howTo.controlsPrefix')} ${content.action}`, {
          fontFamily: FONT_VI,
          fontSize: compact ? '12px' : '13px',
          fontStyle: 'bold',
          color: '#f4d03f',
          align: 'center',
          wordWrap: { width: w - 56 },
          lineSpacing: 4,
        })
        .setOrigin(0.5, 0)
        .setDepth(depth),
    );

    const stepsText = content.steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
    const stepsY = cursorY + (compact ? 36 : 50);
    track(
      scene.add
        .text(28, stepsY, stepsText, {
          fontFamily: FONT_VI,
          fontSize: '12px',
          color: '#dfe6e9',
          lineSpacing: 6,
          wordWrap: { width: w - 56 },
        })
        .setOrigin(0, 0)
        .setDepth(depth),
    );

    const stepsLines = content.steps.length;
    const demoLabelY = stepsY + stepsLines * 22 + 12;
    track(
      scene.add
        .text(w / 2, demoLabelY, t('howTo.demoLabel'), {
          fontFamily: FONT_VI,
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#f4d03f',
        })
        .setOrigin(0.5)
        .setDepth(depth),
    );

    const demoCenterY = demoLabelY + 20 + DEMO_H / 2;
    if (mechanic === 'rhythm') {
      this.demo = createRhythmHowToDemo(scene, w / 2, demoCenterY, depth + 1);
    } else if (mechanic === 'timing_bar') {
      this.demo = createTimingBarHowToDemo(scene, w / 2, demoCenterY, depth + 1);
    } else {
      this.demo = createStaticHowToDemo(scene, mechanic, w / 2, demoCenterY, depth + 1);
    }

    const footerY = demoLabelY + 20 + DEMO_H + FOOTER_GAP;
    track(
      scene.add
        .text(28, footerY, `${t('howTo.avoid')} ${content.mistakes.join(' · ')}`, {
          fontFamily: FONT_VI,
          fontSize: '11px',
          color: '#95a5a6',
          wordWrap: { width: w - 56 },
          lineSpacing: 5,
        })
        .setOrigin(0, 0)
        .setDepth(depth),
    );

    const hook = pickBilingual(meta?.hook);
    if (hook) {
      track(
        scene.add
          .text(w / 2, footerY + 48, hook, {
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
    this.demo?.destroy();
    this.demo = null;
    for (const n of this.nodes) n.destroy();
    this.nodes = [];
  }
}
