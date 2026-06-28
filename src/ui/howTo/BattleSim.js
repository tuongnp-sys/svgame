import { createRhythmHowToDemo } from './RhythmHowToDemo.js';
import { createTimingBarHowToDemo } from './TimingBarHowToDemo.js';
import { createStaticHowToDemo } from './StaticHowToDemo.js';
import { FONT_VI } from '../../core/fonts.js';
import { t, tFmt, getBattleSimBinaryLines, getBattleSimLines } from '../../core/i18n.js';

/**
 * @param {Phaser.Scene} scene
 */
function createSimLifecycle(scene) {
  let alive = true;
  /** @type {Phaser.Time.TimerEvent[]} */
  const timers = [];
  /** @type {Phaser.Tweens.Tween[]} */
  const tweens = [];

  return {
    isAlive: () => alive,
    addTimer(config) {
      const ev = scene.time.addEvent(config);
      timers.push(ev);
      return ev;
    },
    addTween(config) {
      const userComplete = config.onComplete;
      const tween = scene.tweens.add({
        ...config,
        onComplete: () => {
          tweens.splice(tweens.indexOf(tween), 1);
          if (!alive) return;
          userComplete?.();
        },
      });
      tweens.push(tween);
      return tween;
    },
    destroy() {
      if (!alive) return;
      alive = false;
      for (const ev of timers) ev.remove();
      timers.length = 0;
      for (const tw of tweens) tw.stop();
      tweens.length = 0;
    },
  };
}

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
  const life = createSimLifecycle(scene);
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

  const safeHud = (text, color) => {
    if (!life.isAlive() || !hud.active) return;
    hud.setText(text);
    if (color) hud.setColor(color);
  };

  let demo = null;

  if (mechanic === 'rhythm') {
    demo = createRhythmHowToDemo(scene, centerX, centerY - 10, depth);
    const seq = [
      getBattleSimLines('rhythm')[0],
      getBattleSimLines('rhythm')[1],
      getBattleSimLines('rhythm')[2],
      getBattleSimLines('rhythm')[3],
    ];
    let i = 0;
    const step = () => {
      if (!life.isAlive()) return;
      safeHud(seq[i], seq[i].includes('✗') ? '#e74c3c' : '#58d68d');
      i = (i + 1) % seq.length;
    };
    step();
    life.addTimer({ delay: 1300, loop: true, callback: step });
    return {
      destroy() {
        life.destroy();
        demo?.destroy();
        demo = null;
        for (const n of nodes) n.destroy();
        nodes.length = 0;
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
      if (!life.isAlive()) return;
      demo?.updateStakeProgress?.(stakes, 10);
      safeHud(tFmt('battleSim.stakesHud', { stakes, escapes }), escapes >= 2 ? '#e74c3c' : '#f4d03f');
    };
    updateHud();

    life.addTween({
      targets: ship,
      x: centerX + 100,
      duration: 2800,
      repeat: -1,
      onRepeat: () => {
        if (!life.isAlive()) return;
        escapes = Math.min(3, escapes + 1);
        if (escapes > 2) {
          safeHud(t('battleSim.loseShips'), '#e74c3c');
          escapes = 0;
          stakes = 0;
        }
        updateHud();
      },
    });

    life.addTimer({
      delay: 1600,
      loop: true,
      callback: () => {
        if (!life.isAlive()) return;
        stakes = Math.min(10, stakes + 1);
        if (stakeIcon.active) stakeIcon.setAlpha(1);
        life.addTween({
          targets: stakeIcon,
          alpha: 0,
          duration: 400,
          onComplete: () => {
            if (!life.isAlive()) return;
            if (stakes >= 10) {
              safeHud(t('battleSim.winStakes'), '#58d68d');
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
        life.destroy();
        demo?.destroy();
        demo = null;
        for (const n of nodes) n.destroy();
        nodes.length = 0;
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
  safeHud(seq[0]);
  life.addTimer({
    delay: 1400,
    loop: true,
    callback: () => {
      if (!life.isAlive()) return;
      i = (i + 1) % seq.length;
      const line = seq[i];
      safeHud(line, line.includes('MISS') || line.includes('bão') || line.includes('storm') ? '#e74c3c' : '#58d68d');
    },
  });

  return {
    destroy() {
      life.destroy();
      demo?.destroy();
      demo = null;
      for (const n of nodes) n.destroy();
      nodes.length = 0;
    },
  };
}
