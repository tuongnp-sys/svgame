import Phaser from 'phaser';
import { createChapterController, getChapterMechanic } from './core/chapterControllerFactory.js';
import { getChapterMeta } from './core/chapterConfig.js';
import facts from './data/content/facts.json';
import { bgmController } from './audio/BgmController.js';
import { setGamePhase } from './gameSession.js';
import { platform } from '../platform/index.js';
import { TimingBarView } from './ui/TimingBarView.js';
import { ChapterHudView } from './ui/ChapterHudView.js';
import { RhythmLaneView } from './ui/RhythmLaneView.js';
import { BinaryChoiceView } from './ui/BinaryChoiceView.js';
import { SwipeArrowsView } from './ui/SwipeArrowsView.js';
import { PathDrawView } from './ui/PathDrawView.js';
import { PathWaypointCardOverlayView } from './ui/PathWaypointCardOverlayView.js';
import { RunnerView } from './ui/RunnerView.js';
import { createMuteToggle } from './ui/MuteToggle.js';
import { createLangToggle } from './ui/LangToggle.js';
import { subscribeLangChange } from './core/locale.js';
import { isTutorialSeen, markTutorialSeen, isBriefingSeen } from './core/saveProgress.js';
import { GameJuice } from './core/GameJuice.js';
import { TimingBarTutorialView } from './ui/TimingBarTutorialView.js';
import { BattleBriefingOverlayView } from './ui/BattleBriefingOverlayView.js';
import { ChapterOverOverlayView } from './ui/ChapterOverOverlayView.js';
import { MilestoneMomentOverlayView } from './ui/MilestoneMomentOverlayView.js';

export class ChapterScene extends Phaser.Scene {
  constructor() {
    super('ChapterScene');
  }

  init(data) {
    this.chapterId = data.chapterId ?? 2;
    this.mechanic = getChapterMechanic(this.chapterId);
    this._ending = false;
  }

