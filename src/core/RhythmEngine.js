let noteId = 0;

/**
 * Simplified rhythm lane for Chapter 1 — single lane, tap timing.
 */
export class RhythmEngine {
  /**
   * @param {object} opts
   */
  constructor(opts = {}) {
    this.hitY = opts.hitY ?? 560;
    this.spawnY = opts.spawnY ?? 180;
    this.speed = opts.speed ?? 320;
    this.spawnInterval = opts.spawnInterval ?? 0.85;
    /** @type {Array<{id:number,y:number,resolved:boolean}>} */
    this.notes = [];
    this.spawnTimer = 0;
    this.laneX = opts.laneX ?? 187;
    this.perfectWindow = opts.perfectWindow ?? 28;
    this.greatWindow = opts.greatWindow ?? 48;
    this.goodWindow = opts.goodWindow ?? 72;
  }

  reset() {
    noteId = 0;
    this.notes = [];
    this.spawnTimer = 0;
  }

  /**
   * @param {number} dt
   * @param {boolean} canSpawn
   */
  update(dt, canSpawn) {
    if (canSpawn) {
      this.spawnTimer += dt;
      while (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer -= this.spawnInterval;
        this.notes.push({ id: ++noteId, y: this.spawnY, resolved: false });
      }
    }

    for (let i = this.notes.length - 1; i >= 0; i--) {
      const n = this.notes[i];
      if (n.resolved) continue;
      n.y += this.speed * dt;
      if (n.y > this.hitY + this.goodWindow + 40) {
        this.notes.splice(i, 1);
        return { autoMiss: true };
      }
    }
    return null;
  }

  /**
   * @returns {{ grade: 'perfect'|'great'|'good'|'miss', note: object|null }}
   */
  evaluateTap() {
    let best = null;
    let bestDist = Infinity;
    for (const n of this.notes) {
      if (n.resolved) continue;
      const d = Math.abs(n.y - this.hitY);
      if (d < bestDist) {
        bestDist = d;
        best = n;
      }
    }
    if (!best) return { grade: 'miss', note: null };

    best.resolved = true;
    let grade;
    if (bestDist <= this.perfectWindow) grade = 'perfect';
    else if (bestDist <= this.greatWindow) grade = 'great';
    else if (bestDist <= this.goodWindow) grade = 'good';
    else grade = 'miss';

    const idx = this.notes.indexOf(best);
    if (idx >= 0) this.notes.splice(idx, 1);

    return { grade, note: best };
  }
}
