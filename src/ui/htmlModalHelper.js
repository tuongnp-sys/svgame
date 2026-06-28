/**
 * Full-screen HTML modal — không map tọa độ Phaser.
 */

/** @type {WeakMap<Phaser.Scene, boolean>} */
const savedPhaserInput = new WeakMap();
let phaserInputLockCount = 0;

/**
 * Block Phaser pointer input while an HTML modal is open (ref-counted).
 * @param {Phaser.Scene} scene
 */
export function lockPhaserInput(scene) {
  if (!scene?.input) return;
  if (phaserInputLockCount === 0) {
    savedPhaserInput.set(scene, scene.input.enabled);
    scene.input.enabled = false;
  }
  phaserInputLockCount++;
}

/**
 * Restore Phaser input after the last HTML modal closes.
 * @param {Phaser.Scene} scene
 */
export function unlockPhaserInput(scene) {
  if (!scene?.input || phaserInputLockCount <= 0) return;
  phaserInputLockCount--;
  if (phaserInputLockCount === 0) {
    const prev = savedPhaserInput.get(scene);
    scene.input.enabled = prev !== undefined ? prev : true;
    savedPhaserInput.delete(scene);
  }
}

/**
 * Run after the current pointer gesture finishes — avoids click-through to Phaser.
 * @param {() => void} fn
 */
export function deferredAfterPointer(fn) {
  requestAnimationFrame(() => {
    requestAnimationFrame(fn);
  });
}

/** @param {string} str */
export function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {object} opts
 * @param {'milestone' | 'history'} opts.variant
 * @param {() => void} [opts.onBackdropClick]
 */
export function createModalShell(opts) {
  const root = document.createElement('div');
  root.className = `html-modal html-modal--${opts.variant}`;

  const backdrop = document.createElement('div');
  backdrop.className = 'html-modal__backdrop';
  if (opts.onBackdropClick) {
    backdrop.addEventListener('click', opts.onBackdropClick);
  }

  const panel = document.createElement('div');
  panel.className = 'html-modal__panel';
  panel.addEventListener('click', (e) => e.stopPropagation());

  root.appendChild(backdrop);
  root.appendChild(panel);

  return { root, panel };
}

/**
 * @param {HTMLElement} container
 * @param {'vi' | 'en'} active
 * @param {(lang: 'vi' | 'en') => void} onChange
 */
export function mountLangTabs(container, active, onChange) {
  container.innerHTML = '';
  for (const m of [
    { id: 'vi', label: 'VN' },
    { id: 'en', label: 'EN' },
  ]) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `html-modal__tab${active === m.id ? ' html-modal__tab--on' : ''}`;
    btn.textContent = m.label;
    btn.addEventListener('click', () => {
      if (active === m.id) return;
      onChange(/** @type {'vi' | 'en'} */ (m.id));
    });
    container.appendChild(btn);
  }
}

/**
 * @param {HTMLElement} scrollEl
 * @param {boolean} scrollable
 * @param {string} scrollHint
 * @param {string} idleHint
 */
export function updateScrollHint(scrollEl, hintEl, scrollable, scrollHint, idleHint) {
  if (hintEl) {
    hintEl.textContent = scrollable ? scrollHint : idleHint;
  }
}

/**
 * @param {HTMLElement} scrollEl
 * @param {HTMLElement} hintEl
 * @param {string} scrollHint
 * @param {string} idleHint
 */
export function bindScrollHint(scrollEl, hintEl, scrollHint, idleHint) {
  const refresh = () => {
    const scrollable = scrollEl.scrollHeight > scrollEl.clientHeight + 4;
    updateScrollHint(scrollEl, hintEl, scrollable, scrollHint, idleHint);
  };
  refresh();
  scrollEl.addEventListener('scroll', refresh);
  return refresh;
}