  create() {
    setGamePhase('PLAYING');
    platform.gameplayStart();
    platform.updateLevel(this.chapterId);
    bgmController.play(this, 'chapter');

    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const meta = getChapterMeta(this.chapterId);

    this.add.rectangle(w / 2, h / 2, w, h, 0x0a1628);

    this.hud = new ChapterHudView(this);
    this.hud.setChapterMeta(meta, this.mechanic, this.chapterId);
    createMuteToggle(this, 30);
    createLangToggle(this, 30);
    const unsubLang = subscribeLangChange(() => this._refreshLang());
    this.events.once('shutdown', () => {
      unsubLang();
      this._cleanup();
    });

    this.timingView = null;
    this.rhythmView = null;
    this.choiceView = null;
    this.swipeView = null;
    this.pathView = null;
    this.runnerView = null;
    this.stakesGroup = this.add.group();
    this.shipSprite = null;

    if (this.mechanic === 'timing_bar') this._setupTimingBar(w, h);
    else if (this.mechanic === 'rhythm') this._setupRhythm(w, h);
    else if (this.mechanic === 'binary_choice') this._setupBinaryChoice(w, h);
    else if (this.mechanic === 'rhythm_swipe') this._setupSwipe(w, h);
    else if (this.mechanic === 'path_draw') this._setupPathDraw(w, h);
    else if (this.mechanic === 'runner') this._setupRunner(w, h);

    this.controller = createChapterController(this.chapterId, {
      onHit: (p) => this._onHit(p),
      onStakePlaced: (p) => this._onStakePlaced(p),
      onStakeFailed: () => this._onStakeFailed(),
      onShipSpawn: () => this._onShipSpawn(),
      onShipEscaped: () => this._onShipEscaped(),
      onNoteMiss: () => this._onNoteMiss(),
      onWrongChoice: () => {
        GameJuice.onWrongChoice(this);
        this.choiceView?.flashWrong();
      },
      onWaveMiss: () => bgmController.playSfx(this, 'miss'),
      onStormHit: () => {
        bgmController.playSfx(this, 'miss');
        GameJuice.onStormHit(this);
        this.pathView?.flashStormHit();
      },
      onWaypoint: (p) => {
        const wp = p.waypoint ?? this.controller.path.waypoints[p.index];
        if (!wp) return;
        if (this._waypointCardShown === p.index) return;
        this._waypointCardShown = p.index;

        this.pathView?.celebrateWaypoint(wp.x, wp.y, p.index);
        if (wp.title) GameJuice.onPathMilestone(this, wp.title);
        bgmController.playSfx(this, 'stake');

        this.controller.setPaused(true);
        this.waypointCard?.destroy();
        this.waypointCard = new PathWaypointCardOverlayView(
          this,
          wp,
          p.index + 1,
          this.controller.path.waypoints.length,
          () => {
            this.waypointCard = null;
            this.controller.setPaused(false);
          },
        );
      },
      onPathComplete: () => {
        GameJuice.onPathComplete(this);
        bgmController.playSfx(this, 'unlock');
        this.pathView?.showPathComplete();
        this.hud.setPathDrawFlagPhase(true);
      },
      onFlagHoldStart: () => {
        this.pathView?.onFlagHoldStart();
      },
      onFlagPlanted: () => {
        GameJuice.onFlagPlanted(this);
        bgmController.playSfx(this, 'perfect');
        this.pathView?.playFlagPlanted();
      },
      onRunPhaseChange: () => {
        bgmController.playSfx(this, 'unlock');
        this.controller.setPaused(true);
        this.runnerView?.showTankPhaseIntro(() => {
          this.controller.setPaused(false);
          this.hud.setRunnerTankPhase(true);
        });
      },
      onTankObstacleMiss: () => {
        this.runnerView?.flashTankMiss();
      },
      onJumpEarly: () => {
        this.runnerView?.flashJumpEarly();
      },
      onGameEnd: (p) => this._onGameEnd(p),
    });

    if (this.pathView) this.pathView.controller = this.controller;
    if (this.runnerView) this.runnerView.controller = this.controller;

    this.controller.setPaused(true);
    this.tutorial = null;
    this.briefing = null;
    this.overOverlay = null;
    this.waypointCard = null;
    this._waypointCardShown = -1;

    const afterBriefing = () => {
      if (this.chapterId === 2 && !isTutorialSeen(2)) {
        this.tutorial = new TimingBarTutorialView(this, () => {
          markTutorialSeen(2);
          this.tutorial = null;
          this.controller.setPaused(false);
        });
      } else {
        this.controller.setPaused(false);
      }
    };

    if (!isBriefingSeen(this.chapterId)) {
      this.briefing = new BattleBriefingOverlayView(this, this.chapterId, () => {
        this.briefing = null;
        afterBriefing();
      });
    } else {
      afterBriefing();
    }

    this.input.keyboard?.on('keydown-SPACE', () => this._onTap());
  }

  _refreshLang() {
    const meta = getChapterMeta(this.chapterId);
    this.hud?.refreshLang(meta);
    if (this.controller?.state) {
      this.hud?.update(this.controller.state, {});
    }
    this.timingView?.refreshLang?.();
    this.choiceView?.refreshLang?.();
    this.rhythmView?.refreshLang?.();
    this.swipeView?.refreshLang?.();
    this.pathView?.refreshLang?.();
    this.runnerView?.refreshLang?.();
    if (this.controller?.state?.phase === 'playing' && this.mechanic === 'binary_choice') {
      this.choiceView?.update(
        this.controller.getCurrentPrompt(),
        this.controller.state.roundTimer / 3,
        {
          fight: this.controller.state.fightCount,
          peace: this.controller.state.peaceCount,
          round: this.controller.state.round + 1,
          total: this.controller.state.roundsTotal,
        },
      );
    }
  }

  _setupTimingBar(w, h) {
    this.add.image(w / 2, h * 0.42, 'game_assets', 'river').setAlpha(0.95);
    this.shipSprite = this.add
      .image(-40, h * 0.38, 'game_assets', 'ship')
      .setScale(1.05)
      .setVisible(false)
      .setDepth(10);
    this.timingView = new TimingBarView(this, h * 0.56);
    this.timingView.onTap = () => this._onTap();
    this.timingView.updateStakeProgress(0, this.controller?.state?.stakesRequired ?? 10);
  }

  _setupRhythm(w, h) {
    this.add.image(w / 2, h * 0.4, 'game_assets', 'fog_map').setAlpha(0.4).setScale(0.9);
    this.rhythmView = new RhythmLaneView(this);
    this.rhythmView.onTap = () => this._onTap();
  }

