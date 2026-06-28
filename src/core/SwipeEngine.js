/** @typedef {'up'|'down'|'left'|'right'} SwipeDir */

const DIRS = /** @type {SwipeDir[]} */ (['up', 'down', 'left', 'right']);

/**
 * Directional swipe prompts — Chapter 4 (Tây Sơn chặn quân).
 */
export class SwipeEngine {
  /**
   * @param {object} opts
   */
  constructor(opts = {}) {
    this.promptDuration = opts.promptDuration ?? 2.2;
    this.cooldownBetween = opts.cooldownBetween ?? 0.35;
    /** @type {SwipeDir|null} */
    this.currentDir = null;
    this.timer = 0;
    this.cooldown = 0;
    this.active = false;
  }

  reset() {
    this.currentDir = null;
    this.timer = 0;
    this.cooldown = 0;
    this.active = false;
  }

  begin() {
    this.active = true;
    this.cooldown = 0.5;
  }

  /**
   * @param {number} dt
   */
  update(dt) {
    if (!this.active) return { expired: false };

    if (this.cooldown > 0) {
      this.cooldown -= dt;
      if (this.cooldown <= 0) this._spawn();
      return { expired: false };
    }

    if (!this.currentDir) return { expired: false };

    this.timer -= dt;
    if (this.timer <= 0) {
      this.currentDir = null;
      this.cooldown = this.cooldownBetween;
      return { expired: true };
    }
    return { expired: false };
  }

  _spawn() {
    this.currentDir = DIRS[Math.floor(Math.random() * DIRS.length)];
    this.timer = this.promptDuration;
  }

  /**
   * @param {number} dx
   * @param {number} dy
   * @returns {{ grade: 'perfect'|'miss', dir: SwipeDir|null }}
   */
  evaluateSwipe(dx, dy) {
    if (!this.currentDir) return { grade: 'miss', dir: null };

    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (ax < 24 && ay < 24) return { grade: 'miss', dir: null };

    /** @type {SwipeDir} */
    let swiped;
    if (ax > ay) swiped = dx > 0 ? 'right' : 'left';
    else swiped = dy > 0 ? 'down' : 'up';

    const hit = swiped === this.currentDir;
    const dir = this.currentDir;
    this.currentDir = null;
    this.cooldown = this.cooldownBetween;
    return { grade: hit ? 'perfect' : 'miss', dir };
  }

  getTimerRatio() {
    if (!this.currentDir || this.promptDuration <= 0) return 0;
    return Math.max(0, this.timer / this.promptDuration);
  }
}
