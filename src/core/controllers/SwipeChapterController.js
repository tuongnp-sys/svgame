import { getChapterConfig } from '../chapterConfig.js';
import { computeStars } from '../StarRatingSystem.js';
import { SwipeEngine } from '../SwipeEngine.js';
import balance from '../../data/balance.json';

export class SwipeChapterState {
  constructor() {
    this.chapterId = 4;
    this.phase = 'intro';
    this.introLeft = 1;
    this.paused = false;
    this.elapsed = 0;
    this.wavesRequired = 12;
    this.wavesHit = 0;
    this.perfectCount = 0;
    this.greatCount = 0;
    this.goodCount = 0;
    this.missCount = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.maxMiss = 4;
  }

  get totalHits() {
    return this.perfectCount + this.missCount;
  }

  get perfectRatio() {
    if (this.totalHits === 0) return 0;
    return this.perfectCount / this.totalHits;
  }

  isVictory() {
    return this.wavesHit >= this.wavesRequired;
  }

  isDefeat() {
    return this.missCount >= this.maxMiss;
  }
}

export class SwipeChapterController {
  /**
   * @param {number} chapterId
   * @param {object} [events]
   */
  constructor(chapterId = 4, events = {}) {
    this.events = events;
    this.config = getChapterConfig(chapterId);
    const swipeCfg = { ...balance.swipe, ...this.config.swipe };
    this.state = new SwipeChapterState();
    this.state.chapterId = chapterId;
    this.state.wavesRequired = swipeCfg.wavesRequired ?? 12;
    this.state.maxMiss = swipeCfg.maxMiss ?? 4;
    this.swipe = new SwipeEngine({
      promptDuration: swipeCfg.promptDuration,
      cooldownBetween: swipeCfg.cooldownBetween,
    });
  }

  setPaused(v) {
    this.state.paused = v;
  }

  handleTap() {
    return null;
  }

  /**
   * @param {number} dx
   * @param {number} dy
   */
  handleSwipe(dx, dy) {
    if (this.state.paused || this.state.phase !== 'playing') return null;
    const result = this.swipe.evaluateSwipe(dx, dy);
    if (!result.dir && result.grade === 'miss') return null;

    if (result.grade === 'perfect') {
      this.state.perfectCount += 1;
      this.state.wavesHit += 1;
      this.state.combo += 1;
      this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);
      this.events.onWaveHit?.({ wavesHit: this.state.wavesHit });
    } else {
      this.state.missCount += 1;
      this.state.combo = 0;
      this.events.onWaveMiss?.({});
    }

    this.events.onHit?.({ grade: result.grade, combo: this.state.combo });
    this._checkEnd();
    return result;
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
    this.swipe.reset();
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
      if (s.introLeft <= 0) {
        s.phase = 'playing';
        this.swipe.begin();
        this.events.onPhaseChange?.({ phase: 'playing' });
      }
      return;
    }

    if (s.phase !== 'playing') return;

    const ev = this.swipe.update(dt);
    if (ev.expired) {
      s.missCount += 1;
      s.combo = 0;
      this.events.onWaveMiss?.({ timeout: true });
      this.events.onHit?.({ grade: 'miss', combo: 0 });
      this._checkEnd();
    }
  }

  getStars() {
    return computeStars(this.state, this.state.chapterId);
  }
}
