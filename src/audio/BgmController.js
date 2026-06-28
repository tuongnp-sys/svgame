import audioConfig from '../data/audio.json';

const MUTE_KEY = 'suviet_muted';
const SAVE_KEY = 'suviet_progress';

/** @typedef {'menu'|'chapter'|'victory'} BgmTrackId */

class BgmController {
  constructor() {
    /** @type {Set<string>} */
    this._available = new Set();
    /** @type {Phaser.Scene|null} */
    this._scene = null;
    /** @type {Phaser.Sound.BaseSound|null} */
    this._sound = null;
    /** @type {BgmTrackId|null} */
    this._trackId = null;
    /** @type {Phaser.Sound.BaseSound|null} */
    this._oneShotSound = null;
    this.muted = localStorage.getItem(MUTE_KEY) === '1';
  }

  markAvailable(key) {
    this._available.add(key);
  }

  isTrackReady(trackId) {
    const key = audioConfig.tracks[trackId];
    return key ? this._available.has(key) : false;
  }

  _vol(trackId) {
    return audioConfig.volume[trackId] ?? 0.45;
  }

  setMuted(v) {
    this.muted = v;
    localStorage.setItem(MUTE_KEY, v ? '1' : '0');
    this._applyVolumes();
  }

  toggleMuted() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  _applyVolumes() {
    if (this._sound && 'setVolume' in this._sound) {
      this._sound.setVolume(this.muted ? 0 : this._vol(this._trackId ?? 'menu'));
    }
    if (this._oneShotSound && 'setVolume' in this._oneShotSound) {
      this._oneShotSound.setVolume(this.muted ? 0 : this._vol('victory'));
    }
  }

  /**
   * @param {Phaser.Scene} scene
   * @param {BgmTrackId} trackId
   */
  play(scene, trackId) {
    const key = audioConfig.tracks[trackId];
    if (!key || !this._available.has(key)) return;
    if (this._trackId === trackId && this._sound?.isPlaying) return;

    this.stopMusic();
    this._scene = scene;
    this._trackId = trackId;
    this._sound = scene.sound.add(key, { loop: trackId !== 'victory', volume: 0 });
    this._sound.play();
    this._applyVolumes();
  }

  /**
   * @param {Phaser.Scene} scene
   * @param {keyof typeof audioConfig.sfx} sfxId
   */
  playSfx(scene, sfxId) {
    if (this.muted) return;
    const key = audioConfig.sfx[sfxId];
    if (!key || !this._available.has(key)) return;
    const volKey = sfxId === 'victory' ? 'victory_sfx' : sfxId;
    scene.sound.play(key, { volume: this._vol(volKey) });
  }

  /**
   * @param {Phaser.Scene} scene
   */
  playVictoryFinale(scene) {
    if (this.muted) return;
    const key = audioConfig.sfx.victory;
    if (!key || !this._available.has(key)) return;
    this.stopOneShot();
    this._oneShotSound = scene.sound.add(key, { volume: 0 });
    this._oneShotSound.once('complete', () => this.stopOneShot());
    this._oneShotSound.play();
    this._applyVolumes();
  }

  pause() {
    this._sound?.pause();
  }

  resume() {
    if (this._sound?.isPaused) this._sound.resume();
  }

  stopMusic() {
    this._sound?.stop();
    this._sound?.destroy();
    this._sound = null;
    this._trackId = null;
  }

  stopOneShot() {
    this._oneShotSound?.stop();
    this._oneShotSound?.destroy();
    this._oneShotSound = null;
  }

  stop() {
    this.stopOneShot();
    this.stopMusic();
  }

  stopUnderlyingSceneAudio(overlayScene) {
    const game = overlayScene.game;
    for (const s of game.scene.scenes) {
      if (s === overlayScene) continue;
      s.sound?.stopAll();
    }
    this.stop();
  }
}

export const bgmController = new BgmController();

/**
 * Procedural buffers until MP3 assets are added.
 * @param {Phaser.Scene} scene
 */
export function preloadAudioAssets(scene) {
  const ctx = scene.sound.context;
  if (!ctx) return;

  const tracks = [
    { key: 'bgm_menu', freq: 196, dur: 2.5 },
    { key: 'bgm_chapter', freq: 147, dur: 2.5 },
    { key: 'bgm_victory', freq: 262, dur: 1.2 },
    { key: 'sfx_perfect', freq: 880, dur: 0.08 },
    { key: 'sfx_stake', freq: 330, dur: 0.12 },
    { key: 'sfx_miss', freq: 110, dur: 0.15 },
    { key: 'sfx_victory', freq: 523, dur: 0.45 },
    { key: 'sfx_unlock', freq: 660, dur: 0.2 },
    { key: 'sfx_tap', freq: 440, dur: 0.06 },
  ];

  for (const t of tracks) {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * t.dur);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const env = Math.min(1, i / (sampleRate * 0.02)) * Math.max(0, 1 - i / length);
      data[i] = Math.sin((2 * Math.PI * t.freq * i) / sampleRate) * env * 0.22;
    }
    scene.cache.audio.add(t.key, buffer);
    bgmController.markAvailable(t.key);
  }
}

export function registerLoadedTracks() {
  // keys registered in preloadAudioAssets
}
