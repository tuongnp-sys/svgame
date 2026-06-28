import { createRhythmHowToDemo } from './RhythmHowToDemo.js';
import { createTimingBarHowToDemo } from './TimingBarHowToDemo.js';
import { createStaticHowToDemo } from './StaticHowToDemo.js';
import { FONT_VI } from '../../core/fonts.js';
import { t, tFmt, getBattleSimBinaryLines, getBattleSimLines } from '../../core/i18n.js';

/**
 * Mô phỏng mini trận — cập nhật HUD ảo thắng/thua.
 * @param {Phaser.Scene} scene
 * @param {number} chapterId
 * @param {string} mechanic
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} depth
 */
export function createBattleSim(scene, chapterId, mechanic, centerX, centerY, depth) {
  const nodes = [];
  const track = (o) => {
    nodes.push(o);
    return o;
  };

  const hud = track(
    scene.add
      .text(centerX, centerY - 72, '', {
        fontFamily: FONT_VI,
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(depth + 3),
  );

  let demo = null;
  if (mechanic === 'rhythm') {
    demo = createRhythmHowToDemo(scene, centerX, centerY - 10, depth);
    const seq = [
      { t: getBattleSimLines('rhythm')[0], d: 1200 },
      { t: getBattleSimLines('rhythm')[1], d: 1200 },
      { t: getBattleSimLines('rhythm')[2], d: 1000 },
      { t: getBattleSimLines('rhythm')[3], d: 1200 },
    ];
    let i = 0;
    const step = () => {
      hud.setText(seq[i].t);
      hud.setColor(seq[i].t.includes('✗') ? '#e74c3c' : '#58d68d');
      i = (i + 1) % seq.length;
    };
    step();
    const timer = scene.time.addEvent({ delay: 1300, loop: true, callback: step });
    return {
      destroy() {
        timer.remove();
        demo?.destroy();
        for (const n of nodes) n.destroy();
      },
    };
  }

  if (mechanic === 'timing_bar') {
    demo = createTimingBarHowToDemo(scene, centerX, centerY + 8, depth);
    track(
      scene.add.rectangle(centerX, centerY - 28, 240, 36, 0x1a3a5c, 0.7).setDepth(depth),
    );
    const ship = track(
      scene.add
        .image(centerX - 100, centerY - 28, 'game_assets', 'ship')
        .setScale(0.85)
        .setDepth(depth + 1),
    );
    const stakeIcon = track(
      scene.add.rectangle(centerX - 110, centerY - 28, 4, 18, 0xf4d03f).setDepth(depth + 1).setAlpha(0),
    );

    let stakes = 0;
    let escapes = 0;
    const updateHud = () => {
      demo.updateStakeProgress(stakes, 10);
      hud.setText(tFmt('battleSim.stakesHud', { stakes, escapes }));
      hud.setColor(escapes >= 2 ? '#e74c3c' : '#f4d03f');
    };
    updateHud();

    const shipTween = scene.tweens.add({
      targets: ship,
      x: centerX + 100,
      duration: 2800,
      repeat: -1,
      onRepeat: () => {
        escapes = Math.min(3, escapes + 1);
        if (escapes > 2) {
          hud.setText(t('battleSim.loseShips'));
          hud.setColor('#e74c3c');
          escapes = 0;
          stakes = 0;
        }
        updateHud();
      },
    });

    const stakeTimer = scene.time.addEvent({
      delay: 1600,
      loop: true,
      callback: () => {
        stakes = Math.min(10, stakes + 1);
        stakeIcon.setAlpha(1);
        scene.tweens.add({
          targets: stakeIcon,
          alpha: 0,
          duration: 400,
          onComplete: () => {
            if (stakes >= 10) {
              hud.setText(t('battleSim.winStakes'));
              hud.setColor('#58d68d');
              stakes = 0;
              escapes = 0;
            }
            updateHud();
          },
        });
        updateHud();
      },
    });

    return {
      destroy() {
        shipTween.stop();
        stakeTimer.remove();
        demo?.destroy();
        for (const n of nodes) n.destroy();
      },
    };
  }

  demo = createStaticHowToDemo(scene, mechanic, centerX, centerY, depth, { compact: true });
  const lines = {
    binary_choice: getBattleSimBinaryLines(),
    rhythm_swipe: getBattleSimLines('rhythm_swipe'),
    path_draw: getBattleSimLines('path_draw'),
    runner: getBattleSimLines('runner'),
  };
  const seq = lines[mechanic] ?? [t('battleSim.defaultProgress')];
  let i = 0;
  hud.setText(seq[0]);
  const timer = scene.time.addEvent({
    delay: 1400,
    loop: true,
    callback: () => {
      i = (i + 1) % seq.length;
      hud.setText(seq[i]);
      hud.setColor(seq[i].includes('MISS') || seq[i].includes('bão') || seq[i].includes('storm') ? '#e74c3c' : '#58d68d');
    },
  });

  return {
    destroy() {
      timer.remove();
      demo?.destroy();
      for (const n of nodes) n.destroy();
    },
  };
}
