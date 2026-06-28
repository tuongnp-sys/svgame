import { getChapterConfig } from '../chapterConfig.js';
import { computeStars } from '../StarRatingSystem.js';
import { getBinaryPrompt } from '../i18n.js';
export class BinaryChoiceChapterState {
  constructor() {
    this.chapterId = 3;
    this.phase = 'intro';
    this.introLeft = 1;
    this.paused = false;
    this.elapsed = 0;
    this.round = 0;
    this.roundsTotal = 8;
    this.roundTimer = 3;
    this.fightCount = 0;
    this.peaceCount = 0;
    this.perfectCount = 0;
    this.greatCount = 0;
    this.goodCount = 0;
    this.missCount = 0;
    this.combo = 0;
    this.maxCombo = 0;
  }

  get totalHits() {
    return this.fightCount + this.peaceCount;
  }

  get perfectRatio() {
    if (this.totalHits === 0) return 0;
    return this.fightCount / this.totalHits;
  }

  isVictory() {
    return this.round >= this.roundsTotal && this.fightCount >= 6;
  }

  isDefeat() {
    return this.peaceCount >= 3 || (this.round >= this.roundsTotal && this.fightCount < 6);
  }
}

export class BinaryChoiceChapterController {
  /**
   * @param {number} chapterId
   * @param {object} [events]
   */
  constructor(chapterId = 3, events = {}) {
    this.events = events;
    this.config = getChapterConfig(chapterId);
    this.state = new BinaryChoiceChapterState();
    this.state.chapterId = chapterId;
  }

  setPaused(v) {
    this.state.paused = v;
  }

  getCurrentPrompt() {
    return getBinaryPrompt(this.state.round);
  }

  /**
   * @param {'fight'|'peace'} choice
   */
  handleChoice(choice) {
    if (this.state.paused || this.state.phase !== 'playing') return null;

    const isFight = choice === 'fight';
    if (isFight) {
      this.state.fightCount += 1;
      this.state.perfectCount += 1;
      this.state.combo += 1;
      this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);
      this.events.onHit?.({ grade: 'perfect', combo: this.state.combo });
    } else {
      this.state.peaceCount += 1;
      this.state.missCount += 1;
      this.state.combo = 0;
      this.events.onHit?.({ grade: 'miss', combo: 0 });
      this.events.onWrongChoice?.({});
      if (this.state.peaceCount >= 3) {
        this.state.round += 1;
        this.state.phase = 'lost';
        this._finish();
        return { choice, round: this.state.round };
      }
    }

    this.state.round += 1;
    this.state.roundTimer = 3;
    this.events.onRoundComplete?.({
      round: this.state.round,
      fightCount: this.state.fightCount,
      peaceCount: this.state.peaceCount,
    });

    if (this.state.round >= this.state.roundsTotal) {
      if (this.state.isVictory()) this.state.phase = 'won';
      else this.state.phase = 'lost';
      this._finish();
    }
    return { choice, round: this.state.round };
  }

  handleTap() {
    return null;
  }

  _finish() {
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
        s.roundTimer = 3;
        this.events.onPhaseChange?.({ phase: 'playing' });
      }
      return;
    }

    if (s.phase !== 'playing') return;

    s.roundTimer -= dt;
    if (s.roundTimer <= 0) {
      this.handleChoice('peace');
    }
  }

  getStars() {
    return computeStars(this.state, this.state.chapterId);
  }
}
