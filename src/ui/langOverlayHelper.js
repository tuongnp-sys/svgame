import { subscribeLangChange } from '../core/locale.js';
import { createLangToggle } from './LangToggle.js';

/**
 * Mount VN/EN toggle + auto-refresh overlay when lang changes.
 * @param {Phaser.Scene} scene
 * @param {{ refreshLang?: () => void, destroy: (...args: unknown[]) => void }} overlay
 * @param {number} [depth]
 */
export function wireOverlayLang(scene, overlay, depth = 62) {
  const langBtn = createLangToggle(scene, depth);
  if (typeof overlay.refreshLang === 'function') {
    const unsub = subscribeLangChange(() => overlay.refreshLang());
    const prevDestroy = overlay.destroy.bind(overlay);
    overlay.destroy = (...args) => {
      unsub();
      langBtn?.destroy();
      prevDestroy(...args);
    };
  } else {
    const prevDestroy = overlay.destroy.bind(overlay);
    overlay.destroy = (...args) => {
      langBtn?.destroy();
      prevDestroy(...args);
    };
  }
}
