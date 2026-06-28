import Phaser from 'phaser';
import { CH5_STORMS, CH5_WAYPOINTS } from '../core/PathDrawEngine.js';
import { FONT_VI } from '../core/fonts.js';
import { localizeWaypoint, t, tFmt } from '../core/i18n.js';

const LAST_WP = localizeWaypoint(CH5_WAYPOINTS[CH5_WAYPOINTS.length - 1]);

/**
 * Path draw UI — Chapter 5.
 */
export class PathDrawView {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    const w = scene.cameras.main.width;

    this.committedGfx = scene.add.graphics().setDepth(11);
    this.strokeGfx = scene.add.graphics().setDepth(12);
    this.markerGfx = scene.add.graphics().setDepth(13);
    this.holdRingGfx = scene.add.graphics().setDepth(14);

    this.stormSprites = CH5_STORMS.map((s) => {
      const c = scene.add.circle(s.x, s.y, s.r, 0x3498db, 0.22).setDepth(10);
      c.setStrokeStyle(2, 0x2980b9, 0.75);
      const label = scene.add
        .text(s.x, s.y, t('mechanics.storm'), {
          fontFamily: FONT_VI,
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#85c1e9',
        })
        .setOrigin(0.5)
        .setDepth(11)
        .setAlpha(0.85);
      return { circle: c, label };
    });

    this.waypointSprites = CH5_WAYPOINTS.map((wp, i) => {
      const loc = localizeWaypoint(wp);
      const dot = scene.add.circle(wp.x, wp.y, 14, 0x636e72, 0.8).setDepth(12);
      const labelText = scene.add
        .text(wp.x, wp.y - 28, loc.label, {
          fontFamily: FONT_VI,
          fontSize: '10px',
          fontStyle: 'bold',
          color: '#dfe6e9',
        })
        .setOrigin(0.5)
        .setDepth(13);
      const eraText = scene.add
        .text(wp.x, wp.y - 16, loc.era ?? '', {
          fontFamily: FONT_VI,
          fontSize: '8px',
          color: '#95a5a6',
        })
        .setOrigin(0.5)
        .setDepth(13);
      return { dot, labelText, eraText, index: i };
    });

    this.activePulse = scene.add
      .circle(0, 0, 22, 0x58d68d, 0)
      .setStrokeStyle(3, 0x58d68d, 0.85)
      .setDepth(11)
      .setVisible(false);

    this.flagSprite = scene.add
      .image(LAST_WP.x, LAST_WP.y - 24, 'game_assets', 'flag')
      .setDepth(15)
      .setScale(1.6)
      .setAlpha(0)
      .setVisible(false);

    this.flagGlow = scene.add
      .circle(LAST_WP.x, LAST_WP.y, 36, 0xf4d03f, 0)
      .setStrokeStyle(3, 0xf4d03f, 0.9)
      .setDepth(13)
      .setVisible(false);

    this.celebrationBanner = scene.add
      .text(w / 2, 152, '', {
        fontFamily: FONT_VI,
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#f4d03f',
        align: 'center',
        wordWrap: { width: w - 48 },
      })
      .setOrigin(0.5)
      .setDepth(16)
      .setAlpha(0);

    this.flagHint = scene.add
      .text(LAST_WP.x, LAST_WP.y + 38, '', {
        fontFamily: FONT_VI,
        fontSize: '11px',
        color: '#f4d03f',
        align: 'center',
        wordWrap: { width: 120 },
      })
      .setOrigin(0.5)
      .setDepth(16)
      .setAlpha(0);

    this.holdBar = scene.add.rectangle(w / 2, 690, 180, 10, 0x1a2744).setDepth(14).setAlpha(0);
    this.holdFill = scene.add
      .rectangle(w / 2 - 90, 690, 0, 10, 0xf4d03f)
      .setOrigin(0, 0.5)
      .setDepth(15)
      .setAlpha(0);

    this._lastX = null;
    this._lastY = null;
    this._committedCount = 0;
    this._pathCompleteShown = false;
    this._pulseTween = null;
    this._flagPulseTween = null;
    this._activeTarget = -1;

