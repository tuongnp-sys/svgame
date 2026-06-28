/** @typedef {'perfect'|'great'|'good'|'miss'} HitGrade */

/**
 * @param {object} config — from getChapterConfig().timing
 */
export class TimingEngine {
  /**
   * @param {object} config
   */
  constructor(config) {
    this._config = config;
    this._position = 0;
    this._direction = 1;
    this._speedMul = 1;
    this._active = false;
    this._awaitingTap = false;
  }

  reset() {
    this._position = 0;
    this._direction = 1;
    this._speedMul = 1;
    this._active = false;
    this._awaitingTap = false;
  }

  /** @param {number} stakeIndex */
  beginStake(stakeIndex) {
    this._position = Math.random() * 0.4 + 0.1;
    this._direction = Math.random() > 0.5 ? 1 : -1;
    this._speedMul = 1 + stakeIndex * (this._config.speedIncreasePerStake ?? 0);
    this._active = true;
    this._awaitingTap = true;
  }

  endStake() {
    this._active = false;
    this._awaitingTap = false;
  }

  isActive() {
    return this._active;
  }

  isAwaitingTap() {
    return this._awaitingTap;
  }

  getPosition() {
    return this._position;
  }

  getTargetCenter() {
    return this._config.targetCenter ?? 0.5;
  }

  getZonePercents() {
    return {
      perfect: this._config.perfectZonePercent ?? 0.08,
      great: this._config.greatZonePercent ?? 0.15,
      good: this._config.goodZonePercent ?? 0.24,
    };
  }

  /**
   * @param {number} dt — seconds
   */
  update(dt) {
    if (!this._active) return;
    const speed = (this._config.barSpeed ?? 1.2) * this._speedMul;
    this._position += this._direction * speed * dt;
    if (this._position >= 1) {
      this._position = 1;
      this._direction = -1;
    } else if (this._position <= 0) {
      this._position = 0;
      this._direction = 1;
    }
  }

  /**
   * @returns {{ grade: HitGrade, distance: number }}
   */
  evaluateTap() {
    if (!this._awaitingTap) {
      return { grade: 'miss', distance: 1 };
    }
    const center = this.getTargetCenter();
    const distance = Math.abs(this._position - center);
    const zones = this.getZonePercents();
    const halfPerfect = zones.perfect / 2;
    const halfGreat = zones.great / 2;
    const halfGood = zones.good / 2;

    /** @type {HitGrade} */
    let grade;
    if (distance <= halfPerfect) grade = 'perfect';
    else if (distance <= halfGreat) grade = 'great';
    else if (distance <= halfGood) grade = 'good';
    else grade = 'miss';

    this._awaitingTap = false;
    return { grade, distance };
  }

  /** Auto-miss when player waits too long on a stake window. */
  forceMiss() {
    this._awaitingTap = false;
    return { grade: /** @type {const} */ ('miss'), distance: 1 };
  }
}
