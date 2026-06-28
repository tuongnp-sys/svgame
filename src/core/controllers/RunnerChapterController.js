import Phaser from 'phaser';
import { getChapterConfig } from '../chapterConfig.js';
import { computeStars } from '../StarRatingSystem.js';
import { RunnerEngine } from '../RunnerEngine.js';
import balance from '../../data/balance.json';

export class RunnerChapterState {
  constructor() {
    this.chapterId = 6;
    this.phase = 'intro';
    this.introLeft = 1;
    this.paused = false;
    this.elapsed = 0;
    this.runPhase = 'supply';
    this.riceRequired = 6;
    this.riceCollected = 0;
    this.supplyMiss = 0;
    this.maxSupplyMiss = 3;
    this.tankProgress = 0;
    this.obstaclesPassed = 0;
    this.obstaclesTotal = 5;
    this.perfectCount = 0;
    this.greatCount = 0;
    this.goodCount = 0;
    this.missCount = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.playerLane = 1;
    this.inJumpWindow = false;
    this.jumpActive = false;
  }

  get totalHits() {
    return this.perfectCount + this.missCount;
  }

  get perfectRatio() {
    const attempts = this.obstaclesTotal + this.riceRequired;
    if (attempts === 0) return 0;
    return (this.riceCollected + this.obstaclesPassed) / attempts;
  }

  isVictory() {
    return this.phase === 'won';
  }

  isDefeat() {
    return this.phase === 'lost';
  }
}

export class RunnerChapterController {
  /**
   * @param {number} chapterId
   * @param {object} [events]
   */
  constructor(chapterId = 6, events = {}) {
    this.events = events;
    this.config = getChapterConfig(chapterId);
    const runCfg = { ...balance.runner, ...this.config.runner };
    this.state = new RunnerChapterState();
    this.state.chapterId = chapterId;
    this.state.riceRequired = runCfg.riceRequired ?? 6;
    this.state.maxSupplyMiss = runCfg.maxSupplyMiss ?? 3;
    this.state.obstaclesTotal = runCfg.obstacleCount ?? 5;
    this.runner = new RunnerEngine({
      supplyDuration: runCfg.supplyDuration,
      riceRequired: runCfg.riceRequired,
      maxSupplyMiss: runCfg.maxSupplyMiss,
      tankDuration: runCfg.tankDuration,
      obstacleCount: runCfg.obstacleCount,
      firstObstacleAt: runCfg.firstObstacleAt,
      obstacleSpacing: runCfg.obstacleSpacing,
      jumpWindowBefore: runCfg.jumpWindowBefore,
      jumpWindowAfter: runCfg.jumpWindowAfter,
      obstaclePassMargin: runCfg.obstaclePassMargin,
    });
  }

  setPaused(v) {
    this.state.paused = v;
  }

  handleTap() {
    if (this.state.paused || this.state.phase !== 'playing') return null;
    if (this.runner.phase === 'tank') {
      const result = this.runner.jump();
      if (result.ok && result.reason === 'jump') {
        this.state.perfectCount += 1;
        this.state.combo += 1;
        this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);
        this.state.jumpActive = true;
        this.events.onHit?.({ grade: 'perfect', combo: this.state.combo });
        return { grade: 'perfect' };
      }
      if (result.reason === 'early') {
        this.events.onJumpEarly?.();
        return { grade: 'miss' };
      }
      return { grade: 'miss' };
    }
    return null;
  }

  /**
   * @param {'left'|'right'} dir
   */
  handleLane(dir) {
    if (this.state.paused || this.state.phase !== 'playing') return;
    if (this.runner.phase !== 'supply') return;
    this.runner.moveLane(dir);
    this.state.playerLane = this.runner.playerLane;
  }

  /**
   * @param {number} lane 0–2
   */
  handleSelectLane(lane) {
    if (this.state.paused || this.state.phase !== 'playing') return;
    if (this.runner.phase !== 'supply') return;
    this.runner.setPlayerLane(lane);
    this.state.playerLane = this.runner.playerLane;
  }

  _syncState() {
    const s = this.state;
    const r = this.runner;
    s.runPhase = r.phase;
    s.riceCollected = r.riceCollected;
    s.supplyMiss = r.supplyMiss;
    s.tankProgress = r.tankProgress;
    s.obstaclesPassed = r.obstaclesPassed;
    s.playerLane = r.playerLane;
    s.inJumpWindow = r.inJumpWindow;
    s.jumpActive = r.jumpActive;
  }

  _checkFail() {
    this.state.phase = 'lost';
    this.state.missCount += 1;
    this._finish();
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
        this.runner.begin();
        this.events.onPhaseChange?.({ phase: 'playing' });
      }
      return;
    }

    if (s.phase !== 'playing') return;

    if (this.runner.phase === 'supply') {
      const ev = this.runner.updateSupply(dt);
      this._syncState();
      if (ev.phaseChange === 'tank') {
        this.events.onRunPhaseChange?.({ phase: 'tank' });
      }
      if (ev.failed) {
        this._checkFail();
      }
    } else {
      const ev = this.runner.updateTank(dt);
      this._syncState();
      if (ev.failed) {
        s.missCount += 1;
        s.combo = 0;
        this.events.onHit?.({ grade: 'miss', combo: 0 });
        this.events.onTankObstacleMiss?.();
        this._checkFail();
      }
      if (ev.won) {
        s.phase = 'won';
        s.obstaclesPassed = this.runner.obstaclesPassed;
        this._finish();
      }
    }
  }

  getStars() {
    return computeStars(this.state, this.state.chapterId);
  }
}
