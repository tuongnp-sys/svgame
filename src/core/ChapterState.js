/** @typedef {'intro'|'playing'|'cooldown'|'won'|'lost'} ChapterPhase */

export class ChapterState {
  constructor() {
    this.phase = /** @type {ChapterPhase} */ ('intro');
    this.chapterId = 2;
    this.elapsed = 0;
    this.stakesDriven = 0;
    this.stakesRequired = 10;
    this.shipsEscaped = 0;
    this.maxShipEscapes = 2;
    this.perfectCount = 0;
    this.greatCount = 0;
    this.goodCount = 0;
    this.missCount = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.cooldownLeft = 0;
    this.shipTimer = 0;
    this.shipOnScreen = false;
    this.shipProgress = 0;
    this.paused = false;
    this.introLeft = 1;
  }

  get totalHits() {
    return this.perfectCount + this.greatCount + this.goodCount + this.missCount;
  }

  get perfectRatio() {
    if (this.totalHits === 0) return 0;
    return this.perfectCount / this.totalHits;
  }

  get stakesRemaining() {
    return Math.max(0, this.stakesRequired - this.stakesDriven);
  }

  isVictory() {
    return this.stakesDriven >= this.stakesRequired;
  }

  isDefeat() {
    return this.shipsEscaped > this.maxShipEscapes;
  }
}
