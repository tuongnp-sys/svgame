import Phaser from 'phaser';
import { createPillButton } from './phaserUi.js';
import { FONT_VI } from '../core/fonts.js';
import { t, tFmt } from '../core/i18n.js';

export const LANE_X = [90, 187, 275];
const TANK_X0 = 80;
const TANK_X1 = 280;
const PLAYER_Y = 560;
const ROAD_Y = 600;
const OBSTACLE_COUNT = 5;

/**
 * Runner UI — Chapter 6 supply + tank.
 */
export class RunnerView {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    const w = scene.cameras.main.width;
    const h = scene.cameras.main.height;

    this.laneGfx = scene.add.graphics().setDepth(7);
    this._drawLanes();

    this.ground = scene.add.rectangle(187, ROAD_Y, w, 180, 0x2d3436, 0.55).setDepth(8);
    this.trackLine = scene.add.rectangle(187, ROAD_Y + 20, w - 40, 6, 0x636e72, 0.6).setDepth(9);

    this.laneHighlights = LANE_X.map((x) =>
      scene.add.rectangle(x, 480, 72, 320, 0x58d68d, 0).setDepth(8),
    );

    this.player = scene.add.rectangle(LANE_X[1], PLAYER_Y, 44, 44, 0x58d68d, 1).setDepth(12);
    this.player.setStrokeStyle(3, 0xf4d03f);

    this.playerLabel = scene.add
      .text(LANE_X[1], PLAYER_Y - 32, t('mechanics.reinforcements'), {
        fontFamily: FONT_VI,
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#58d68d',
      })
      .setOrigin(0.5)
      .setDepth(13);

    this.tank = scene.add
      .rectangle(TANK_X0, PLAYER_Y, 58, 38, 0x27ae60, 1)
      .setDepth(12)
      .setVisible(false);
    this.tank.setStrokeStyle(3, 0xf4d03f);

    this.tankLabel = scene.add
      .text(TANK_X0, PLAYER_Y - 30, '843', {
        fontFamily: FONT_VI,
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#f4d03f',
      })
      .setOrigin(0.5)
      .setDepth(13)
      .setVisible(false);

    this.obstacleSprites = [];
    for (let i = 0; i < OBSTACLE_COUNT; i++) {
      const body = scene.add.rectangle(0, ROAD_Y - 8, 36, 28, 0x8b4513, 1).setDepth(11).setVisible(false);
      body.setStrokeStyle(2, 0xe74c3c);
      const spike = scene.add.triangle(0, ROAD_Y - 26, 0, 14, 7, 0, 14, 14, 0xc0392b, 1).setDepth(11).setVisible(false);
      const label = scene.add
        .text(0, ROAD_Y - 38, t('mechanics.barrier'), {
          fontFamily: FONT_VI,
          fontSize: '9px',
          color: '#e74c3c',
        })
        .setOrigin(0.5)
        .setDepth(12)
        .setVisible(false);
      this.obstacleSprites.push({ body, spike, label });
    }

    this.obstaclePips = [];
    const pipStartX = 187 - ((OBSTACLE_COUNT - 1) * 18) / 2;
    for (let i = 0; i < OBSTACLE_COUNT; i++) {
      const pip = scene.add.circle(pipStartX + i * 18, 165, 6, 0x636e72, 0.8).setDepth(16).setVisible(false);
      this.obstaclePips.push(pip);
    }

    this.pipLegend = scene.add
      .text(187, 182, t('mechanics.runnerWinHint'), {
        fontFamily: FONT_VI,
        fontSize: '10px',
        color: '#95a5a6',
      })
      .setOrigin(0.5)
      .setDepth(16)
      .setVisible(false);

    this.itemSprites = [];
    this.progressBar = scene.add.rectangle(187, 140, 260, 10, 0x1a2744).setDepth(14);
    this.progressFill = scene.add
      .rectangle(57, 140, 0, 10, 0xc0392b)
      .setOrigin(0, 0.5)
      .setDepth(15);

    this.phaseLabel = scene.add
      .text(187, 115, '', {
        fontFamily: FONT_VI,
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#f4d03f',
      })
      .setOrigin(0.5)
      .setDepth(15);

    this.tankStatus = scene.add
      .text(187, 430, '', {
        fontFamily: FONT_VI,
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#95a5a6',
      })
      .setOrigin(0.5)
      .setDepth(16)
      .setAlpha(0);

