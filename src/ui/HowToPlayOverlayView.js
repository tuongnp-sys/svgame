import { getAllChapters, getChapterTabName, getChapterEra, hasHistorySummary } from '../core/chapterConfig.js';

import { isChapterUnlocked, isChapterPlayable, getRecommendedChapter } from '../core/saveProgress.js';

import { createPillButton, createDualLinePillButton } from './phaserUi.js';

import { ChapterHowToPanel } from './howTo/ChapterHowToPanel.js';

import { ChapterBattleBriefingPanel } from './howTo/ChapterBattleBriefingPanel.js';

import { HistoryScrollOverlayView } from './HistoryScrollOverlayView.js';

import { FONT_VI } from '../core/fonts.js';

import { t } from '../core/i18n.js';

import { wireOverlayLang } from './langOverlayHelper.js';



const TAB_ROW_GAP = 42;

const TAB_COLS = 2;

const TAB_CELL_W = 158;



/**

 * Overlay HOW TO PLAY — CONTROLS | THIS BATTLE tabs.

 */

export class HowToPlayOverlayView {

  /**

   * @param {Phaser.Scene} scene

   * @param {(chapterId: number) => void} onPlayChapter

   * @param {number} [initialChapterId]
   * @param {{ onClose?: () => void }} [options]
   */

  constructor(scene, onPlayChapter, initialChapterId, options = {}) {

    this.scene = scene;

    this.onPlayChapter = onPlayChapter;

    this.nodes = [];

    this.tabBtns = [];

    this.modeTabBtns = [];

    this.selectedId = initialChapterId ?? getRecommendedChapter();

    this.mode = 'battle';



    const w = scene.cameras.main.width;

    const h = scene.cameras.main.height;

    this.depth = 85;



    const tabBandY = h * 0.118;

    const tabBandH = TAB_ROW_GAP * 3 + 8;

    const modeTabsY = tabBandY + tabBandH + 12;

    const MODE_TAB_H = 30;

    this.panelTop = modeTabsY + MODE_TAB_H + 10;

    this.contentOptions = { compactHeader: true };



    const backdrop = scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.88).setDepth(this.depth);

    this.nodes.push(backdrop);



    const panel = scene.add

      .rectangle(w / 2, h * 0.5, w - 20, h - 48, 0x1a2744, 0.98)

      .setDepth(this.depth + 1)

      .setStrokeStyle(2, 0xf4d03f);

    this.nodes.push(panel);



    this._titleText = scene.add

        .text(w / 2, h * 0.06, t('howTo.title'), {

          fontFamily: FONT_VI,

          fontSize: '22px',

          fontStyle: 'bold',

          color: '#f4d03f',

        })

        .setOrigin(0.5)

        .setDepth(this.depth + 2);

    this.nodes.push(this._titleText);



    this._subtitleText = scene.add

        .text(w / 2, h * 0.102, t('howTo.subtitle'), {

          fontFamily: FONT_VI,

          fontSize: '11px',

          color: '#95a5a6',

        })

        .setOrigin(0.5)

        .setDepth(this.depth + 2);

    this.nodes.push(this._subtitleText);



    this.nodes.push(

      scene.add

        .rectangle(w / 2, tabBandY + tabBandH / 2 - 4, w - 36, tabBandH, 0x0d1526, 0.85)

        .setDepth(this.depth + 1)

        .setStrokeStyle(1, 0x4a6fa5, 0.5),

    );



    this._buildChapterTabs(tabBandY);



    this.nodes.push(

      scene.add

        .rectangle(w / 2, modeTabsY + MODE_TAB_H / 2, w - 36, MODE_TAB_H + 4, 0x152035, 0.9)

        .setDepth(this.depth + 1)

        .setStrokeStyle(1, 0x4a6fa5, 0.35),

    );

    this._buildModeTabs(modeTabsY);



    this.contentPanel = null;

    this._historyOverlay = null;

    this._showContent();



    if (hasHistorySummary(this.selectedId)) {

      this.historyBtn = createDualLinePillButton(

        scene,

        w / 2,

        h * 0.848,

        280,

        56,

        t('howTo.historySummary'),

        getChapterEra(this.selectedId),

        () => this._openHistory(),

        true,

      ).setDepth(this.depth + 5);

    } else {

      this.historyBtn = null;

    }



    this.playBtn = createPillButton(

      scene,

      w / 2,

      h * 0.9,

      280,

      48,

      t('common.play'),

      () => {

        if (isChapterUnlocked(this.selectedId) && isChapterPlayable(this.selectedId)) {

          const chapterId = this.selectedId;

          this.destroy();

          this.onPlayChapter(chapterId);

        }

      },

      false,

    ).setDepth(this.depth + 5);

    this._updatePlayBtnLabel();



    this.closeBtn = createPillButton(

      scene,

      w / 2,

      h * 0.955,

      200,

      40,

      t('common.close'),

      () => this.destroy(),

      true,

    ).setDepth(this.depth + 5);

