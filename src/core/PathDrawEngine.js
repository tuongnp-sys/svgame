import ch5Data from '../data/content/ch5Waypoints.json';

/**
 * Waypoint path for Chapter 5 — Nam tiến theo dòng thời gian (375×812).
 */
export const CH5_WAYPOINTS = ch5Data.waypoints;
export const CH5_STORMS = ch5Data.storms;

export class PathDrawEngine {
  /**
   * @param {object} opts
   */
  constructor(opts = {}) {
    this.waypoints = opts.waypoints ?? CH5_WAYPOINTS;
    this.storms = opts.storms ?? CH5_STORMS;
    this.grabRadius = opts.grabRadius ?? 42;
    this.stormRadius = opts.stormRadius ?? 36;
    this.flagHoldSeconds = opts.flagHoldSeconds ?? 1.2;
    /** Index of last reached waypoint (-1 = none yet). */
    this.waypointIndex = -1;
    this.drawing = false;
    this.flagHold = 0;
    this.stormHits = 0;
    this.completed = false;
    /** Bitmask — one storm penalty per zone per stroke. */
    this._strokeStormMask = 0;
  }

  reset() {
    this.waypointIndex = -1;
    this.drawing = false;
    this.flagHold = 0;
    this.stormHits = 0;
    this.completed = false;
    this._strokeStormMask = 0;
  }

  isDrawing() {
    return this.drawing;
  }

  cancelStroke() {
    this.drawing = false;
    this._strokeStormMask = 0;
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  pointerDown(x, y) {
    if (this.completed) return false;
    const nextIdx = this.waypointIndex + 1;
    const wp = this.waypoints[nextIdx];
    if (!wp) return false;
    if (Math.hypot(x - wp.x, y - wp.y) <= this.grabRadius) {
      this.drawing = true;
      this._strokeStormMask = 0;
      this.waypointIndex = nextIdx;
      if (nextIdx >= this.waypoints.length - 1) {
        this.completed = true;
        this.drawing = false;
        this.flagHold = 0;
      }
      return true;
    }
    return false;
  }

  pointerUp() {
    this.drawing = false;
    this.flagHold = 0;
    this._strokeStormMask = 0;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} dt
   */
  pointerMove(x, y, _dt) {
    if (!this.drawing) return { advanced: false, stormHit: false };

    for (let i = 0; i < this.storms.length; i++) {
      const s = this.storms[i];
      if (Math.hypot(x - s.x, y - s.y) < this.stormRadius) {
        if (this._strokeStormMask & (1 << i)) {
          return { advanced: false, stormHit: false };
        }
        this._strokeStormMask |= 1 << i;
        this.drawing = false;
        return { advanced: false, stormHit: true };
      }
    }

    const targetIdx = this.waypointIndex + 1;
    const target = this.waypoints[targetIdx];
    if (!target) return { advanced: false, stormHit: false };

    if (Math.hypot(x - target.x, y - target.y) <= this.grabRadius) {
      this.waypointIndex = targetIdx;
      if (this.waypointIndex >= this.waypoints.length - 1) {
        this.completed = true;
        this.drawing = false;
        this.flagHold = 0;
      }
      return { advanced: true, stormHit: false };
    }

    return { advanced: false, stormHit: false };
  }

  getWaypointsDone() {
    if (this.completed) return this.waypoints.length;
    return Math.max(0, this.waypointIndex + 1);
  }

  getNextTargetIndex() {
    if (this.completed) return -1;
    return this.waypointIndex + 1;
  }

  isFlagReady() {
    return this.completed && this.flagHold >= this.flagHoldSeconds;
  }

  getProgress() {
    return this.getWaypointsDone() / this.waypoints.length;
  }
}
