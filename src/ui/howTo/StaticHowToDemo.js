import { FONT_VI } from '../../core/fonts.js';
import { t } from '../../core/i18n.js';
/**
 * Minh họa tĩnh cho chương 3–6 (thao tác, không gameplay).
 * @param {Phaser.Scene} scene
 * @param {string} mechanic
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} depth
 * @param {{ compact?: boolean }} [options]
 */
export function createStaticHowToDemo(scene, mechanic, centerX, centerY, depth, options = {}) {
  const { compact = false } = options;
  const nodes = [];
  const track = (o) => {
    nodes.push(o);
    return o;
  };

  if (mechanic === 'binary_choice') {
    track(
      scene.add
        .text(centerX, centerY - 50, t('howToDemo.enemyThreat'), {
          fontFamily: FONT_VI,
          fontSize: '12px',
          color: '#dfe6e9',
        })
        .setOrigin(0.5)
        .setDepth(depth),
    );
    track(scene.add.rectangle(centerX, centerY - 20, 200, 6, 0xf4d03f).setDepth(depth));
    const fight = track(
      scene.add.rectangle(centerX - 58, centerY + 20, 100, 40, 0xf4d03f).setDepth(depth),
    );
    const peace = track(
      scene.add.rectangle(centerX + 58, centerY + 20, 100, 40, 0xb2bec3).setDepth(depth),
    );
    track(
      scene.add
        .text(fight.x, fight.y, t('mechanics.fight'), { fontSize: '14px', fontStyle: 'bold', color: '#1a1628' })
        .setOrigin(0.5)
        .setDepth(depth + 1),
    );
    track(
      scene.add
        .text(peace.x, peace.y, t('mechanics.peace'), { fontSize: '14px', fontStyle: 'bold', color: '#2d3436' })
        .setOrigin(0.5)
        .setDepth(depth + 1),
    );
    track(
      scene.add
        .text(centerX, centerY + 72, t('howToDemo.tapOneBtn'), {
          fontFamily: FONT_VI,
          fontSize: '11px',
          color: '#95a5a6',
        })
        .setOrigin(0.5)
        .setDepth(depth),
    );
  } else if (mechanic === 'rhythm_swipe') {
    track(
      scene.add
        .text(centerX, centerY - 10, '↑', {
          fontFamily: FONT_VI,
          fontSize: '56px',
          fontStyle: 'bold',
          color: '#f4d03f',
        })
        .setOrigin(0.5)
        .setDepth(depth),
    );
    track(
      scene.add
        .text(centerX, centerY + 50, t('howToDemo.swipeUp'), {
          fontFamily: FONT_VI,
          fontSize: '12px',
          color: '#95a5a6',
        })
        .setOrigin(0.5)
        .setDepth(depth),
    );
    if (!compact) {
      const arrow = track(
        scene.add
          .text(centerX, centerY + 78, t('howToDemo.dragFinger'), {
            fontFamily: FONT_VI,
            fontSize: '11px',
            color: '#58d68d',
          })
          .setOrigin(0.5)
          .setDepth(depth),
      );
      scene.tweens.add({
        targets: arrow,
        y: centerY + 62,
        duration: 700,
        yoyo: true,
        repeat: -1,
      });
    }
  } else if (mechanic === 'path_draw') {
    const pts = [
      { x: centerX - 70, y: centerY - 40 },
      { x: centerX - 20, y: centerY },
      { x: centerX + 40, y: centerY + 30 },
      { x: centerX + 80, y: centerY - 10 },
    ];
    const g = track(scene.add.graphics().setDepth(depth));
    g.lineStyle(3, 0xf4d03f, 0.8);
    g.beginPath();
    g.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
    g.strokePath();
    for (const p of pts) {
      track(scene.add.circle(p.x, p.y, 10, 0x2d6a6a, 1).setDepth(depth + 1).setStrokeStyle(2, 0xf4d03f));
    }
    track(
      scene.add.circle(centerX + 10, centerY + 10, 22, 0x3498db, 0.25).setDepth(depth).setStrokeStyle(2, 0x2980b9),
    );
    track(
      scene.add
        .text(centerX, centerY + 58, t('howToDemo.connectDots'), {
          fontFamily: FONT_VI,
          fontSize: '11px',
          color: '#95a5a6',
        })
        .setOrigin(0.5)
        .setDepth(depth),
    );
  } else if (mechanic === 'runner') {
    track(scene.add.rectangle(centerX - 55, centerY, 90, 50, 0x1a2744, 0.6).setDepth(depth));
    track(scene.add.rectangle(centerX + 55, centerY, 90, 50, 0x1a2744, 0.6).setDepth(depth));
    track(
      scene.add
        .text(centerX - 55, centerY, t('howToDemo.left'), { fontSize: '11px', color: '#58d68d' })
        .setOrigin(0.5)
        .setDepth(depth + 1),
    );
    track(
      scene.add
        .text(centerX + 55, centerY, t('howToDemo.right'), { fontSize: '11px', color: '#58d68d' })
        .setOrigin(0.5)
        .setDepth(depth + 1),
    );
    track(scene.add.circle(centerX, centerY - 35, 10, 0xf4d03f, 1).setDepth(depth + 1));
    track(
      scene.add
        .text(centerX, centerY + 42, t('howToDemo.thenJump'), {
          fontFamily: FONT_VI,
          fontSize: '10px',
          color: '#95a5a6',
          align: 'center',
          wordWrap: { width: 200 },
        })
        .setOrigin(0.5)
        .setDepth(depth),
    );
  }

  return {
    destroy() {
      for (const n of nodes) n.destroy();
    },
  };
}