    wireOverlayLang(scene, this, this.depth + 20, options.onClose);

  }



  refreshLang() {

    this._titleText?.setText(t('howTo.title'));

    this._subtitleText?.setText(t('howTo.subtitle'));

    for (const { m, tab } of this.modeTabBtns) {

      m.label = m.id === 'battle' ? t('howTo.tabBattle') : t('howTo.tabControls');

      tab.setText(m.label);

    }

    this._refreshModeTabs();

    this._refreshTabs();

    this._showContent();

    this._updatePlayBtnLabel();

    this.closeBtn?.setLabel(t('common.close'));

    if (this.historyBtn) {

      this.historyBtn.setLines(t('howTo.historySummary'), getChapterEra(this.selectedId));

    }

    this._historyOverlay?.refreshLang?.();

  }



  _buildModeTabs(y) {

    const w = this.scene.cameras.main.width;

    const modes = [

      { id: 'battle', label: t('howTo.tabBattle') },

      { id: 'controls', label: t('howTo.tabControls') },

    ];

    for (let i = 0; i < modes.length; i++) {

      const m = modes[i];

      const x = w / 2 + (i === 0 ? -78 : 78);

      const tab = this.scene.add

        .text(x, y, m.label, {

          fontFamily: FONT_VI,

          fontSize: '13px',

          fontStyle: 'bold',

          color: this.mode === m.id ? '#1a1628' : '#f4d03f',

          backgroundColor: this.mode === m.id ? '#f4d03f' : '#1a2744',

          padding: { x: 12, y: 5 },

        })

        .setOrigin(0.5)

        .setDepth(this.depth + 3)

        .setInteractive({ useHandCursor: true });

      tab.on('pointerup', () => {

        this.mode = m.id;

        this._refreshModeTabs();

        this._showContent();

      });

      this.modeTabBtns.push({ m, tab });

      this.nodes.push(tab);

    }

  }



  _refreshModeTabs() {

    for (const { m, tab } of this.modeTabBtns) {

      const selected = this.mode === m.id;

      tab.setColor(selected ? '#1a1628' : '#f4d03f');

      tab.setBackgroundColor(selected ? '#f4d03f' : '#1a2744');

    }

  }



  _buildChapterTabs(y) {

    const w = this.scene.cameras.main.width;

    const chapters = getAllChapters();

    const recommended = getRecommendedChapter();

    const startX = w / 2;



    for (let i = 0; i < chapters.length; i++) {

      const ch = chapters[i];

      const col = i % TAB_COLS;

      const row = Math.floor(i / TAB_COLS);

      const x = startX + (col === 0 ? -TAB_CELL_W / 2 - 4 : TAB_CELL_W / 2 + 4);

      const tabY = y + row * TAB_ROW_GAP;

      const unlocked = isChapterUnlocked(ch.id);

      const tabName = getChapterTabName(ch.id);

      const label = ch.id === recommended ? `★ ${tabName}` : tabName;



      const tab = this.scene.add

        .text(x, tabY, label, {

          fontFamily: FONT_VI,

          fontSize: '12px',

          fontStyle: 'bold',

          color: ch.id === this.selectedId ? '#1a1628' : unlocked ? '#f4d03f' : '#95a5a6',

          backgroundColor: ch.id === this.selectedId ? '#f4d03f' : '#1a2744',

          padding: { x: 10, y: 5 },

          align: 'center',

          fixedWidth: TAB_CELL_W,

          wordWrap: { width: TAB_CELL_W - 8 },

        })

        .setOrigin(0.5)

        .setDepth(this.depth + 3)

        .setInteractive({ useHandCursor: true });



      tab.on('pointerup', () => this._selectChapter(ch.id));



      this.tabBtns.push({ ch, tab });

      this.nodes.push(tab);

    }

  }



  _openHistory() {

    if (this._historyOverlay) return;

    this._historyOverlay = new HistoryScrollOverlayView(this.scene, this.selectedId, {

      depth: this.depth + 12,

      onClose: () => {

        this._historyOverlay = null;

      },

    });

  }



  _selectChapter(chapterId) {

    this.selectedId = chapterId;

    this._refreshTabs();

    this._showContent();

    this._updatePlayBtnLabel();

    if (this.historyBtn) {

      this.historyBtn.setLines(t('howTo.historySummary'), getChapterEra(chapterId));

    }

  }



  _updatePlayBtnLabel() {

    const unlocked = isChapterUnlocked(this.selectedId);

    const playable = isChapterPlayable(this.selectedId);

    if (!unlocked) {

      this.playBtn.setLabel(t('howTo.locked'));

    } else if (!playable) {

      this.playBtn.setLabel(t('howTo.wip'));

    } else {

      this.playBtn.setLabel(t('common.play'));

    }

  }



  _refreshTabs() {

    const recommended = getRecommendedChapter();

    for (const { ch, tab } of this.tabBtns) {

      const selected = ch.id === this.selectedId;

      const unlocked = isChapterUnlocked(ch.id);

      tab.setColor(selected ? '#1a1628' : unlocked ? '#f4d03f' : '#95a5a6');

      tab.setBackgroundColor(selected ? '#f4d03f' : '#1a2744');

      const tabName = getChapterTabName(ch.id);

      tab.setText(ch.id === recommended ? `★ ${tabName}` : tabName);

    }

  }



  _showContent() {

    this.contentPanel?.destroy();

    this.contentPanel = null;

    if (this.mode === 'battle') {

      this.contentPanel = new ChapterBattleBriefingPanel(

        this.scene,

        this.selectedId,

        this.depth + 2,

        this.panelTop,

        this.contentOptions,

      );

    } else {

      this.contentPanel = new ChapterHowToPanel(

        this.scene,

        this.selectedId,

        this.depth + 2,

        this.panelTop,

        this.contentOptions,

      );

    }

  }



  destroy() {

    if (this._done) return;

    this._done = true;

    this.contentPanel?.destroy();

    this._historyOverlay?.destroy();

    this._historyOverlay = null;

    this.playBtn?.destroy();

    this.closeBtn?.destroy();

    this.historyBtn?.destroy();

    for (const n of this.nodes) n.destroy();

    this.nodes = [];

    this.tabBtns = [];

    this.modeTabBtns = [];

  }

}