  _setupBinaryChoice(w, h) {
    this.add.rectangle(w / 2, h * 0.45, w - 24, h * 0.5, 0x1a2744, 0.6).setDepth(2);
    this.choiceView = new BinaryChoiceView(this);
    this.choiceView.onChoice = (c) => {
      this.controller.handleChoice(c);
      bgmController.playSfx(this, c === 'fight' ? 'tap' : 'miss');
    };
  }

  _setupSwipe(w, h) {
    this.add.image(w / 2, h * 0.4, 'game_assets', 'fog_map').setAlpha(0.35).setScale(0.95);
    this.add.image(w / 2, h * 0.55, 'game_assets', 'sword').setScale(1.2).setAlpha(0.25).setDepth(3);
    this.swipeView = new SwipeArrowsView(this);
    this.swipeView.onSwipe = (dx, dy) => {
      const result = this.controller.handleSwipe(dx, dy);
      if (result) {
        this.swipeView.showFeedback(result.grade);
      }
    };
  }

  _setupPathDraw(w, h) {
    this.add.image(w / 2, h * 0.42, 'game_assets', 'fog_map').setAlpha(0.5).setScale(1.05);
    this.pathView = new PathDrawView(this);
  }

  _setupRunner(w, h) {
    this.add.rectangle(w / 2, h * 0.35, w, h * 0.45, 0x1a2744, 0.4).setDepth(1);
    this.runnerView = new RunnerView(this);
  }

  _cleanup() {
    this.briefing?.destroy(true);
    this.tutorial?.destroy(true);
    this.milestoneOverlay?.destroy();
    this.waypointCard?.destroy();
    this.overOverlay?.destroy(true);
    this.tutorial = null;
    this.timingView?.destroy();
    this.rhythmView?.destroy();
    this.choiceView?.destroy();
    this.swipeView?.destroy();
    this.pathView?.destroy();
    this.runnerView?.destroy();
    this.input.keyboard?.off('keydown-SPACE');
  }

  _onTap() {
    const result = this.controller.handleTap?.();
    if (!result) return;
    if (this.timingView) this.timingView.showFeedback(result.grade);
    if (this.rhythmView) this.rhythmView.showFeedback(result.grade);
  }

  _onHit(payload) {
    const sfx =
      payload.grade === 'perfect' ? 'perfect' : payload.grade === 'miss' ? 'miss' : 'stake';
    bgmController.playSfx(this, sfx);
    GameJuice.onHit(this, payload.grade, payload.combo ?? 0);
    if (payload.combo >= 5) GameJuice.highlightCombo(this, payload.combo);
  }

  _onStakePlaced(payload) {
    GameJuice.onStakePlaced(this);
    const h = this.cameras.main.height;
    const stake = this.add.image(
      40 + (payload.stakesDriven % 8) * 38,
      h * 0.48 + Math.floor(payload.stakesDriven / 8) * 12,
      'game_assets',
      'stake',
    );
    stake.setDepth(9).setScale(0.9).setAlpha(0);
    this.tweens.add({ targets: stake, alpha: 1, y: stake.y - 20, duration: 280, ease: 'Back.easeOut' });
    this.stakesGroup.add(stake);
  }

  _onStakeFailed() {
    const h = this.cameras.main.height;
    const w = this.cameras.main.width;
    const floater = this.add.image(w / 2, h * 0.45, 'game_assets', 'stake').setTint(0xe74c3c);
    this.tweens.add({
      targets: floater,
      y: h * 0.2,
      alpha: 0,
      angle: 30,
      duration: 600,
      onComplete: () => floater.destroy(),
    });
  }

  _onNoteMiss() {
    bgmController.playSfx(this, 'miss');
    GameJuice.onMiss(this);
  }

  _onShipSpawn() {
    const h = this.cameras.main.height;
    this.shipSprite?.setPosition(-40, h * 0.38).setVisible(true).setAlpha(1);
  }

  _onShipEscaped() {
    this.shipSprite?.setVisible(false);
    GameJuice.onShipEscape(this);
  }

  _calcScore(state) {
    return (
      (state.perfectCount ?? 0) * 100 +
      (state.greatCount ?? 0) * 50 +
      (state.goodCount ?? 0) * 20 +
      (state.fightCount ?? 0) * 80 +
      (state.wavesHit ?? 0) * 90 +
      (state.waypointsDone ?? 0) * 120 +
      (state.riceCollected ?? 0) * 80 +
      (state.obstaclesPassed ?? 0) * 150
    );
  }

