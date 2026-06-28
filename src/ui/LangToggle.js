import { getLang, setLang, subscribeLangChange } from '../core/locale.js';
import { createPillButton } from './phaserUi.js';

/**
 * VN | EN language toggle — top-left (52, 48).
 * Unsubscribes from lang changes on destroy (overlay toggles must not leak listeners).
 * @param {Phaser.Scene} scene
 * @param {number} [depth]
 */
export function createLangToggle(scene, depth = 60) {
  let alive = true;

  const btn = createPillButton(
    scene,
    52,
    48,
    72,
    34,
    getLang() === 'en' ? 'EN' : 'VN',
    () => setLang(getLang() === 'en' ? 'vi' : 'en'),
    true,
  );
  btn.setDepth(depth);

  const syncLabel = () => {
    if (!alive) return;
    btn.setLabel(getLang() === 'en' ? 'EN' : 'VN');
  };

  const unsub = subscribeLangChange(syncLabel);

  const teardown = () => {
    if (!alive) return;
    alive = false;
    unsub();
  };

  scene.events.once('shutdown', teardown);

  const baseDestroy = btn.destroy.bind(btn);
  return {
    ...btn,
    destroy() {
      teardown();
      baseDestroy();
    },
  };
}
