import { bgmController } from '../audio/BgmController.js';
import { createPillButton } from './phaserUi.js';

/**
 * @param {Phaser.Scene} scene
 * @param {number} [depth]
 */
export function createMuteToggle(scene, depth = 60) {
  const w = scene.cameras.main.width;
  const label = bgmController.isMuted() ? '🔇' : '🔊';

  const btn = createPillButton(
    scene,
    w - 52,
    48,
    72,
    34,
    label,
    () => {
      const muted = bgmController.toggleMuted();
      btn.setLabel(muted ? '🔇' : '🔊');
    },
    true,
  );
  btn.setDepth(depth);
  return btn;
}
