import { COMBO_MILESTONE } from './chapterConstants.js';
import { FONT_VI } from './fonts.js';
import { t } from './i18n.js';

/** @typedef {'perfect'|'great'|'good'|'miss'} HitGrade */

const GRADE_COLORS = {
  perfect: '#f4d03f',
  great: '#58d68d',
  good: '#85c1e9',
  miss: '#e74c3c',
};

/**
 * Central gameplay feedback — call from ChapterScene only.
 */
export const GameJuice = {
  /**
   * @param {Phaser.Scene} scene
   * @param {HitGrade} grade
   * @param {number} [combo]
   */
  onHit(scene, grade, combo = 0) {
    if (grade === 'miss') {
      this.onMiss(scene);
      return;
    }

    const cam = scene.cameras.main;
    if (grade === 'perfect') {
      cam.shake(80, 0.004);
      cam.flash(80, 244, 208, 63);
    } else if (grade === 'great') {
      cam.shake(45, 0.002);
    }

    if (combo >= COMBO_MILESTONE) {
      this._floatText(scene, t('juice.spirit'), '#58d68d', cam.width / 2, 168, 20);
    }
  },

  /**
   * @param {Phaser.Scene} scene
   */
  onMiss(scene) {
    const cam = scene.cameras.main;
    cam.shake(120, 0.005);
    cam.flash(150, 231, 76, 60);
    this._floatText(scene, t('common.miss'), GRADE_COLORS.miss, cam.width / 2, cam.height * 0.44, 17);
  },

  /**
   * @param {Phaser.Scene} scene
   */
  onStakePlaced(scene) {
    scene.cameras.main.flash(60, 244, 208, 63);
  },

  /**
   * @param {Phaser.Scene} scene
   */
  onShipEscape(scene) {
    const cam = scene.cameras.main;
    cam.flash(200, 200, 60, 60, false);
    cam.shake(150, 0.006);
    this._floatText(scene, t('juice.shipEscaped'), '#e74c3c', cam.width / 2, cam.height * 0.35, 16);
  },

  /**
   * @param {Phaser.Scene} scene
   */
  onWrongChoice(scene) {
    const cam = scene.cameras.main;
    cam.flash(180, 200, 50, 50, false);
    cam.shake(100, 0.004);
    this._floatText(scene, t('juice.peaceWrong'), '#e74c3c', cam.width / 2, cam.height * 0.38, 17);
  },

  /**
   * @param {Phaser.Scene} scene
   */
  onStormHit(scene) {
    scene.cameras.main.flash(150, 80, 120, 200, false);
    scene.cameras.main.shake(90, 0.004);
    this._floatText(scene, t('juice.storm'), '#3498db', scene.cameras.main.width / 2, 200, 18);
  },

  /**
   * @param {Phaser.Scene} scene
   * @param {string} label
   */
  onPathMilestone(scene, label) {
    const cam = scene.cameras.main;
    cam.flash(70, 244, 208, 63);
    cam.shake(50, 0.003);
    this._floatText(scene, label, '#f4d03f', cam.width / 2, 188, 19);
  },

  /**
   * @param {Phaser.Scene} scene
   */
  onPathComplete(scene) {
    const cam = scene.cameras.main;
    cam.flash(120, 244, 208, 63);
    cam.shake(100, 0.005);
    this._floatText(scene, t('juice.pathComplete'), '#f4d03f', cam.width / 2, 168, 20);
  },

  /**
   * @param {Phaser.Scene} scene
   */
  onFlagPlanted(scene) {
    const cam = scene.cameras.main;
    cam.flash(200, 192, 57, 43);
    cam.shake(120, 0.006);
    this._floatText(scene, t('juice.flagPlanted'), '#c0392b', cam.width / 2, 220, 18);
  },

  /**
   * @param {Phaser.Scene} scene
   * @param {number} combo
   */
  highlightCombo(scene, combo) {
    if (combo >= COMBO_MILESTONE) {
      scene.cameras.main.flash(40, 88, 214, 141);
    }
  },

  /**
   * Victory fireworks — procedural burst for Ch.6 finale.
   * @param {Phaser.Scene} scene
   * @param {number} [depth]
   * @returns {{ stop: () => void }}
   */
  playVictoryFireworks(scene, depth = 91) {
    const w = scene.cameras.main.width;
    const h = scene.cameras.main.height;
    const colors = [0xf4d03f, 0xc0392b, 0xffffff, 0x58d68d, 0xe67e22, 0x3498db];
    const sparks = [];
    let alive = true;

    const burst = (cx, cy) => {
      const count = Phaser.Math.Between(8, 14);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Phaser.Math.FloatBetween(-0.2, 0.2);
        const dist = Phaser.Math.Between(28, 72);
        const color = Phaser.Math.RND.pick(colors);
        const s = scene.add.circle(cx, cy, Phaser.Math.Between(2, 5), color, 1).setDepth(depth);
        sparks.push(s);
        scene.tweens.add({
          targets: s,
          x: cx + Math.cos(angle) * dist,
          y: cy + Math.sin(angle) * dist,
          alpha: 0,
          scale: { from: 1, to: 0.2 },
          duration: Phaser.Math.Between(500, 900),
          ease: 'Cubic.easeOut',
          onComplete: () => {
            s.destroy();
            const idx = sparks.indexOf(s);
            if (idx >= 0) sparks.splice(idx, 1);
          },
        });
      }
    };

    const rocketTimer = scene.time.addEvent({
      delay: 320,
      loop: true,
      callback: () => {
        if (!alive) return;
        const rx = Phaser.Math.Between(50, w - 50);
        const rocket = scene.add.circle(rx, h + 8, 4, 0xf4d03f, 1).setDepth(depth);
        sparks.push(rocket);
        scene.tweens.add({
          targets: rocket,
          y: Phaser.Math.Between(h * 0.22, h * 0.48),
          duration: Phaser.Math.Between(450, 700),
          ease: 'Cubic.easeOut',
          onComplete: () => {
            burst(rocket.x, rocket.y);
            rocket.destroy();
            const idx = sparks.indexOf(rocket);
            if (idx >= 0) sparks.splice(idx, 1);
          },
        });
      },
    });

    scene.time.delayedCall(200, () => burst(w * 0.5, h * 0.35));
    scene.time.delayedCall(600, () => burst(w * 0.3, h * 0.28));
    scene.time.delayedCall(1000, () => burst(w * 0.7, h * 0.32));

    return {
      stop() {
        alive = false;
        rocketTimer.remove();
        for (const s of [...sparks]) s.destroy();
        sparks.length = 0;
      },
    };
  },

  /**
   * @param {Phaser.Scene} scene
   * @param {string} text
   * @param {string} color
   * @param {number} x
   * @param {number} y
   * @param {number} fontSize
   */
  _floatText(scene, text, color, x, y, fontSize = 16) {
    const t = scene.add
      .text(x, y, text, {
        fontFamily: FONT_VI,
        fontSize: `${fontSize}px`,
        fontStyle: 'bold',
        color,
      })
      .setOrigin(0.5)
      .setDepth(22);

    scene.tweens.add({
      targets: t,
      y: y - 36,
      alpha: 0,
      duration: 650,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  },
};
