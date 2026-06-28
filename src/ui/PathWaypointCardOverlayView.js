import { createPillButton } from './phaserUi.js';
import { FONT_VI } from '../core/fonts.js';
import { wireOverlayLang } from './langOverlayHelper.js';
import { localizeWaypoint, t, tFmt } from '../core/i18n.js';

/**
 * Thẻ tóm tắt giai đoạn lịch sử — hiện khi chạm mốc trên bản đồ Ch.5.
 */
export class PathWaypointCardOverlayView {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} waypoint
   * @param {number} step — 1-based
   * @param {number} total
   * @param {() => void} onDismiss
   */
  constructor(scene, waypoint, step, total, onDismiss) {
    this.rawWaypoint = waypoint;
    this.step = step;
    this.total = total;
    this.scene = scene;
    this.onDismiss = onDismiss;
    this.nodes = [];
    this.buttons = [];
    this._done = false;
    this.depth = 88;

    const w = scene.cameras.main.width;
    const h = scene.cameras.main.height;
    const d = this.depth;
    const panelH = 300;
    const panelY = h * 0.44;

    this.nodes.push(scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.72).setDepth(d));

    this.nodes.push(
      scene.add
        .rectangle(w / 2, panelY, w - 32, panelH, 0x1a2744, 0.98)
        .setDepth(d + 1)
        .setStrokeStyle(2, 0xf4d03f),
    );

    this.stageText = scene.add
      .text(w / 2, panelY - panelH / 2 + 22, '', {
        fontFamily: FONT_VI,
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#95a5a6',
      })
      .setOrigin(0.5)
      .setDepth(d + 2);
    this.nodes.push(this.stageText);

    this.eraText = scene.add
      .text(w / 2, panelY - panelH / 2 + 48, '', {
        fontFamily: FONT_VI,
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#f4d03f',
      })
      .setOrigin(0.5)
      .setDepth(d + 2);
    this.nodes.push(this.eraText);

    this.titleText = scene.add
      .text(w / 2, panelY - panelH / 2 + 74, '', {
        fontFamily: FONT_VI,
        fontSize: '17px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: w - 64 },
      })
      .setOrigin(0.5, 0)
      .setDepth(d + 2);
    this.nodes.push(this.titleText);

    this.summaryText = scene.add
      .text(w / 2, panelY - panelH / 2 + 118, '', {
        fontFamily: FONT_VI,
        fontSize: '14px',
        color: '#dfe6e9',
        align: 'center',
        wordWrap: { width: w - 64 },
        lineSpacing: 4,
      })
      .setOrigin(0.5, 0)
      .setDepth(d + 2);
    this.nodes.push(this.summaryText);

    this.footerText = scene.add
      .text(w / 2, panelY + panelH / 2 - 72, '', {
        fontFamily: FONT_VI,
        fontSize: '11px',
        color: '#95a5a6',
      })
      .setOrigin(0.5)
      .setDepth(d + 2);
    this.nodes.push(this.footerText);

    this.continueBtn = createPillButton(scene, w / 2, panelY + panelH / 2 - 28, 220, 44, t('common.continue'), () =>
      this.destroy(),
    ).setDepth(d + 5);
    this.buttons.push(this.continueBtn);

    this._applyTexts();
    wireOverlayLang(scene, this, d + 20);
  }

  _applyTexts() {
    const waypoint = localizeWaypoint(this.rawWaypoint);
    this.stageText?.setText(tFmt('pathWaypoint.stage', { step: this.step, total: this.total }));
    this.eraText?.setText(waypoint.era ?? '');
    this.titleText?.setText(`${waypoint.label} — ${waypoint.title ?? ''}`);
    this.summaryText?.setText(waypoint.summary ?? '');
    if (this.step < this.total) {
      this.footerText?.setText(t('pathWaypoint.nextPoint')).setColor('#95a5a6');
    } else {
      this.footerText?.setText(t('pathWaypoint.holdFlag')).setColor('#f4d03f');
    }
    this.continueBtn?.setLabel(t('common.continue'));
  }

  refreshLang() {
    this._applyTexts();
  }

  destroy() {
    if (this._done) return;
    this._done = true;
    for (const btn of this.buttons) btn.destroy();
    for (const n of this.nodes) n.destroy();
    this.onDismiss?.();
  }
}
