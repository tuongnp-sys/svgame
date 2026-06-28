import Phaser from 'phaser';

/**
 * Two-phase runner — Chapter 6: tiếp tế Điện Biên + xe tăng 843.
 */
export class RunnerEngine {
  /**
   * @param {object} opts
   */
  constructor(opts = {}) {
    this.supplyDuration = opts.supplyDuration ?? 22;
    this.riceRequired = opts.riceRequired ?? 6;
    this.maxSupplyMiss = opts.maxSupplyMiss ?? 3;
    this.tankDuration = opts.tankDuration ?? 18;
    this.obstacleCount = opts.obstacleCount ?? 5;
    /** Progress units before obstacle when jump button activates. */
    this.jumpWindowBefore = opts.jumpWindowBefore ?? 0.05;
    /** Progress units after obstacle while jump still counts. */
    this.jumpWindowAfter = opts.jumpWindowAfter ?? 0.06;
    /** Progress past obstacle slot to resolve hit/miss. */
    this.obstaclePassMargin = opts.obstaclePassMargin ?? 0.035;
    this.firstObstacleAt = opts.firstObstacleAt ?? 0.14;
    this.obstacleSpacing = opts.obstacleSpacing ?? 0.14;
    this.jumpVisualSec = 0.45;
    this.flagHoldSeconds = 1.2;

    this.phase = 'supply';
    this.supplyTime = 0;
    this.riceCollected = 0;
    this.supplyMiss = 0;
    this.playerLane = 1;

    this.tankTime = 0;
    this.tankProgress = 0;
    this.obstaclesPassed = 0;
    this.jumpActive = false;
    this.jumpTimer = 0;
    this.inJumpWindow = false;
    /** Player jumped in valid window for current obstacle — until pass line. */
    this._jumpArmed = false;
    /** @type {Array<{lane:number,y:number,collected:boolean,isRice:boolean}>} */
    this.items = [];
    this.spawnTimer = 0;
    this._obstacleSlots = this._buildObstacleSlots();
  }

  _buildObstacleSlots() {
    const slots = [];
    let at = this.firstObstacleAt;
    for (let i = 0; i < this.obstacleCount; i++) {
      slots.push(at);
      at += this.obstacleSpacing;
    }
    return slots;
  }

  getObstacleSlots() {
    return this._obstacleSlots;
  }

  getCurrentObstacleSlot() {
    if (this.obstaclesPassed >= this.obstacleCount) return null;
    return this._obstacleSlots[this.obstaclesPassed] ?? null;
  }

  reset() {
    this.phase = 'supply';
    this.supplyTime = 0;
    this.riceCollected = 0;
    this.supplyMiss = 0;
    this.playerLane = 1;
    this.tankTime = 0;
    this.tankProgress = 0;
    this.obstaclesPassed = 0;
    this.jumpActive = false;
    this.jumpTimer = 0;
    this.inJumpWindow = false;
    this._jumpArmed = false;
    this.items = [];
    this.spawnTimer = 0;
    this._obstacleSlots = this._buildObstacleSlots();
  }

  begin() {
    this.reset();
  }

  /**
   * @param {number} dt
   */
  updateSupply(dt) {
    this.supplyTime += dt;
    this.spawnTimer += dt;

    while (this.spawnTimer >= 0.9) {
      this.spawnTimer -= 0.9;
      const lane = Math.floor(Math.random() * 3);
      const isRice = Math.random() < 0.55;
      this.items.push({ lane, y: -20, collected: false, isRice });
    }

    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.y += 280 * dt;
      if (it.y > 720) {
        if (it.isRice && Math.abs(it.lane - this.playerLane) < 0.5 && !it.collected) {
          this.supplyMiss += 1;
        }
        this.items.splice(i, 1);
      } else if (!it.collected && Math.abs(it.lane - this.playerLane) < 0.5 && it.y > 520 && it.y < 600) {
        it.collected = true;
        if (it.isRice) this.riceCollected += 1;
        else this.supplyMiss += 1;
      }
    }

    if (this.riceCollected >= this.riceRequired) {
      this.phase = 'tank';
      this.tankTime = 0;
      this.tankProgress = 0;
      this.obstaclesPassed = 0;
      this._jumpArmed = false;
      return { phaseChange: 'tank' };
    }
    if (this.supplyMiss > this.maxSupplyMiss) {
      return { failed: true };
    }
    if (this.supplyTime >= this.supplyDuration) {
      return { failed: true };
    }
    return {};
  }

  /**
   * @param {number} dt
   */
  updateTank(dt) {
    this.tankTime += dt;
    this.tankProgress = Math.min(1, this.tankTime / this.tankDuration);

    if (this.jumpTimer > 0) {
      this.jumpTimer -= dt;
      if (this.jumpTimer <= 0) {
        this.jumpActive = false;
      }
    }

    const slot = this.getCurrentObstacleSlot();
    this.inJumpWindow =
      slot != null &&
      this.tankProgress >= slot - this.jumpWindowBefore &&
      this.tankProgress <= slot + this.jumpWindowAfter;

    if (slot != null && this.tankProgress >= slot + this.obstaclePassMargin) {
      if (this._jumpArmed) {
        this.obstaclesPassed += 1;
        this._jumpArmed = false;
        this.jumpActive = false;
        return { obstacleCleared: true };
      }
      return { failed: true };
    }

    if (this.tankProgress >= 1 && this.obstaclesPassed >= this.obstacleCount) {
      return { won: true };
    }
    if (this.tankProgress >= 1 && this.obstaclesPassed < this.obstacleCount) {
      return { failed: true };
    }
    return {};
  }

  /**
   * @param {'left'|'right'} dir
   */
  moveLane(dir) {
    if (this.phase !== 'supply') return;
    this.playerLane = Phaser.Math.Clamp(this.playerLane + (dir === 'right' ? 1 : -1), 0, 2);
  }

  /**
   * @param {number} lane
   */
  setPlayerLane(lane) {
    if (this.phase !== 'supply') return;
    this.playerLane = Phaser.Math.Clamp(lane, 0, 2);
  }

  /**
   * @returns {{ ok: boolean, reason: 'jump'|'armed'|'early'|'late'|'none'|'wrong_phase' }}
   */
  jump() {
    if (this.phase !== 'tank') return { ok: false, reason: 'wrong_phase' };

    const slot = this.getCurrentObstacleSlot();
    if (slot == null) return { ok: false, reason: 'none' };

    if (this._jumpArmed) return { ok: true, reason: 'armed' };

    if (this.tankProgress < slot - this.jumpWindowBefore) {
      return { ok: false, reason: 'early' };
    }
    if (this.tankProgress > slot + this.jumpWindowAfter) {
      return { ok: false, reason: 'late' };
    }

    this._jumpArmed = true;
    this.jumpActive = true;
    this.jumpTimer = this.jumpVisualSec;
    return { ok: true, reason: 'jump' };
  }
}