  _freezeGameplay() {
    this.rhythmView?.setInputEnabled(false);
    this.rhythmView && (this.rhythmView.onTap = null);
    this.timingView?.setActive(false);
    this.timingView && (this.timingView.onTap = null);
    this.swipeView && (this.swipeView.onSwipe = null);
    this.choiceView && (this.choiceView.onChoice = null);
    if (this.pathView) this.pathView.controller = null;
    if (this.runnerView) this.runnerView.controller = null;
    if (this.controller) this.controller.setPaused(true);
  }

  _onGameEnd(payload) {
    if (this._ending) return;
    this._ending = true;

    this.hud.hideGameplay();
    this.timingView?.setActive(false);

    const score = Math.max(1, this._calcScore(payload.state));

    platform.setHasCompletedRun(true);
    platform.updateScore(score);
    platform.ping('game_over', { chapter: this.chapterId, stars: payload.stars });

    const meta = getChapterMeta(this.chapterId);
    const fact = facts[meta?.factId ?? 'ch2'];

    const overData = {
      won: payload.won,
      stars: payload.stars,
      chapterId: this.chapterId,
      score,
      artifact: meta?.artifact ?? '',
      fact: fact ?? '',
      cliffhanger: meta?.cliffhanger ?? '',
      stats: {
        perfect: payload.state.perfectCount ?? payload.state.fightCount ?? payload.state.wavesHit ?? 0,
        miss: payload.state.missCount ?? payload.state.peaceCount ?? 0,
        maxCombo: payload.state.maxCombo ?? 0,
      },
    };

    this._freezeGameplay();
    if (payload.won) {
      this.milestoneOverlay = new MilestoneMomentOverlayView(this, this.chapterId, () => {
        this.milestoneOverlay = null;
        this.overOverlay = new ChapterOverOverlayView(this, overData);
      });
    } else {
      this.overOverlay = new ChapterOverOverlayView(this, overData);
    }
  }

  update(_time, delta) {
    if (this._ending || !this.controller) return;
    this.controller.update(delta / 1000);
    const state = this.controller.state;
    const hudExtra = {};
    if (this.mechanic === 'timing_bar' && state.shipOnScreen) {
      hudExtra.shipDanger = state.shipProgress >= 0.65;
    }
    this.hud.update(state, hudExtra);

    if (this.mechanic === 'timing_bar' && this.controller.timing) {
      const timing = this.controller.timing;
      const active = state.phase === 'playing';
      this.timingView?.setActive(active);
      this.timingView?.updateStakeProgress(state.stakesDriven, state.stakesRequired);
      if (active) {
        this.timingView.updateMarker(
          timing.getPosition(),
          timing.getTargetCenter(),
          timing.getZonePercents(),
        );
      }
      if (state.shipOnScreen && this.shipSprite) {
        const w = this.cameras.main.width;
        this.shipSprite.x = -40 + state.shipProgress * (w + 80);
      }
    }

    if (this.mechanic === 'rhythm' && this.controller.rhythm) {
      this.rhythmView?.syncNotes(this.controller.rhythm.notes);
    }

    if (this.mechanic === 'binary_choice' && this.choiceView && state.phase === 'playing') {
      this.choiceView.update(
        this.controller.getCurrentPrompt(),
        state.roundTimer / 3,
        {
          fight: state.fightCount,
          peace: state.peaceCount,
          round: state.round + 1,
          total: state.roundsTotal,
        },
      );
    }

    if (this.mechanic === 'rhythm_swipe' && this.controller.swipe) {
      this.swipeView?.update(this.controller.swipe.currentDir, this.controller.swipe.getTimerRatio());
    }

    if (this.mechanic === 'path_draw' && this.controller.path) {
      this.pathView?.refresh(
        this.controller.path.waypointIndex,
        this.controller.path.completed,
        state.flagHoldRatio ?? 0,
        this.controller.isFlagHolding?.() ?? false,
      );
    }

    if (this.mechanic === 'runner' && this.controller.runner) {
      this.runnerView?.sync(this.controller.runner, state);
    }
  }
}