    this.jumpZone = scene.add
      .rectangle(187, 500, 300, 80, 0xf4d03f, 0)
      .setStrokeStyle(3, 0xf4d03f, 0)
      .setDepth(10);

    this.jumpBtnBg = scene.add
      .rectangle(w / 2, 748, 300, 54, 0x636e72, 0.95)
      .setDepth(17)
      .setVisible(false)
      .setStrokeStyle(2, 0x95a5a6, 0.8);
    this.jumpBtnLabel = scene.add
      .text(w / 2, 748, t('mechanics.waitBarrier'), {
        fontFamily: FONT_VI,
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#dfe6e9',
      })
      .setOrigin(0.5)
      .setDepth(18)
      .setVisible(false);

    this.jumpBtnBg.setInteractive({ useHandCursor: true });
    this.jumpBtnBg.on('pointerdown', (p) => {
      p.event?.stopPropagation();
      if (this.controller?.runner?.inJumpWindow) {
        this.controller.handleTap();
      }
    });

    this.btnLeft = scene.add
      .text(36, 720, '◀', {
        fontFamily: FONT_VI,
        fontSize: '28px',
        color: '#95a5a6',
      })
      .setOrigin(0.5)
      .setDepth(16)
      .setInteractive({ useHandCursor: true });

    this.btnRight = scene.add
      .text(w - 36, 720, '▶', {
        fontFamily: FONT_VI,
        fontSize: '28px',
        color: '#95a5a6',
      })
      .setOrigin(0.5)
      .setDepth(16)
      .setInteractive({ useHandCursor: true });

    this.laneHint = scene.add
      .text(187, 720, t('mechanics.laneHint'), {
        fontFamily: FONT_VI,
        fontSize: '11px',
        color: '#636e72',
      })
      .setOrigin(0.5)
      .setDepth(16);

    this.btnLeft.on('pointerdown', () => this.controller?.handleLane('left'));
    this.btnRight.on('pointerdown', () => this.controller?.handleLane('right'));

    scene.input.on('pointerdown', this._onTap, this);

