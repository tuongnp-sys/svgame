import Phaser from 'phaser';
import { FONT_VI } from '../core/fonts.js';

/**
 * @param {string} hex
 */
export function hexToNum(hex) {
  return parseInt(hex.replace('#', ''), 16);
}

/**
 * Touch-friendly pill button — hit rect riêng, pointerup, vùng bấm rộng hơn.
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {string} label
 * @param {() => void} onClick
 * @param {boolean} [secondary]
 */
export function createPillButton(scene, x, y, width, height, label, onClick, secondary = false) {
  const depth = 50;
  const hitPadX = 12;
  const hitPadY = 16;
  const hitW = width + hitPadX * 2;
  const hitH = height + hitPadY * 2;

  const shadow = scene.add.rectangle(x, y + 4, width, height, secondary ? 0x636e72 : 0x1a2744).setDepth(depth);
  const topColor = secondary ? 0xdfe6e9 : 0xf4d03f;
  const botColor = secondary ? 0xb2bec3 : 0xc9a227;
  const face = scene.add.graphics().setDepth(depth + 1);
  face.fillGradientStyle(topColor, topColor, botColor, botColor, 1);
  face.fillRoundedRect(x - width / 2, y - height / 2, width, height, height / 2);

  const text = scene.add
    .text(x, y, label, {
      fontFamily: FONT_VI,
      fontSize: secondary ? '14px' : '17px',
      fontStyle: 'bold',
      color: secondary ? '#2d3436' : '#1a1628',
    })
    .setOrigin(0.5)
    .setDepth(depth + 2);

  const hit = scene.add
    .rectangle(x, y, hitW, hitH, 0xffffff, 0.001)
    .setInteractive({ useHandCursor: true })
    .setDepth(depth + 3);

  let clickLocked = false;
  let pressed = false;
  const pressY = y;
  const fire = () => {
    if (clickLocked) return;
    clickLocked = true;
    scene.time.delayedCall(350, () => {
      clickLocked = false;
    });
    onClick();
  };

  const press = () => {
    shadow.y = pressY + 4 + 2;
    face.y = 2;
    text.y = pressY + 2;
  };
  const release = () => {
    shadow.y = pressY + 4;
    face.y = 0;
    text.y = pressY;
  };

  hit.on('pointerdown', () => {
    pressed = true;
    press();
  });
  hit.on('pointerup', () => {
    const shouldFire = pressed;
    pressed = false;
    release();
    if (shouldFire) fire();
  });
  hit.on('pointerout', () => {
    pressed = false;
    release();
  });
  hit.on('pointerupoutside', () => {
    pressed = false;
    release();
  });

  return {
    setDepth(d) {
      shadow.setDepth(d);
      face.setDepth(d + 1);
      text.setDepth(d + 2);
      hit.setDepth(d + 3);
      return this;
    },
    setLabel(str) {
      if (!text?.active) return this;
      text.setText(str);
      return this;
    },
    destroy() {
      shadow.destroy();
      face.destroy();
      text.destroy();
      hit.destroy();
    },
  };
}

/**
 * Nút 2 dòng — dòng 1 in đậm, dòng 2 in nghiêng màu xanh đậm.
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {string} line1
 * @param {string} line2
 * @param {() => void} onClick
 * @param {boolean} [secondary]
 */
export function createDualLinePillButton(
  scene,
  x,
  y,
  width,
  height,
  line1,
  line2,
  onClick,
  secondary = false,
) {
  const depth = 50;
  const hitPadX = 12;
  const hitPadY = 16;
  const hitW = width + hitPadX * 2;
  const hitH = height + hitPadY * 2;

  const shadow = scene.add.rectangle(x, y + 4, width, height, secondary ? 0x636e72 : 0x1a2744).setDepth(depth);
  const topColor = secondary ? 0xdfe6e9 : 0xf4d03f;
  const botColor = secondary ? 0xb2bec3 : 0xc9a227;
  const face = scene.add.graphics().setDepth(depth + 1);
  face.fillGradientStyle(topColor, topColor, botColor, botColor, 1);
  face.fillRoundedRect(x - width / 2, y - height / 2, width, height, height / 2);

  const line1Color = secondary ? '#2d3436' : '#1a1628';
  const text1 = scene.add
    .text(x, y - 8, line1, {
      fontFamily: FONT_VI,
      fontSize: '13px',
      fontStyle: 'bold',
      color: line1Color,
      align: 'center',
    })
    .setOrigin(0.5)
    .setDepth(depth + 2);

  const text2 = scene.add
    .text(x, y + 10, line2, {
      fontFamily: FONT_VI,
      fontSize: '12px',
      fontStyle: 'italic',
      color: '#1a5276',
      align: 'center',
    })
    .setOrigin(0.5)
    .setDepth(depth + 2);

  const hit = scene.add
    .rectangle(x, y, hitW, hitH, 0xffffff, 0.001)
    .setInteractive({ useHandCursor: true })
    .setDepth(depth + 3);

  let clickLocked = false;
  let pressed = false;
  const pressY = y;
  const fire = () => {
    if (clickLocked) return;
    clickLocked = true;
    scene.time.delayedCall(350, () => {
      clickLocked = false;
    });
    onClick();
  };

  const press = () => {
    shadow.y = pressY + 4 + 2;
    face.y = 2;
    text1.y = pressY - 6;
    text2.y = pressY + 12;
  };
  const release = () => {
    shadow.y = pressY + 4;
    face.y = 0;
    text1.y = pressY - 8;
    text2.y = pressY + 10;
  };

  hit.on('pointerdown', () => {
    pressed = true;
    press();
  });
  hit.on('pointerup', () => {
    const shouldFire = pressed;
    pressed = false;
    release();
    if (shouldFire) fire();
  });
  hit.on('pointerout', () => {
    pressed = false;
    release();
  });
  hit.on('pointerupoutside', () => {
    pressed = false;
    release();
  });

  return {
    setDepth(d) {
      shadow.setDepth(d);
      face.setDepth(d + 1);
      text1.setDepth(d + 2);
      text2.setDepth(d + 2);
      hit.setDepth(d + 3);
      return this;
    },
    setLines(l1, l2) {
      text1.setText(l1);
      text2.setText(l2);
      return this;
    },
    destroy() {
      shadow.destroy();
      face.destroy();
      text1.destroy();
      text2.destroy();
      hit.destroy();
    },
  };
}

/**
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {string} line1
 * @param {string} line2
 */
export function createTitle(scene, x, y, line1, line2) {
  const g = scene.add.graphics();
  g.fillStyle(0x0a1628, 0.55);
  g.fillRoundedRect(x - 170, y - 28, 340, 72, 12);

  scene.add
    .text(x, y - 8, line1, {
      fontFamily: FONT_VI,
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#f4d03f',
    })
    .setOrigin(0.5);

  scene.add
    .text(x, y + 18, line2, {
      fontFamily: FONT_VI,
      fontSize: '12px',
      color: '#dfe6e9',
    })
    .setOrigin(0.5);
}
