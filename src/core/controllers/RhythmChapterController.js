import { getChapterConfig } from '../chapterConfig.js';
import { computeStars } from '../StarRatingSystem.js';
import { RhythmEngine } from '../RhythmEngine.js';

export class RhythmChapterState {
  constructor() {
    this.chapterId = 1;
    this.phase = 'intro';
    this.introLeft = 1;
    this.paused = false;
    this.elapsed = 0;
    this.notesRequired = 8;
    this.notesHit = 0;
    this.perfectCount = 0;
    this.greatCount = 0;
    this.goodCount = 0;
    this.missCount = 0;
    this.combo = 0;
    this.maxCombo = 0;
  }

  get totalHits() {
    return this.perfectCount + this.greatCount + this.goodCount + this.missCount;
  }

  get perfectRatio() {
    if (this.totalHits === 0) return 0;
    return this.perfectCount / this.totalHits;
  }

  isVictory() {
    return this.notesHit >= this.notesRequired;
  }

  isDefeat() {
    return this.missCount >= 5;
  }
}

export class RhythmChapterController {
  /**
   * @param {number} chapterId
   * @param {object} [events]
   */
  constructor(chapterId = 1, events = {}) {
    this.events = events;
    this.config = getChapterConfig(chapterId);
    this.state = new RhythmChapterState();
    this.state.chapterId = chapterId;
    this.state.notesRequired = this.config.stakeCount ?? 8;
    this.rhythm = new RhythmEngine({
      hitY: 560,
      spawnY: 160,
      speed: 300,
      spawnInterval: 0.9,
    });
  }

  setPaused(v) {
    this.state.paused = v;
  }

  handleTap() {
    if (this.state.paused || this.state.phase !== 'playing') return null;
    const result = this.rhythm.evaluateTap();
    this._registerHit(result.grade);
    if (result.grade !== 'miss') {
      this.state.notesHit += 1;
      this.events.onNoteHit?.({ grade: result.grade, notesHit: this.state.notesHit });
    } else {
      this.events.onNoteMiss?.({});
    }
    this._checkEnd();
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
        this.rhythm.reset();
        this.events.onPhaseChange?.({ phase: 'playing' });
      }
      return;
    }

    if (s.phase === 'won' || s.phase === 'lost') return;

    const activeNotes = this.rhythm.notes.filter((n) => !n.resolved).length;
    const canSpawn = s.notesHit + activeNotes < s.notesRequired + 2;
    const ev = this.rhythm.update(dt, canSpawn && s.phase === 'playing');
    if (ev?.autoMiss) {
      this._registerHit('miss');
      this.events.onNoteMiss?.({ auto: true });
      this._checkEnd();
    }
  }

  getStars() {
    return computeStars(this.state, this.state.chapterId);
  }
}
