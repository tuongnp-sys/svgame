import Phaser from 'phaser';
import { preloadAudioAssets, registerLoadedTracks } from './audio/BgmController.js';
import { loadProgress } from './core/saveProgress.js';
import { goToHub, goToIntro } from './core/sceneTransition.js';

/**
 * BootScene — procedural atlas + audio buffers.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const w = 375;
    const bar = this.add.rectangle(w / 2, 400, 200, 12, 0x1a2744);
    const fill = this.add.rectangle(w / 2 - 98, 400, 4, 8, 0xf4d03f).setOrigin(0, 0.5);

    this.load.on('progress', (v) => {
      fill.width = 196 * v;
    });

    preloadAudioAssets(this);
  }

  create() {
    this._buildAtlas();
    registerLoadedTracks();
    const progress = loadProgress();
    if (progress.introSeen) {
      goToHub(this);
    } else {
      goToIntro(this);
    }
  }

  _buildAtlas() {
    const defs = [
      {
        key: 'stake',
        w: 24,
        h: 80,
        draw: (g) => {
          g.fillStyle(0x8b4513, 1);
          g.fillRect(8, 10, 8, 70);
          g.fillStyle(0x95a5a6, 1);
          g.fillTriangle(4, 10, 20, 10, 12, 0);
        },
      },
      {
        key: 'ship',
        w: 80,
        h: 44,
        draw: (g) => {
          g.fillStyle(0x000000, 0.12);
          g.fillEllipse(40, 40, 68, 8);
          g.fillStyle(0x5d1a1a, 1);
          g.beginPath();
          g.moveTo(6, 30);
          g.lineTo(72, 26);
          g.lineTo(76, 34);
          g.lineTo(4, 38);
          g.closePath();
          g.fillPath();
          g.fillStyle(0xa93226, 1);
          g.beginPath();
          g.moveTo(10, 28);
          g.lineTo(68, 24);
          g.lineTo(62, 32);
          g.lineTo(14, 34);
          g.closePath();
          g.fillPath();
          g.fillStyle(0x6e2c00, 1);
          g.fillRect(16, 20, 44, 5);
          g.fillStyle(0x4a3728, 1);
          g.fillRect(20, 12, 18, 10);
          g.fillStyle(0x7b241c, 1);
          g.fillRect(22, 14, 14, 6);
          g.fillStyle(0x3d2914, 1);
          g.fillRect(38, 4, 5, 24);
          g.fillRect(30, 10, 30, 3);
          g.fillStyle(0xf4d03f, 1);
          g.fillTriangle(43, 6, 68, 18, 43, 18);
          g.fillStyle(0xe67e22, 0.35);
          g.fillTriangle(43, 6, 55, 12, 43, 14);
          g.fillStyle(0xffffff, 0.35);
          g.fillCircle(74, 30, 3);
        },
      },
      {
        key: 'river',
        w: 375,
        h: 200,
        draw: (g) => {
          g.fillStyle(0x1a3a5c, 0.9);
          g.fillRect(0, 40, 375, 160);
          g.fillStyle(0x2980b9, 0.4);
          for (let i = 0; i < 8; i++) {
            g.fillEllipse(i * 48 + 20, 80 + (i % 3) * 30, 40, 8);
          }
        },
      },
      {
        key: 'fog_map',
        w: 280,
        h: 360,
        draw: (g) => {
          g.fillStyle(0x2d3436, 0.3);
          g.fillRoundedRect(10, 20, 260, 320, 16);
          g.fillStyle(0x4a6fa5, 0.5);
          g.fillTriangle(80, 120, 140, 80, 200, 130);
          g.fillTriangle(100, 200, 160, 170, 220, 210);
        },
      },
      {
        key: 'sword',
        w: 32,
        h: 48,
        draw: (g) => {
          g.fillStyle(0xbdc3c7, 1);
          g.fillRect(14, 8, 4, 36);
          g.fillStyle(0x8b4513, 1);
          g.fillRect(8, 36, 20, 8);
          g.fillStyle(0xf4d03f, 1);
          g.fillTriangle(16, 0, 10, 10, 22, 10);
        },
      },
      {
        key: 'flag',
        w: 24,
        h: 32,
        draw: (g) => {
          g.fillStyle(0x8b4513, 1);
          g.fillRect(4, 4, 3, 28);
          g.fillStyle(0xc0392b, 1);
          g.fillTriangle(7, 6, 22, 14, 7, 22);
          g.fillStyle(0xf4d03f, 1);
          g.fillCircle(14, 14, 3);
        },
      },
    ];

    const pad = 2;
    let x = 0;
    let y = 0;
    let rowH = 0;
    const maxW = 512;
    const frames = {};

    for (const def of defs) {
      if (x + def.w > maxW) {
        x = 0;
        y += rowH + pad;
        rowH = 0;
      }
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      def.draw(g);
      g.generateTexture(`__tmp_${def.key}`, def.w, def.h);
      g.destroy();
      frames[def.key] = { x, y, w: def.w, h: def.h };
      x += def.w + pad;
      rowH = Math.max(rowH, def.h);
    }

    const atlasH = y + rowH;
    const canvas = this.textures.createCanvas('game_assets', maxW, atlasH);
    const ctx = canvas.getContext();

    for (const def of defs) {
      const f = frames[def.key];
      const src = this.textures.get(`__tmp_${def.key}`).getSourceImage();
      ctx.drawImage(src, f.x, f.y);
      this.textures.remove(`__tmp_${def.key}`);
    }

    for (const [key, f] of Object.entries(frames)) {
      canvas.add(key, 0, f.x, f.y, f.w, f.h);
    }
    canvas.refresh();
  }
}
