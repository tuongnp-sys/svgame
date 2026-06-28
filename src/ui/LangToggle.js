import { getLang, setLang, subscribeLangChange } from '../core/locale.js';
import { createPillButton } from './phaserUi.js';

/**
 * VN | EN language toggle — top-left (52, 48).
 * @param {Phaser.Scene} scene
 * @param {number} [depth]
 */
export function createLangToggle(scene, depth = 60) {
  const syncLabel = () => {
    btn.setLabel(getLang() === 'en' ? 'EN' : 'VN');
  };

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

  const unsub = subscribeLangChange(syncLabel);
  scene.events.once('shutdown', unsub);

  return btn;
}
