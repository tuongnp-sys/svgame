import Phaser from 'phaser';
import { bgmController } from './audio/BgmController.js';
import { setGamePhase } from './gameSession.js';
import { createPillButton } from './ui/phaserUi.js';
import { HubMapView } from './ui/HubMapView.js';
import { createMuteToggle } from './ui/MuteToggle.js';
import { createLangToggle } from './ui/LangToggle.js';
import { LeaderboardOverlayView } from './ui/LeaderboardOverlayView.js';
import { HowToPlayOverlayView } from './ui/HowToPlayOverlayView.js';
import { isChapterPlayable, getRecommendedChapter } from './core/saveProgress.js';
import { getChapterMeta } from './core/chapterConfig.js';
import { goToChapter } from './core/sceneTransition.js';
import { FONT_VI } from './core/fonts.js';
import { t, tFmt } from './core/i18n.js';
import { subscribeLangChange, pickBilingual, getLang } from './core/locale.js';

export class HubScene extends Phaser.Scene {
  constructor() {
    super('HubScene');
  }

  create() {
    setGamePhase('MENU');
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.howTo = null;
    this.leaderboard = null;

    this.add.rectangle(w / 2, h / 2, w, h, 0x0a1628);
    const titleBg = this.add.graphics();
    titleBg.fillStyle(0x0a1628, 0.55);
    titleBg.fillRoundedRect(w / 2 - 170, h * 0.07 - 28, 340, 72, 12);
    this.titleLine1 = this.add
      .text(w / 2, h * 0.07 - 8, t('hub.title'), {
        fontFamily: FONT_VI,
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#f4d03f',
      })
      .setOrigin(0.5);
    this.titleLine2 = this.add
      .text(w / 2, h * 0.07 + 18, t('hub.subtitle'), {
        fontFamily: FONT_VI,
        fontSize: '12px',
        color: '#dfe6e9',
      })
      .setOrigin(0.5);

    const recommended = getRecommendedChapter();
    const recMeta = getChapterMeta(recommended);

    this.newPlayerHint = this.add
      .text(w / 2, h * 0.13, t('hub.newPlayerHint'), {
        fontFamily: FONT_VI,
        fontSize: '12px',
        color: '#95a5a6',
        align: 'center',
        lineSpacing: 4,
      })
      .setOrigin(0.5);

    this.hubMap = new HubMapView(this, (chapterId) => this._startChapter(chapterId), recommended);

    createMuteToggle(this, 30);
    createLangToggle(this, 30);
    const unsubLang = subscribeLangChange(() => {
      try {
        this._refreshLang();
      } catch (err) {
        console.error('[i18n] Hub refresh failed', err);
      }
    });
    this.events.once('shutdown', unsubLang);

    this.howToBtn = createPillButton(
      this,
      w / 2,
      h * 0.185,
      200,
      36,
      t('hub.howToPlay'),
      () => this._openHowTo(recommended),
      true,
    ).setDepth(25);

    this.startBtn = createPillButton(
      this,
      w / 2,
      h * 0.84,
      300,
      52,
      this._startLabel(recommended),
      () => this._startChapter(recommended),
    ).setDepth(25);

    this.hookText = this.add
      .text(w / 2, h * 0.9, pickBilingual(recMeta?.hook, getLang()) ?? '', {
        fontFamily: FONT_VI,
        fontSize: '11px',
        color: '#636e72',
        align: 'center',
        wordWrap: { width: w - 48 },
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.lbBtn = this.add
      .text(w / 2, h * 0.945, t('hub.leaderboard'), {
        fontFamily: FONT_VI,
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#58d68d',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(20);

    this.lbBtn.on('pointerup', () => this._openLeaderboard());

    bgmController.play(this, 'menu');

    this.events.once('shutdown', () => {
      this.hubMap?.destroy();
      this.leaderboard?.destroy();
      this.howTo?.destroy();
      this.leaderboard = null;
      this.howTo = null;
    });
  }

  _openHowTo(recommended) {
    this.howTo?.destroy();
    this.howTo = null;
    this.howTo = new HowToPlayOverlayView(
      this,
      (id) => {
        this.howTo = null;
        this._startChapter(id);
      },
      recommended,
      { onClose: () => { this.howTo = null; } },
    );
  }

  _openLeaderboard() {
    this.leaderboard?.destroy();
    this.leaderboard = null;
    this.leaderboard = new LeaderboardOverlayView(this, {
      onClose: () => { this.leaderboard = null; },
    });
  }

  _startLabel(recommended) {
    if (recommended === 1) return t('hub.startDongSon');
    if (recommended === 2) return t('hub.startBachDang');
    return tFmt('hub.continueChapter', { id: recommended });
  }

  _refreshLang() {
    this.titleLine1?.setText(t('hub.title'));
    this.titleLine2?.setText(t('hub.subtitle'));
    this.newPlayerHint?.setText(t('hub.newPlayerHint'));
    this.howToBtn?.setLabel(t('hub.howToPlay'));
    this.startBtn?.setLabel(this._startLabel(getRecommendedChapter()));
    const recMeta = getChapterMeta(getRecommendedChapter());
    this.hookText?.setText(pickBilingual(recMeta?.hook, getLang()) ?? '');
    this.lbBtn?.setText(t('hub.leaderboard'));
    this.hubMap?.refresh();
  }

  async _startChapter(chapterId) {
    if (!isChapterPlayable(chapterId)) return;
    this.howTo?.destroy();
    this.howTo = null;
    this.leaderboard?.destroy();
    this.leaderboard = null;
    if (this.sound.context?.state === 'suspended') {
      await this.sound.context.resume();
    }
    bgmController.play(this, 'chapter');
    goToChapter(this, chapterId);
  }
}
