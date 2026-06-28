import { subscribeLangChange } from '../core/locale.js';
import { createLangToggle } from './LangToggle.js';

/**
 * Mount VN/EN toggle + auto-refresh overlay when lang changes.
 * @param {Phaser.Scene} scene
 * @param {{ refreshLang?: () => void, destroy: (...args: unknown[]) => void }} overlay
 * @param {number} [depth]
 * @param {() => void} [onClose] — called after overlay teardown (e.g. null scene ref)
 */
export function wireOverlayLang(scene, overlay, depth = 62, onClose) {
  const langBtn = createLangToggle(scene, depth);
  const unsub =
    typeof overlay.refreshLang === 'function'
      ? subscribeLangChange(() => {
          try {
            overlay.refreshLang();
          } catch (err) {
            console.error('[i18n] overlay refreshLang failed', err);
          }
        })
      : null;

  const prevDestroy = overlay.destroy.bind(overlay);
  overlay.destroy = (...args) => {
    if (overlay._langWiredDone) return;
    overlay._langWiredDone = true;
    unsub?.();
    langBtn?.destroy();
    prevDestroy(...args);
    onClose?.();
  };
}
