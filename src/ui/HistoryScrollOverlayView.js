import { getHistorySummary } from '../core/chapterConfig.js';

import { getLang, setLang, pickBilingual, subscribeLangChange } from '../core/locale.js';
import { t } from '../core/i18n.js';

import {
  escHtml,
  createModalShell,
  mountLangTabs,
  bindScrollHint,
} from './htmlModalHelper.js';

/**
 * Lịch sử tóm tắt — full HTML modal, VN hoặc EN.
 */
export class HistoryScrollOverlayView {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} chapterId
   * @param {{ depth?: number, onClose?: () => void }} [options]
   */
  constructor(scene, chapterId, options = {}) {
    this.scene = scene;
    this.chapterId = chapterId;
    this.onClose = options.onClose;
    this._destroyed = false;

    this.lang = getLang();
    this.summary = getHistorySummary(chapterId);

    const { root, panel } = createModalShell({
      variant: 'history',
      onBackdropClick: () => this._close(),
    });
    this.root = root;

    this.titleEl = document.createElement('h2');
    this.titleEl.className = 'html-modal__title';

    this.subtitleEl = document.createElement('p');
    this.subtitleEl.className = 'html-modal__subtitle';

    this.tabsEl = document.createElement('div');
    this.tabsEl.className = 'html-modal__tabs';

    this.scrollEl = document.createElement('div');
    this.scrollEl.className = 'html-modal__scroll';

    this.bodyEl = document.createElement('div');
    this.bodyEl.className = 'html-modal__body history-body';
    this.scrollEl.appendChild(this.bodyEl);

    this.hintEl = document.createElement('p');
    this.hintEl.className = 'html-modal__hint';

    this.closeBtn = document.createElement('button');
    this.closeBtn.type = 'button';
    this.closeBtn.className = 'html-modal__btn html-modal__btn--secondary';
    this.closeBtn.textContent = t('common.close', this.lang);
    this.closeBtn.addEventListener('click', () => this._close());

    panel.append(
      this.titleEl,
      this.subtitleEl,
      this.tabsEl,
      this.scrollEl,
      this.hintEl,
      this.closeBtn,
    );

    document.body.appendChild(root);

    this._refreshHint = bindScrollHint(
      this.scrollEl,
      this.hintEl,
      t('modal.historyScrollHint', this.lang),
      '',
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
    this.closeBtn.textContent = t('common.close', lang);
    this._mountTabs();
    this._applyHeader();
    this._rebuildContent();
    this._refreshHint = bindScrollHint(
      this.scrollEl,
      this.hintEl,
      t('modal.historyScrollHint', lang),
      '',
    );
  }

  _mountTabs() {
    mountLangTabs(this.tabsEl, this.lang, (lang) => setLang(lang));
  }

  _applyHeader() {
    const s = this.summary;
    if (!s) {
      this.titleEl.textContent = t('common.noContent', this.lang);
      this.subtitleEl.textContent = '';
      return;
    }
    this.titleEl.textContent = pickBilingual(s.title ?? {}, this.lang);
    this.subtitleEl.textContent = pickBilingual(s.subtitle ?? {}, this.lang);
  }

  _rebuildContent() {
    const parts = [];

    for (const section of this.summary?.sections ?? []) {
      const heading = pickBilingual(section.heading ?? {}, this.lang);
      if (heading) {
        parts.push(`<h3 class="history-scroll__heading">${escHtml(heading)}</h3>`);
      }
      for (const para of section.paragraphs ?? []) {
        const text = pickBilingual(para, this.lang);
        if (text) {
          parts.push(`<p class="history-scroll__para">${escHtml(text)}</p>`);
        }
      }
    }

    const sources = this.summary?.sources;
    if (sources) {
      const srcLabel = t('common.sources', this.lang);
      parts.push(`<h3 class="history-scroll__sources-label">${escHtml(srcLabel)}</h3>`);
      parts.push(
        `<p class="history-scroll__sources">${escHtml(pickBilingual(sources, this.lang))}</p>`,
      );
    }

    this.bodyEl.innerHTML = parts.join('\n');
    this.scrollEl.scrollTop = 0;
    requestAnimationFrame(() => this._refreshHint?.());
  }

  _close() {
    if (this._destroyed) return;
    this.destroy();
    this.onClose?.();
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    this._unsubLang?.();
    this.root?.remove();
  }
}

/** @param {Phaser.Scene} scene @param {number} chapterId @param {number} [_depth] */
export function openHistoryScrollOverlay(scene, chapterId, _depth = 100) {
  return new HistoryScrollOverlayView(scene, chapterId);
}
