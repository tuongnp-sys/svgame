import moments from '../data/content/milestoneMoments.json';

import { getChapterMeta } from '../core/chapterConfig.js';

import { getLang, setLang, pickBilingual, subscribeLangChange } from '../core/locale.js';
import { t } from '../core/i18n.js';

import {
  escHtml,
  createModalShell,
  mountLangTabs,
  bindScrollHint,
  lockPhaserInput,
  unlockPhaserInput,
  deferredAfterPointer,
} from './htmlModalHelper.js';

/**
 * Cột mốc lịch sử — full HTML modal, tab VN/EN.
 */
export class MilestoneMomentOverlayView {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} chapterId
   * @param {() => void} onComplete
   */
  constructor(scene, chapterId, onComplete) {
    this.scene = scene;
    this.onComplete = onComplete;
    this.chapterId = chapterId;
    this._done = false;
    this._destroyed = false;
    this._closing = false;

    lockPhaserInput(scene);

    this.moment = moments[String(chapterId)] ?? moments['1'];
    this.meta = getChapterMeta(chapterId);
    this.lang = getLang();

    const { root, panel } = createModalShell({ variant: 'milestone' });
    this.root = root;

    const ribbon = document.createElement('p');
    ribbon.className = 'html-modal__ribbon';
    ribbon.textContent = t('modal.milestoneRibbon', this.lang);

    this.titleEl = document.createElement('h2');
    this.titleEl.className = 'html-modal__title';

    this.subtitleEl = document.createElement('p');
    this.subtitleEl.className = 'html-modal__subtitle';

    this.tabsEl = document.createElement('div');
    this.tabsEl.className = 'html-modal__tabs';

    this.scrollEl = document.createElement('div');
    this.scrollEl.className = 'html-modal__scroll';

    this.bodyEl = document.createElement('div');
    this.bodyEl.className = 'html-modal__body milestone-body';
    this.scrollEl.appendChild(this.bodyEl);

    this.hintEl = document.createElement('p');
    this.hintEl.className = 'html-modal__hint';

    this.continueBtn = document.createElement('button');
    this.continueBtn.type = 'button';
    this.continueBtn.className = 'html-modal__btn html-modal__btn--primary';
    this.continueBtn.textContent = t('common.continue', this.lang);
    this.continueBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._finish();
    });

    panel.append(
      ribbon,
      this.titleEl,
      this.subtitleEl,
      this.tabsEl,
      this.scrollEl,
      this.hintEl,
      this.continueBtn,
    );

    document.body.appendChild(root);

    this._refreshHint = bindScrollHint(
      this.scrollEl,
      this.hintEl,
      t('modal.scrollHint', this.lang),
      t('modal.scrollIdle', this.lang),
    );

    this._mountTabs();
    this._applyHeader();
    this._rebuildContent();

    this._unsubLang = subscribeLangChange(() => this.refreshLang());
  }

  refreshLang() {
    if (this._destroyed) return;
    this._syncLang(getLang());
  }

  /** @param {import('../core/locale.js').GameLang} lang */
  _syncLang(lang) {
    this.lang = lang;
    this.continueBtn.textContent = t('common.continue', lang);
    this.root.querySelector('.html-modal__ribbon').textContent = t('modal.milestoneRibbon', lang);
    this._mountTabs();
    this._applyHeader();
    this._rebuildContent();
    this._refreshHint = bindScrollHint(
      this.scrollEl,
      this.hintEl,
      t('modal.scrollHint', lang),
      t('modal.scrollIdle', lang),
    );
  }

  _mountTabs() {
    mountLangTabs(this.tabsEl, this.lang, (lang) => setLang(lang));
  }

  _applyHeader() {
    this.titleEl.textContent =
      pickBilingual(this.moment.title, this.lang) || pickBilingual(this.moment.title, 'vi');
    this.subtitleEl.textContent =
      pickBilingual(this.moment.subtitle, this.lang) || pickBilingual(this.meta?.era, this.lang) || '';
  }

  _rebuildContent() {
    const hook = pickBilingual(this.moment.hook, this.lang);
    const takeaway = pickBilingual(this.moment.takeaway, this.lang);
    const beats = this.moment.beats ?? [];

    const parts = [];

    if (hook) {
      parts.push(`<p class="milestone-hook">${escHtml(hook)}</p>`);
    }

    beats.forEach((beat, i) => {
      const label = pickBilingual(beat.label, this.lang);
      const body = pickBilingual(beat.body, this.lang);
      const keyClass = beat.emphasis ? ' milestone-beat--key' : '';
      parts.push(
        `<div class="milestone-beat${keyClass}">` +
          `<p class="milestone-beat__num">${i + 1}</p>` +
          `<div class="milestone-beat__text">` +
          `<p class="milestone-beat__label">${escHtml(label)}</p>` +
          `<p class="milestone-beat__body">${escHtml(body)}</p>` +
          `</div></div>`,
      );
    });

    if (takeaway) {
      parts.push(`<p class="milestone-takeaway">${escHtml(takeaway)}</p>`);
    }

    this.bodyEl.innerHTML = parts.join('\n');
    this.scrollEl.scrollTop = 0;
    requestAnimationFrame(() => this._refreshHint?.());
  }

  _finish() {
    if (this._done || this._closing) return;
    this._done = true;
    this._closing = true;
    deferredAfterPointer(() => {
      this.destroy();
      this.onComplete?.();
    });
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    this._unsubLang?.();
    this.root?.remove();
    unlockPhaserInput(this.scene);
  }
}
