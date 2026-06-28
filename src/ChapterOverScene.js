import Phaser from 'phaser';
import { ChapterOverOverlayView } from './ui/ChapterOverOverlayView.js';
import { normalizeChapterOverResult } from './core/sceneTransition.js';

/** @deprecated Dùng ChapterOverOverlayView trong ChapterScene; giữ scene cho tương thích. */
export class ChapterOverScene extends Phaser.Scene {
  constructor() {
    super('ChapterOverScene');
  }

  init(data) {
    this.result = normalizeChapterOverResult(data);
  }

  create() {
    this.overlay = new ChapterOverOverlayView(this, this.result);
  }
}
