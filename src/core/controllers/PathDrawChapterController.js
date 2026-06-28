import { getChapterConfig } from '../chapterConfig.js';
import { computeStars } from '../StarRatingSystem.js';
import { PathDrawEngine } from '../PathDrawEngine.js';
import balance from '../../data/balance.json';

export class PathDrawChapterState {
  constructor() {
    this.chapterId = 5;
    this.phase = 'intro';
    this.introLeft = 1;
    this.paused = false;
    this.elapsed = 0;
    this.perfectCount = 0;
    this.greatCount = 0;
    this.goodCount = 0;
    this.missCount = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.stormHits = 0;
    this.maxStormHits = 2;
    this.waypointsTotal = 8;
    this.waypointsDone = 0;
    this.flagHoldRatio = 0;
  }

  get totalHits() {
    return this.waypointsDone + this.missCount;
  }

  get perfectRatio() {
    if (this.waypointsTotal === 0) return 0;
    return this.waypointsDone / this.waypointsTotal;
  }

  isVictory() {
    return this.phase === 'won';
  }

  isDefeat() {
    return this.stormHits > this.maxStormHits;
  }
}

export class PathDrawChapterController {
  /**
   * @param {number} chapterId
   * @param {object} [events]
   */
  constructor(chapterId = 5, events = {}) {
    this.events = events;
    this.config = getChapterConfig(chapterId);
    const pathCfg = { ...balance.path, ...this.config.path };
    this.state = new PathDrawChapterState();
    this.state.chapterId = chapterId;
    this.state.maxStormHits = pathCfg.maxStormHits ?? 2;
    this.path = new PathDrawEngine({
      grabRadius: pathCfg.grabRadius,
      stormRadius: pathCfg.stormRadius,
      flagHoldSeconds: pathCfg.flagHoldSeconds,
    });
    this.state.waypointsTotal = this.path.waypoints.length;
    this._pointerDown = false;
    this._flagHolding = false;
    this._winPending = false;
    this._winDelay = 0;
  }

  setPaused(v) {
    this.state.paused = v;
  }

  handleTap() {
    return null;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {boolean} true when stroke started from the active waypoint
   */
  handlePointerDown(x, y) {
    if (this.state.paused || this.state.phase !== 'playing') return false;

    if (this.path.completed) {
      const last = this.path.waypoints[this.path.waypoints.length - 1];
      if (Math.hypot(x - last.x, y - last.y) < this.path.grabRadius * 1.5) {
        if (!this._flagHolding) {
          this.events.onFlagHoldStart?.({});
        }
        this._flagHolding = true;
      }
      return false;
    }

    this._pointerDown = this.path.pointerDown(x, y);
    if (this._pointerDown) {
      this.state.waypointsDone = this.path.getWaypointsDone();
      const wp = this.path.waypoints[this.path.waypointIndex];
      this.events.onWaypoint?.({ index: this.path.waypointIndex, label: wp?.label ?? '', waypoint: wp });
      if (this.path.completed) {
        this.events.onPathComplete?.({});
      }
    }
    return this._pointerDown;
  }

  handlePointerUp() {
    this._pointerDown = false;
    this._flagHolding = false;
    this.path.pointerUp();
  }

  isDrawing() {
    return this._pointerDown && this.path.drawing;
  }

  isFlagHolding() {
    return this._flagHolding;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} dt
   */
  handlePointerMove(x, y, dt) {
    if (this.state.paused || this.state.phase !== 'playing') return;

    if (this.path.completed) return;

    if (!this._pointerDown) return;

    const ev = this.path.pointerMove(x, y, dt);
    if (ev.stormHit) {
      this.state.stormHits += 1;
      this.state.missCount += 1;
      this.state.combo = 0;
      this._pointerDown = false;
      this.path.cancelStroke();
      this.events.onStormHit?.({ stormHits: this.state.stormHits });
      this._checkEnd();
      return;
    }

    if (ev.advanced) {
      this.state.waypointsDone = this.path.getWaypointsDone();
      this.state.perfectCount += 1;
      this.state.combo += 1;
      this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);
      const wp = this.path.waypoints[this.path.waypointIndex];
      this.events.onWaypoint?.({ index: this.path.waypointIndex, label: wp?.label ?? '', waypoint: wp });
      if (this.path.completed) {
        this.events.onPathComplete?.({});
      }
    }
  }

  _checkEnd() {
    if (this.state.isDefeat()) {
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
        this.events.onPhaseChange?.({ phase: 'playing' });
      }
      return;
    }

    if (s.phase !== 'playing') return;

    if (this.path.completed && this._flagHolding) {
      this.path.flagHold += dt;
      s.flagHoldRatio = Math.min(1, this.path.flagHold / this.path.flagHoldSeconds);
      if (this.path.isFlagReady()) {
        if (!this._winPending) {
          this._winPending = true;
          this._winDelay = 0;
          this.events.onFlagPlanted?.({});
        }
        this._winDelay += dt;
        if (this._winDelay >= 0.55) {
          s.phase = 'won';
          this._finish();
        }
      }
    }
  }

  getStars() {
    return computeStars(this.state, this.state.chapterId);
  }
}
