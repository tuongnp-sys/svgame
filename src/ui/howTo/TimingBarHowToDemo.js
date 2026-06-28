import { FONT_VI } from '../../core/fonts.js';
import { t, tFmt } from '../../core/i18n.js';
/**
 * Demo animation — thanh timing + thanh cọc (chương 2).
 * @param {Phaser.Scene} scene
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} depth
 */
export function createTimingBarHowToDemo(scene, centerX, centerY, depth) {
  const nodes = [];
  const track = (o) => {
    nodes.push(o);
    return o;
  };

  const barW = 260;
  const barH = 24;
  const stakeBarH = 18;
  const timingY = centerY - 16;
  const stakeY = centerY + 22;

  track(
    scene.add
      .rectangle(centerX, timingY, barW, barH, 0x1a2744, 0.95)
      .setDepth(depth)
      .setStrokeStyle(2, 0x4a6fa5),
  );

  const zone = track(
    scene.add.rectangle(centerX, timingY, barW * 0.22, barH - 4, 0xf4d03f, 0.55).setDepth(depth),
  );

  const marker = track(
    scene.add
      .rectangle(centerX - barW * 0.35, timingY, 6, barH + 8, 0xffffff, 1)
      .setDepth(depth + 1)
      .setStrokeStyle(2, 0xf4d03f),
  );

  track(
    scene.add
      .rectangle(centerX, stakeY, barW, stakeBarH, 0x0d1526, 0.95)
      .setDepth(depth)
      .setStrokeStyle(2, 0x8b4513),
  );

  const stakeFill = track(
    scene.add
      .rectangle(centerX - barW / 2 + 2, stakeY, 0, stakeBarH - 4, 0xf4d03f, 0.85)
      .setOrigin(0, 0.5)
      .setDepth(depth + 1),
  );

  const stakeLabel = track(
    scene.add
      .text(centerX, stakeY - stakeBarH / 2 - 11, tFmt('battleSim.stakesLabel', { done: 0, total: 10 }), {
        fontFamily: FONT_VI,
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#f4d03f',
      })
      .setOrigin(0.5)
      .setDepth(depth + 2),
  );

  const tapHint = track(
    scene.add
      .text(centerX, timingY - 34, '', {
        fontFamily: FONT_VI,
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#f4d03f',
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(depth + 2),
  );

  const updateStakeProgress = (driven, required) => {
    const req = Math.max(1, required);
    const ratio = Phaser.Math.Clamp(driven / req, 0, 1);
    const fillW = (barW - 4) * ratio;
    stakeFill.width = fillW;
    stakeFill.x = centerX - barW / 2 + 2 + fillW / 2;
    stakeLabel.setText(tFmt('battleSim.stakesLabel', { done: driven, total: required }));
    stakeFill.setFillStyle(ratio >= 1 ? 0x58d68d : 0xf4d03f, ratio >= 1 ? 0.9 : 0.85);
  };

  const tween = scene.tweens.add({
    targets: marker,
    x: centerX + barW * 0.35,
    duration: 1400,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
    onUpdate: () => {
      const dx = Math.abs(marker.x - zone.x);
      if (dx < 16) {
        tapHint.setText(t('common.tap'));
        tapHint.setAlpha(1);
        zone.setFillStyle(0x58d68d, 0.7);
      } else {
        tapHint.setAlpha(0);
        zone.setFillStyle(0xf4d03f, 0.55);
      }
    },
  });

  return {
    updateStakeProgress,
    destroy() {
      tween.stop();
      for (const n of nodes) n.destroy();
    },
  };
}
