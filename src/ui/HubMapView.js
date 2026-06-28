import { getAllChapters, getChapterBattleName, getChapterEra, getChapterTabName } from '../core/chapterConfig.js';
import { isChapterUnlocked, isChapterPlayable, loadProgress } from '../core/saveProgress.js';
import { FONT_VI } from '../core/fonts.js';
import { t } from '../core/i18n.js';
import { getLang, pickBilingual } from '../core/locale.js';

/**
 * Interactive fog map with time-rift pins.
 */
export class HubMapView {
  /**
   * @param {Phaser.Scene} scene
   * @param {(chapterId: number) => void} onSelectChapter
   * @param {number} [recommendedId]
   */
  constructor(scene, onSelectChapter, recommendedId = 2) {
    this.scene = scene;
    this.onSelectChapter = onSelectChapter;
    this.recommendedId = recommendedId;
    const w = scene.cameras.main.width;
    const h = scene.cameras.main.height;
    this.w = w;
    this.h = h;

    this.container = scene.add.container(w / 2, h * 0.42).setDepth(5);

    this.mapImg = scene.add.image(0, 0, 'game_assets', 'fog_map').setScale(1.05);
    this.container.add(this.mapImg);

    this.regionGfx = scene.add.graphics();
    this.container.add(this.regionGfx);

    this.fogPatches = scene.add.group();
    this.pins = [];

    const chapters = getAllChapters();
    for (const ch of chapters) {
      const px = (ch.hubPin?.x ?? 0.5) * 280 - 140;
      const py = (ch.hubPin?.y ?? 0.5) * 340 - 170;

      const fog = scene.add.circle(px, py, 36, 0x2d3436, 0.55);
      fog.setStrokeStyle(2, 0x636e72, 0.4);
      this.fogPatches.add(fog);
      this.container.add(fog);

      const glow = scene.add.circle(px, py, 22, 0x9b59b6, 0);
      glow.setStrokeStyle(3, 0xc39bd3, 0);

      const label = scene.add
        .text(px, py + 26, String(ch.id), {
          fontFamily: FONT_VI,
          fontSize: '9px',
          fontStyle: 'bold',
          color: '#dfe6e9',
          align: 'center',
          wordWrap: { width: 72 },
        })
        .setOrigin(0.5);

      const eraLabel = scene.add
        .text(px, py + 42, '', {
          fontFamily: FONT_VI,
          fontSize: '8px',
          color: '#95a5a6',
          align: 'center',
          wordWrap: { width: 72 },
        })
        .setOrigin(0.5);

      const hit = scene.add.circle(px, py, 38, 0xffffff, 0.001);
      hit.setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => this._onPinTap(ch.id));

      this.container.add([glow, label, eraLabel, hit]);
      this.pins.push({ ch, px, py, fog, glow, label, eraLabel, hit, pulseTween: null });
    }

    this.cliffText = scene.add
      .text(w / 2, h * 0.78, '', {
        fontFamily: FONT_VI,
        fontSize: '12px',
        color: '#f4d03f',
        align: 'center',
        wordWrap: { width: w - 48 },
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.refresh();
  }

  _onPinTap(chapterId) {
    if (!isChapterUnlocked(chapterId)) {
      this.scene.cameras.main.shake(100, 0.003);
      return;
    }
    if (!isChapterPlayable(chapterId)) {
      this.cliffText.setText(t('hub.chapterWip'));
      return;
    }
    this.onSelectChapter(chapterId);
  }

  refresh() {
    const progress = loadProgress();
    const completed = progress.completed ?? {};

    this.regionGfx.clear();
    for (const pin of this.pins) {
      const { ch, px, py, fog, glow, label, eraLabel, hit } = pin;
      const unlocked = isChapterUnlocked(ch.id);
      const playable = isChapterPlayable(ch.id);
      const done = completed[String(ch.id)]?.won;

      if (done) {
        const color = Phaser.Display.Color.HexStringToColor(ch.mapColor ?? '#f4d03f').color;
        this.regionGfx.fillStyle(color, 0.35);
        this.regionGfx.fillCircle(px, py, 40);
        fog.setAlpha(0);
      } else if (unlocked) {
        fog.setAlpha(0.35);
      } else {
        fog.setAlpha(0.65);
      }

      glow.setStrokeStyle(3, unlocked ? 0xc39bd3 : 0x636e72, unlocked ? 0.9 : 0.3);

      if (unlocked && !done && !pin.pulseTween) {
        pin.pulseTween = this.scene.tweens.add({
          targets: glow,
          alpha: { from: 0.4, to: 1 },
          duration: 900,
          yoyo: true,
          repeat: -1,
        });
      }
      if (!unlocked || done) {
        pin.pulseTween?.stop();
        pin.pulseTween = null;
      }

      label.setColor(unlocked ? '#f4d03f' : '#636e72');
      hit.setAlpha(unlocked ? 1 : 0.3);

      const shortBattle = getChapterTabName(ch.id);
      if (!unlocked) {
        label.setText(String(ch.id));
        eraLabel.setVisible(false);
      } else if (!playable) {
        label.setText(`${shortBattle}?`);
        eraLabel.setText(getChapterEra(ch.id));
        eraLabel.setVisible(true);
      } else if (ch.id === this.recommendedId && !done) {
        label.setText(`★ ${shortBattle}`);
        eraLabel.setText(getChapterEra(ch.id));
        eraLabel.setVisible(true);
      } else {
        label.setText(shortBattle);
        eraLabel.setText(getChapterEra(ch.id));
        eraLabel.setVisible(true);
      }
      eraLabel.setColor(unlocked ? '#95a5a6' : '#636e72');
    }

    const cliffId = progress.cliffhangerChapterId;
    if (cliffId) {
      const ch = getAllChapters().find((c) => c.id === cliffId);
      this.cliffText.setText(pickBilingual(ch?.cliffhanger, getLang()) ?? '');
    } else if (this.recommendedId === 1) {
      this.cliffText.setText(t('hub.cliffNewPlayer'));
    } else if (this.recommendedId === 2) {
      this.cliffText.setText(t('hub.cliffBachDang'));
    } else {
      this.cliffText.setText(t('hub.cliffDefault'));
    }
  }

  destroy() {
    this.container.destroy();
    this.cliffText.destroy();
  }
}
