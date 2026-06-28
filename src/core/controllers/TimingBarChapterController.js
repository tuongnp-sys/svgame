import { ChapterState } from '../ChapterState.js';
import { TimingEngine } from '../TimingEngine.js';
import { getChapterConfig } from '../chapterConfig.js';
import { computeStars } from '../StarRatingSystem.js';

export class TimingBarChapterController {
  /**
   * @param {number} chapterId
   * @param {object} [events]
   */
  constructor(chapterId = 2, events = {}) {
    this.events = events;
    this.config = getChapterConfig(chapterId);
    this.state = new ChapterState();
    this.timing = new TimingEngine(this.config.timing);
    this._initState();
  }

  _initState() {
    const s = this.state;
    s.chapterId = this.config.id;
    s.stakesRequired = this.config.stakeCount;
    s.maxShipEscapes = this.config.maxShipEscapes;
    s.phase = 'intro';
    s.introLeft = 1;
    s.shipTimer = (this.config.shipIntervalMs / 1000) * 0.6;
  }

  setPaused(v) {
    this.state.paused = v;
  }

  handleTap() {
    if (this.state.paused) return null;
    if (this.state.phase !== 'playing' || !this.timing.isAwaitingTap()) return null;

    const result = this.timing.evaluateTap();
    this._registerHit(result.grade);

    if (result.grade === 'miss') {
      this.events.onStakeFailed?.({ grade: result.grade });
      this._enterCooldown();
    } else {
      this.state.stakesDriven += 1;
      this.events.onStakePlaced?.({
        grade: result.grade,
        stakesDriven: this.state.stakesDriven,
        stakesRequired: this.state.stakesRequired,
      });
      this._checkEnd();
      if (this.state.phase === 'playing') this._enterCooldown();
    }

    this.events.onHit?.({ grade: result.grade, combo: this.state.combo });
    return result;
  }

  /** @param {'perfect'|'great'|'good'|'miss'} grade */
  _registerHit(grade) {
    const s = this.state;
    if (grade === 'perfect') {
      s.perfectCount += 1;
      s.combo += 1;
    } else if (grade === 'great') {
      s.greatCount += 1;
      s.combo += 1;
    } else if (grade === 'good') {
      s.goodCount += 1;
      s.combo = 0;
    } else {
      s.missCount += 1;
      s.combo = 0;
    }
    s.maxCombo = Math.max(s.maxCombo, s.combo);
  }

  _enterCooldown() {
    this.timing.endStake();
    this.state.cooldownLeft = this.config.stakeCooldownMs / 1000;
    this.state.phase = 'cooldown';
    this.events.onPhaseChange?.({ phase: this.state.phase });
  }

  _beginStake() {
    if (this.state.isVictory() || this.state.isDefeat()) return;
    this.state.phase = 'playing';
    this.timing.beginStake(this.state.stakesDriven);
    this.events.onPhaseChange?.({ phase: this.state.phase });
  }

  _checkEnd() {
    if (this.state.isVictory()) {
      this.state.phase = 'won';
      this._finish();
    } else if (this.state.isDefeat()) {
      this.state.phase = 'lost';
      this._finish();
    }
  }

  _finish() {
    this.timing.endStake();
    const stars = computeStars(this.state, this.state.chapterId);
    this.events.onGameEnd?.({
      won: this.state.phase === 'won',
      stars,
      state: this.state,
      config: this.config,
    });
  }

  update(dt) {
    if (this.state.paused) return;
    const s = this.state;
    s.elapsed += dt;

    if (s.phase === 'intro') {
      s.introLeft -= dt;
      if (s.introLeft <= 0) this._beginStake();
      return;
    }
    if (s.phase === 'won' || s.phase === 'lost') return;

    if (s.phase === 'cooldown') {
      s.cooldownLeft -= dt;
      if (s.cooldownLeft <= 0) this._beginStake();
      return;
    }

    if (s.phase === 'playing') {
      this.timing.update(dt);
      s.shipTimer -= dt;
      if (!s.shipOnScreen && s.shipTimer <= 0) {
        s.shipOnScreen = true;
        s.shipProgress = 0;
        this.events.onShipSpawn?.({});
      }
      if (s.shipOnScreen) {
        s.shipProgress += dt / 5.5;
        if (s.shipProgress >= 1) {
          s.shipOnScreen = false;
          s.shipsEscaped += 1;
          s.shipTimer = this.config.shipIntervalMs / 1000;
          this.events.onShipEscaped?.({
            shipsEscaped: s.shipsEscaped,
            maxShipEscapes: s.maxShipEscapes,
          });
          this._checkEnd();
        }
      }
    }
  }

  getStars() {
    return computeStars(this.state, this.state.chapterId);
  }
}
