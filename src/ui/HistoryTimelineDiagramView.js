import Phaser from 'phaser';
import { getHistoryTimeline, getChapterMeta } from '../core/chapterConfig.js';
import { loadProgress } from '../core/saveProgress.js';
import { FONT_VI } from '../core/fonts.js';
import { localizeTimeline, t } from '../core/i18n.js';

const COLS = 3;

/**
 * Sơ đồ mũi tên 6 giai đoạn lịch sử — finale Ch.6.
 */
export class HistoryTimelineDiagramView {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} centerX
   * @param {number} centerY
   * @param {number} width
   * @param {number} depth
   * @param {{ highlightChapterId?: number }} [options]
   */
  constructor(scene, centerX, centerY, width, depth, options = {}) {
    this.scene = scene;
    this.nodes = [];
    const highlightId = options.highlightChapterId ?? 6;
    const timeline = localizeTimeline(getHistoryTimeline());
    const items = timeline.nodes ?? [];
    const completed = loadProgress().completed ?? {};

    const cellW = width / COLS;
    const rowGap = 44;
    const boxW = cellW - 8;
    const boxH = 54;
    const topY = centerY - rowGap / 2 - boxH / 2;
    const botY = centerY + rowGap / 2 + boxH / 2;
    const midY = (topY + botY) / 2;

    const positions = [];
    for (let i = 0; i < items.length; i++) {
      const row = Math.floor(i / COLS);
      const col = i % COLS;
      const x = centerX - width / 2 + cellW * col + cellW / 2;
      const y = row === 0 ? topY : botY;
      positions.push({ x, y, item: items[i] });
    }

    const gfx = scene.add.graphics().setDepth(depth);
    this.nodes.push(gfx);

    const arrowColor = 0xf4d03f;
    const lineW = 3;
    const head = 10;

    const drawArrowHead = (x, y, angle) => {
      gfx.fillStyle(arrowColor, 0.95);
      gfx.fillTriangle(
        x,
        y,
        x - head * Math.cos(angle - 0.42),
        y - head * Math.sin(angle - 0.42),
        x - head * Math.cos(angle + 0.42),
        y - head * Math.sin(angle + 0.42),
      );
    };

    const drawSegment = (x1, y1, x2, y2, withHead) => {
      gfx.lineStyle(lineW, arrowColor, 0.9);
      gfx.lineBetween(x1, y1, x2, y2);
      if (withHead) {
        drawArrowHead(x2, y2, Math.atan2(y2 - y1, x2 - x1));
      }
    };

    for (let i = 0; i < 2; i++) {
      const a = positions[i];
      const b = positions[i + 1];
      drawSegment(a.x + boxW / 2 + 4, a.y, b.x - boxW / 2 - 4, b.y, true);
    }

    const p2 = positions[2];
    const p3 = positions[3];
    drawSegment(p2.x, p2.y + boxH / 2 + 4, p2.x, midY, false);
    drawSegment(p2.x, midY, p3.x, midY, false);
    drawSegment(p3.x, midY, p3.x, p3.y - boxH / 2 - 4, true);

    for (let i = 3; i < 5; i++) {
      const a = positions[i];
      const b = positions[i + 1];
      drawSegment(a.x + boxW / 2 + 4, a.y, b.x - boxW / 2 - 4, b.y, true);
    }

    this.nodes.push(
      scene.add
        .text(centerX, topY - boxH / 2 - 18, timeline.title ?? t('timeline.defaultTitle'), {
          fontFamily: FONT_VI,
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#95a5a6',
        })
        .setOrigin(0.5)
        .setDepth(depth + 1),
    );

    for (const { x, y, item } of positions) {
      const chId = item.chapterId;
      const meta = getChapterMeta(chId);
      const won = completed[String(chId)]?.won;
      const isHighlight = chId === highlightId;
      const colorHex = meta?.mapColor ?? '#f4d03f';
      const fillColor = Phaser.Display.Color.HexStringToColor(colorHex).color;

      const box = scene.add
        .rectangle(x, y, boxW, boxH, won || isHighlight ? fillColor : 0x1a2744, won || isHighlight ? 0.55 : 0.9)
        .setDepth(depth + 1)
        .setStrokeStyle(isHighlight ? 3 : 1.5, isHighlight ? 0xf4d03f : 0xc9a227, isHighlight ? 1 : 0.7);
      this.nodes.push(box);

      if (isHighlight) {
        this.nodes.push(
          scene.add
            .text(x + boxW / 2 - 6, y - boxH / 2 + 1, '★', {
              fontFamily: FONT_VI,
              fontSize: '11px',
              color: '#f4d03f',
            })
            .setOrigin(0.5, 0)
            .setDepth(depth + 3),
        );
      }

      this.nodes.push(
        scene.add
          .text(x, y - 14, item.yearRange ?? '', {
            fontFamily: FONT_VI,
            fontSize: '8px',
            fontStyle: 'bold',
            color: '#f4d03f',
            align: 'center',
          })
          .setOrigin(0.5)
          .setDepth(depth + 2),
      );

      this.nodes.push(
        scene.add
          .text(x, y + 2, item.label ?? '', {
            fontFamily: FONT_VI,
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#ffffff',
          })
          .setOrigin(0.5)
          .setDepth(depth + 2),
      );

      this.nodes.push(
        scene.add
          .text(x, y + 16, item.short ?? '', {
            fontFamily: FONT_VI,
            fontSize: '8px',
            color: '#bdc3c7',
            align: 'center',
          })
          .setOrigin(0.5)
          .setDepth(depth + 2),
      );
    }

    if (timeline.tcnHint) {
      this.nodes.push(
        scene.add
          .text(centerX, botY + boxH / 2 + 14, timeline.tcnHint, {
            fontFamily: FONT_VI,
            fontSize: '9px',
            fontStyle: 'italic',
            color: '#7f8c8d',
          })
          .setOrigin(0.5)
          .setDepth(depth + 1),
      );
    }
  }

  destroy() {
    for (const n of this.nodes) n.destroy();
    this.nodes = [];
  }
}
