import { FONT_VI } from '../../core/fonts.js';
import { t } from '../../core/i18n.js';
/**
 * Demo animation — vòng tròn rhythm (chương 1).
 * @param {Phaser.Scene} scene
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} depth
 */
export function createRhythmHowToDemo(scene, centerX, centerY, depth) {
  const nodes = [];
  const track = (o) => {
    nodes.push(o);
    return o;
  };

  const zone = track(
    scene.add.circle(centerX, centerY, 34, 0xf4d03f, 0.15).setDepth(depth).setStrokeStyle(3, 0xf4d03f, 0.85),
  );

  const note = track(
    scene.add.circle(centerX, centerY - 120, 16, 0x2d6a6a, 1).setDepth(depth + 1).setStrokeStyle(2, 0xf4d03f),
  );

  const tapHint = track(
    scene.add
      .text(centerX, centerY - 56, '', {
        fontFamily: FONT_VI,
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#f4d03f',
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(depth + 2),
  );

  const tween = scene.tweens.add({
    targets: note,
    y: centerY + 50,
    duration: 2200,
    repeat: -1,
    ease: 'Linear',
    onRepeat: () => {
      note.y = centerY - 120;
    },
    onUpdate: () => {
      const d = Math.abs(note.y - centerY);
      if (d < 22) {
        tapHint.setText(t('common.tap'));
        tapHint.setAlpha(1);
        zone.setFillStyle(0x58d68d, 0.35);
        zone.setStrokeStyle(3, 0x58d68d, 1);
      } else {
        tapHint.setAlpha(0);
        zone.setFillStyle(0xf4d03f, 0.15);
        zone.setStrokeStyle(3, 0xf4d03f, 0.85);
      }
    },
  });

  return {
    destroy() {
      tween.stop();
      for (const n of nodes) n.destroy();
    },
  };
}