    this._lastObstaclePassed = -1;
    this._jumpBtnPulse = null;
    this._tankIntroNodes = [];
    this._clearOkTimer = null;
  }

  /** @type {import('../core/controllers/RunnerChapterController.js').RunnerChapterController|null} */
  controller = null;

  /**
   * @param {() => void} onReady
   */
  showTankPhaseIntro(onReady) {
    this._destroyTankIntro();
    const scene = this.scene;
    const w = scene.cameras.main.width;
    const h = scene.cameras.main.height;
    const d = 40;

    const nodes = [
      scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.82).setDepth(d),
      scene.add.rectangle(w / 2, h * 0.46, w - 48, 340, 0x1a2744, 0.98).setDepth(d + 1),
      scene.add
        .text(w / 2, h * 0.28, t('mechanics.supplyDone'), {
          fontFamily: FONT_VI,
          fontSize: '15px',
          fontStyle: 'bold',
          color: '#58d68d',
        })
        .setOrigin(0.5)
        .setDepth(d + 2),
      scene.add
        .text(w / 2, h * 0.34, t('mechanics.tankTitle'), {
          fontFamily: FONT_VI,
          fontSize: '20px',
          fontStyle: 'bold',
          color: '#f4d03f',
        })
        .setOrigin(0.5)
        .setDepth(d + 2),
      scene.add
        .text(w / 2, h * 0.42, t('mechanics.tankSubtitle'), {
          fontFamily: FONT_VI,
          fontSize: '13px',
          color: '#dfe6e9',
        })
        .setOrigin(0.5)
        .setDepth(d + 2),
      scene.add
        .text(w / 2, h * 0.48, t('mechanics.tankRules'), {
          fontFamily: FONT_VI,
          fontSize: '13px',
          color: '#95a5a6',
          align: 'center',
          lineSpacing: 6,
        })
        .setOrigin(0.5)
        .setDepth(d + 2),
    ];
    this._tankIntroNodes = nodes;

    const startBtn = createPillButton(scene, w / 2, h * 0.62, 260, 52, t('mechanics.startRun'), () => {
      this._destroyTankIntro();
      onReady?.();
    }).setDepth(d + 3);
    this._tankIntroNodes.push(startBtn);
  }

  _destroyTankIntro() {
    for (const n of this._tankIntroNodes) {
      n?.destroy?.();
    }
    this._tankIntroNodes = [];
  }

  _drawLanes() {
    this.laneGfx.clear();
    this.laneGfx.lineStyle(2, 0x636e72, 0.35);
    for (const x of LANE_X) {
      this.laneGfx.lineBetween(x, 280, x, 680);
    }
  }

  _laneFromX(x) {
    let best = 1;
    let bestD = Infinity;
    for (let i = 0; i < LANE_X.length; i++) {
      const d = Math.abs(x - LANE_X[i]);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  _onTap(p) {
    if (!this.controller) return;
    if (this.controller.runner.phase === 'supply') {
      if (p.y > 680) return;
      this.controller.handleSelectLane(this._laneFromX(p.x));
    }
  }

  _tankX(progress) {
    return TANK_X0 + progress * (TANK_X1 - TANK_X0);
  }

  _updateLaneHighlights(activeLane, supplyPhase) {
    for (let i = 0; i < LANE_X.length; i++) {
      const on = supplyPhase && i === activeLane;
      this.laneHighlights[i].setFillStyle(0x58d68d, on ? 0.12 : 0);
    }
  }

  _updateObstaclePips(runner) {
    for (let i = 0; i < this.obstaclePips.length; i++) {
      const pip = this.obstaclePips[i];
      if (i < runner.obstaclesPassed) {
        pip.setFillStyle(0x58d68d, 1);
        pip.setRadius(6);
      } else if (i === runner.obstaclesPassed) {
        pip.setFillStyle(runner.inJumpWindow ? 0xf4d03f : 0xc0392b, 1);
        pip.setRadius(runner.inJumpWindow ? 8 : 6);
      } else {
        pip.setFillStyle(0x636e72, 0.5);
        pip.setRadius(5);
      }
    }
  }

  _updateJumpButton(runner) {
    const active = runner.inJumpWindow;
    this.jumpBtnBg.setVisible(true);
    this.jumpBtnLabel.setVisible(true);

    if (active) {
      this.jumpBtnBg.setFillStyle(0xf4d03f, 1);
      this.jumpBtnBg.setStrokeStyle(3, 0xffffff, 0.9);
      this.jumpBtnLabel.setText(t('mechanics.tapJump')).setColor('#1a2744');
      if (!this._jumpBtnPulse?.isPlaying()) {
        this._jumpBtnPulse = this.scene.tweens.add({
          targets: [this.jumpBtnBg, this.jumpBtnLabel],
          scale: { from: 1, to: 1.06 },
          duration: 260,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    } else {
      this._jumpBtnPulse?.stop();
      this._jumpBtnPulse = null;
      this.jumpBtnBg.setScale(1);
      this.jumpBtnLabel.setScale(1);
      this.jumpBtnBg.setFillStyle(0x636e72, 0.95);
      this.jumpBtnBg.setStrokeStyle(2, 0x95a5a6, 0.8);
      this.jumpBtnLabel.setText(t('mechanics.waitBarrier')).setColor('#dfe6e9');
    }
  }

  _updateTankStatus(runner) {
    if (runner.inJumpWindow) {
      this.tankStatus.setText(t('mechanics.jumpNow')).setColor('#f4d03f').setAlpha(1);
    } else if (runner.obstaclesPassed >= runner.obstacleCount) {
      this.tankStatus.setText(t('mechanics.almostThere')).setColor('#58d68d').setAlpha(1);
    } else {
      this.tankStatus.setText(
        tFmt('mechanics.barrierApproaching', {
          n: runner.obstaclesPassed + 1,
          total: runner.obstacleCount,
        }),
      ).setColor('#95a5a6').setAlpha(0.85);
    }
  }

  _flashObstacleClear() {
    this.tankStatus.setText(t('mechanics.dodged')).setColor('#58d68d').setAlpha(1);
    if (this._clearOkTimer) this._clearOkTimer.remove();
    this._clearOkTimer = this.scene.time.delayedCall(700, () => {
      this._clearOkTimer = null;
      if (this.controller?.runner?.phase === 'tank') {
        this._updateTankStatus(this.controller.runner);
      }
    });
  }

  _syncObstacles(runner) {
    const slots = runner.getObstacleSlots();
    for (let i = 0; i < this.obstacleSprites.length; i++) {
      const obs = this.obstacleSprites[i];
      const slot = slots[i];
      const show =
        i >= runner.obstaclesPassed &&
        slot != null &&
        runner.tankProgress < slot + runner.jumpWindowAfter + 0.08;

      if (!show) {
        obs.body.setVisible(false);
        obs.spike.setVisible(false);
        obs.label.setVisible(false);
        continue;
      }

      const x = this._tankX(slot);
      obs.body.setVisible(true).setPosition(x, ROAD_Y - 8);
      obs.spike.setVisible(true).setPosition(x - 7, ROAD_Y - 26);
      obs.label.setVisible(true).setPosition(x, ROAD_Y - 38);

      const near =
        slot != null && Math.abs(runner.tankProgress - slot) <= runner.jumpWindowBefore + 0.02;
      obs.body.setFillStyle(near ? 0xc0392b : 0x8b4513, 1);
    }

    if (runner.obstaclesPassed > this._lastObstaclePassed) {
      this._lastObstaclePassed = runner.obstaclesPassed;
      this._flashObstacleClear();
      const idx = runner.obstaclesPassed - 1;
      const obs = this.obstacleSprites[idx];
      if (obs?.body?.active) {
        this.scene.tweens.add({
          targets: [obs.body, obs.spike, obs.label],
          alpha: 0,
          scaleX: 0.3,
          duration: 280,
          onComplete: () => {
            obs.body.setAlpha(1).setScale(1);
            obs.spike.setAlpha(1).setScale(1);
            obs.label.setAlpha(1);
          },
        });
      }
    }
  }

  _hideTankUI() {
    this.jumpBtnBg.setVisible(false);
    this.jumpBtnLabel.setVisible(false);
    this.tankStatus.setAlpha(0);
    this.obstaclePips.forEach((p) => p.setVisible(false));
    this.pipLegend.setVisible(false);
    this.jumpZone.setAlpha(0);
    this._jumpBtnPulse?.stop();
    this._jumpBtnPulse = null;
  }

  /**
   * @param {import('../core/RunnerEngine.js').RunnerEngine} runner
   * @param {import('../core/controllers/RunnerChapterController.js').RunnerChapterState} state
   */
  sync(runner, state) {
    if (runner.phase === 'supply') {
      this._hideTankUI();
      this.player.setVisible(true);
      this.playerLabel.setVisible(true);
      this.tank.setVisible(false);
      this.tankLabel.setVisible(false);
      this.btnLeft.setVisible(true);
      this.btnRight.setVisible(true);
      this.laneHint.setVisible(true);

      const lane = runner.playerLane;
      this.player.x = LANE_X[lane] ?? LANE_X[1];
      this.playerLabel.x = this.player.x;
      this._updateLaneHighlights(lane, true);

      this.phaseLabel.setText(tFmt('mechanics.phase1Label', { n: runner.riceCollected, total: runner.riceRequired }));

      while (this.itemSprites.length < runner.items.length) {
        const g = this.scene.add.circle(0, 0, 14, 0xf4d03f, 1).setDepth(11);
        const t = this.scene.add
          .text(0, 0, 'G', {
            fontFamily: FONT_VI,
            fontSize: '10px',
            fontStyle: 'bold',
            color: '#1a2744',
          })
          .setOrigin(0.5)
          .setDepth(12);
        this.itemSprites.push({ g, t });
      }

      for (let i = 0; i < this.itemSprites.length; i++) {
        const it = runner.items[i];
        const sp = this.itemSprites[i];
        if (!it || it.collected) {
          sp.g.setVisible(false);
          sp.t.setVisible(false);
          continue;
        }
        sp.g.setVisible(true);
        sp.t.setVisible(true);
        sp.g.x = LANE_X[it.lane];
        sp.g.y = it.y;
        sp.t.x = LANE_X[it.lane];
        sp.t.y = it.y;
        if (it.isRice) {
          sp.g.setFillStyle(0xf4d03f, 1);
          sp.g.setRadius(14);
          sp.t.setText('G').setColor('#1a2744');
        } else {
          sp.g.setFillStyle(0xe74c3c, 1);
          sp.g.setRadius(12);
          sp.t.setText('!').setColor('#fff');
        }
      }

      this.progressFill.width = 260 * (runner.supplyTime / runner.supplyDuration);
      this.obstacleSprites.forEach((o) => {
        o.body.setVisible(false);
        o.spike.setVisible(false);
        o.label.setVisible(false);
      });
    } else {
      this.player.setVisible(false);
      this.playerLabel.setVisible(false);
      this.tank.setVisible(true);
      this.tankLabel.setVisible(true);
      this.btnLeft.setVisible(false);
      this.btnRight.setVisible(false);
      this.laneHint.setVisible(false);
      this._updateLaneHighlights(0, false);

      const tx = this._tankX(runner.tankProgress);
      this.tank.x = tx;
      this.tankLabel.x = tx;
      this.tank.y = state.jumpActive ? PLAYER_Y - 40 : PLAYER_Y;
      this.tankLabel.y = this.tank.y - 30;

      const remaining = runner.obstacleCount - runner.obstaclesPassed;
      this.phaseLabel.setText(tFmt('mechanics.phase2Label', { remaining }));

      this.progressFill.width = 260 * runner.tankProgress;
      this.obstaclePips.forEach((p) => p.setVisible(true));
      this.pipLegend.setVisible(true);

      this.jumpZone.setStrokeStyle(3, 0xf4d03f, runner.inJumpWindow ? 0.85 : 0);
      this.jumpZone.setAlpha(runner.inJumpWindow ? 0.18 : 0);

      this._updateJumpButton(runner);
      if (!this._clearOkTimer) {
        this._updateTankStatus(runner);
      }

      this.itemSprites.forEach((sp) => {
        sp.g.setVisible(false);
        sp.t.setVisible(false);
      });

      this._updateObstaclePips(runner);
      this._syncObstacles(runner);
    }
  }

  flashTankMiss() {
    this.scene.cameras.main.flash(180, 231, 76, 60);
    this.tankStatus.setText(t('mechanics.missedBarrier')).setColor('#e74c3c').setAlpha(1);
    const t = this.scene.add
      .text(187, 480, t('mechanics.missedJumpLose'), {
        fontFamily: FONT_VI,
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#e74c3c',
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.scene.tweens.add({
      targets: t,
      y: 450,
      alpha: 0,
      duration: 800,
      onComplete: () => t.destroy(),
    });
  }

  flashJumpEarly() {
    this.tankStatus.setText(t('mechanics.tooEarly')).setColor('#e67e22').setAlpha(1);
    const t = this.scene.add
      .text(187, 500, 'Chờ nút vàng sáng…', {
        fontFamily: FONT_VI,
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#e67e22',
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.scene.tweens.add({
      targets: t,
      y: 480,
      alpha: 0,
      duration: 600,
      onComplete: () => t.destroy(),
    });
    if (this._clearOkTimer) this._clearOkTimer.remove();
    this._clearOkTimer = this.scene.time.delayedCall(500, () => {
      this._clearOkTimer = null;
      if (this.controller?.runner?.phase === 'tank') {
        this._updateTankStatus(this.controller.runner);
      }
    });
  }

  refreshLang() {
    this.playerLabel?.setText(t('mechanics.reinforcements'));
    this.pipLegend?.setText(t('mechanics.runnerWinHint'));
    for (const o of this.obstacleSprites) {
      o.label?.setText(t('mechanics.barrier'));
    }
    if (this.jumpBtnLabel?.visible) {
      const isActive = this.jumpBtnLabel.color === '#1a2744';
      this.jumpBtnLabel.setText(isActive ? t('mechanics.tapJump') : t('mechanics.waitBarrier'));
    }
    if (this.laneHint?.visible) {
      this.laneHint.setText(t('mechanics.laneHint'));
    }
    if (this.controller?.runner) {
      this.sync(this.controller.runner, this.controller.state ?? {});
    }
  }

  destroy() {
    this._destroyTankIntro();
    if (this._clearOkTimer) this._clearOkTimer.remove();
    this.scene.input.off('pointerdown', this._onTap, this);
    this.jumpBtnBg?.removeAllListeners();
    this.btnLeft?.removeAllListeners();
    this.btnRight?.removeAllListeners();
    this._jumpBtnPulse?.stop();
    this.laneGfx?.destroy();
    this.player?.destroy();
    this.playerLabel?.destroy();
    this.tank?.destroy();
    this.tankLabel?.destroy();
    this.ground?.destroy();
    this.trackLine?.destroy();
    this.laneHighlights.forEach((r) => r.destroy());
    this.itemSprites.forEach(({ g, t }) => {
      g.destroy();
      t.destroy();
    });
    this.obstacleSprites.forEach(({ body, spike, label }) => {
      body.destroy();
      spike.destroy();
      label.destroy();
    });
    this.obstaclePips.forEach((p) => p.destroy());
    this.pipLegend?.destroy();
    this.progressBar?.destroy();
    this.progressFill?.destroy();
    this.phaseLabel?.destroy();
    this.tankStatus?.destroy();
    this.jumpZone?.destroy();
    this.jumpBtnBg?.destroy();
    this.jumpBtnLabel?.destroy();
    this.btnLeft?.destroy();
    this.btnRight?.destroy();
    this.laneHint?.destroy();
  }
}