    scene.input.on('pointerdown', this._onDown, this);
    scene.input.on('pointerup', this._onUp, this);
    scene.input.on('pointermove', this._onMove, this);
  }

  /** @type {import('../core/controllers/PathDrawChapterController.js').PathDrawChapterController|null} */
  controller = null;

  _onDown(p) {
    const started = this.controller?.handlePointerDown(p.x, p.y) ?? false;
    if (started) {
      this._lastX = p.x;
      this._lastY = p.y;
      this.strokeGfx.clear();
    } else if (!this.controller?.path?.completed) {
      this._flashInvalidTap(p.x, p.y);
    }
  }

  _onUp() {
    this.controller?.handlePointerUp();
    this._clearStroke();
  }

  _onMove(p) {
    if (!p.isDown || !this.controller?.isDrawing()) return;
    const dt = 1 / 60;
    this.controller.handlePointerMove(p.x, p.y, dt);
    this._drawStroke(p.x, p.y);
    this._lastX = p.x;
    this._lastY = p.y;
  }

  _drawStroke(x, y) {
    if (this._lastX == null) return;
    this.strokeGfx.lineStyle(4, 0xf4d03f, 0.65);
    this.strokeGfx.lineBetween(this._lastX, this._lastY, x, y);
  }

  _clearStroke() {
    this.strokeGfx.clear();
    this._lastX = null;
    this._lastY = null;
  }

  _drawCommittedPath(waypointIndex) {
    const count = Math.max(0, waypointIndex + 1);
    if (count === this._committedCount) return;
    this._committedCount = count;
    this.committedGfx.clear();
    if (count < 2) return;
    this.committedGfx.lineStyle(5, 0xf4d03f, 0.9);
    for (let i = 1; i < count; i++) {
      const a = CH5_WAYPOINTS[i - 1];
      const b = CH5_WAYPOINTS[i];
      this.committedGfx.lineBetween(a.x, a.y, b.x, b.y);
    }
  }

  _flashInvalidTap(x, y) {
    this.markerGfx.clear();
    this.markerGfx.lineStyle(2, 0xe74c3c, 0.9);
    this.markerGfx.strokeCircle(x, y, 18);
    this.scene.time.delayedCall(280, () => {
      if (this.markerGfx?.active) this.markerGfx.clear();
    });
  }

  _spawnConnectBurst(x, y) {
    for (let i = 0; i < 6; i++) {
      const spark = this.scene.add.circle(x, y, 3, 0xf4d03f, 0.9).setDepth(14);
      const angle = (Math.PI * 2 * i) / 6;
      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * 22,
        y: y + Math.sin(angle) * 22,
        alpha: 0,
        scale: 0.2,
        duration: 320,
        ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }

  _floatAt(x, y, text, color = '#f4d03f') {
    const t = this.scene.add
      .text(x, y - 28, text, {
        fontFamily: FONT_VI,
        fontSize: '12px',
        fontStyle: 'bold',
        color,
      })
      .setOrigin(0.5)
      .setDepth(17);

    this.scene.tweens.add({
      targets: t,
      y: y - 52,
      alpha: 0,
      duration: 700,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  _setActivePulse(x, y, visible) {
    if (!visible) {
      this.activePulse.setVisible(false);
      this._pulseTween?.stop();
      this._pulseTween = null;
      return;
    }
    this.activePulse.setPosition(x, y)
      .setVisible(true)
      .setScale(1)
      .setAlpha(1);
    if (this._pulseTween?.isPlaying()) return;
    this._pulseTween = this.scene.tweens.add({
      targets: this.activePulse,
      scale: { from: 0.85, to: 1.25 },
      alpha: { from: 0.95, to: 0.35 },
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  _drawHoldRing(ratio, holding) {
    this.holdRingGfx.clear();
    if (!this._pathCompleteShown) return;

    const cx = LAST_WP.x;
    const cy = LAST_WP.y;
    this.holdRingGfx.lineStyle(3, 0x636e72, 0.45);
    this.holdRingGfx.strokeCircle(cx, cy, 34);

    if (ratio > 0) {
      this.holdRingGfx.lineStyle(5, holding ? 0xf4d03f : 0xc0392b, holding ? 1 : 0.6);
      this.holdRingGfx.beginPath();
      this.holdRingGfx.arc(
        cx,
        cy,
        34,
        Phaser.Math.DegToRad(-90),
        Phaser.Math.DegToRad(-90 + 360 * ratio),
      );
      this.holdRingGfx.strokePath();
    }
  }

  flashStormHit() {
    for (const s of this.stormSprites) {
      this.scene.tweens.add({
        targets: s,
        alpha: { from: 0.55, to: 0.22 },
        duration: 180,
        yoyo: true,
      });
    }
    this._clearStroke();
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} index
   */
  celebrateWaypoint(x, y, index) {
    this._spawnConnectBurst(x, y);
    const wp = CH5_WAYPOINTS[index];
    const floatMsg = wp?.title ?? wp?.label ?? '';
    if (floatMsg) {
      const color = wp?.order === 8 || wp?.order === 6 ? '#c0392b' : '#f4d03f';
      this._floatAt(x, y, floatMsg, color);
    }
    const entry = this.waypointSprites[index];
    entry?.labelText?.setColor('#f4d03f');
    entry?.eraText?.setColor('#f4d03f');
  }

  showPathComplete() {
    if (this._pathCompleteShown) return;
    this._pathCompleteShown = true;
    this._setActivePulse(0, 0, false);

    this.flagSprite.setVisible(true);
    this.flagGlow.setVisible(true);
    this.scene.tweens.add({
      targets: this.flagSprite,
      alpha: 1,
      y: LAST_WP.y - 28,
      scale: 1.8,
      duration: 450,
      ease: 'Back.easeOut',
    });

    this._flagPulseTween = this.scene.tweens.add({
      targets: this.flagGlow,
      scale: { from: 0.9, to: 1.35 },
      alpha: { from: 0.95, to: 0.25 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.celebrationBanner.setText(tFmt('mechanics.pathCompleteBanner', { label: LAST_WP.label })).setAlpha(1);
    this.flagHint.setText(t('mechanics.flagHoldHere')).setAlpha(1);
    this._flagHintMode = 'hold';
    this.holdBar.setAlpha(0.85);
    this.holdFill.setAlpha(1);
  }

  onFlagHoldStart() {
    this.flagHint.setText(t('mechanics.flagPlanting')).setColor('#58d68d');
    this._flagHintMode = 'planting';
    this.scene.tweens.add({
      targets: this.flagSprite,
      y: LAST_WP.y - 22,
      scale: 1.65,
      duration: 200,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
  }

  playFlagPlanted() {
    this._flagPulseTween?.stop();
    this.flagGlow.setStrokeStyle(4, 0xc0392b, 1);
    this.scene.tweens.add({
      targets: this.flagSprite,
      y: LAST_WP.y - 18,
      scale: 2,
      angle: 8,
      duration: 300,
      ease: 'Back.easeOut',
    });
    this._spawnConnectBurst(LAST_WP.x, LAST_WP.y);
    this.flagHint.setText(t('mechanics.flagDone')).setColor('#c0392b');
    this._flagHintMode = 'done';
  }

  /**
   * @param {number} waypointIndex last reached waypoint index (-1 = none)
   * @param {boolean} pathComplete
   * @param {number} flagHoldRatio
   * @param {boolean} [flagHolding]
   */
  refresh(waypointIndex, pathComplete, flagHoldRatio, flagHolding = false) {
    const nextTarget = pathComplete ? -1 : waypointIndex + 1;

    for (const { dot, index } of this.waypointSprites) {
      if (pathComplete || index <= waypointIndex) {
        dot.setFillStyle(0xf4d03f, 1);
        dot.setRadius(10);
      } else if (index === nextTarget) {
        dot.setFillStyle(0x58d68d, 1);
        dot.setRadius(16);
      } else {
        dot.setFillStyle(0x636e72, 0.6);
        dot.setRadius(12);
      }
    }

    if (
      !pathComplete &&
      nextTarget >= 0 &&
      nextTarget < CH5_WAYPOINTS.length &&
      nextTarget !== this._activeTarget
    ) {
      this._activeTarget = nextTarget;
      const wp = CH5_WAYPOINTS[nextTarget];
      this._setActivePulse(wp.x, wp.y, true);
    } else if (pathComplete || nextTarget >= CH5_WAYPOINTS.length) {
      this._activeTarget = -1;
      this._setActivePulse(0, 0, false);
    }

    this._drawCommittedPath(waypointIndex);

    if (pathComplete) {
      this.holdFill.width = 180 * flagHoldRatio;
      this._drawHoldRing(flagHoldRatio, flagHolding);
      if (flagHolding) {
        this.flagSprite.setAngle(Math.sin(flagHoldRatio * Math.PI * 4) * 4);
      }
    }
  }

  refreshLang() {
    for (const { labelText, eraText, index } of this.waypointSprites) {
      const loc = localizeWaypoint(CH5_WAYPOINTS[index]);
      labelText?.setText(loc.label);
      eraText?.setText(loc.era ?? '');
    }
    for (const { label } of this.stormSprites) {
      label?.setText(t('mechanics.storm'));
    }
    if (this.celebrationBanner?.visible) {
      this.celebrationBanner.setText(tFmt('mechanics.pathCompleteBanner', { label: LAST_WP.label }));
    }
    if (this.flagHint?.visible && this._flagHintMode) {
      const key = {
        hold: 'mechanics.flagHoldHere',
        planting: 'mechanics.flagPlanting',
        done: 'mechanics.flagDone',
      }[this._flagHintMode];
      if (key) this.flagHint.setText(t(key));
    }
  }

  destroy() {
    this.scene.input.off('pointerdown', this._onDown, this);
    this.scene.input.off('pointerup', this._onUp, this);
    this.scene.input.off('pointermove', this._onMove, this);
    this._pulseTween?.stop();
    this._flagPulseTween?.stop();
    this.committedGfx?.destroy();
    this.strokeGfx?.destroy();
    this.markerGfx?.destroy();
    this.holdRingGfx?.destroy();
    this.stormSprites.forEach((s) => {
      s.circle?.destroy();
      s.label?.destroy();
    });
    this.waypointSprites.forEach(({ dot, labelText, eraText }) => {
      dot.destroy();
      labelText?.destroy();
      eraText?.destroy();
    });
    this.activePulse?.destroy();
    this.flagSprite?.destroy();
    this.flagGlow?.destroy();
    this.celebrationBanner?.destroy();
    this.flagHint?.destroy();
    this.holdBar?.destroy();
    this.holdFill?.destroy();
  }
}
