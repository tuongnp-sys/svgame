/**
 * Điều phối chuyển scene — requestAnimationFrame để thoát ngữ cảnh pointer.
 */

/**
 * @param {Phaser.Scene} fromScene
 * @param {() => void} run
 */
function deferredSceneNavigate(fromScene, run) {
  if (!fromScene?.scene) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(run);
  });
}

/**
 * @param {object} [raw]
 */
export function normalizeChapterOverResult(raw = {}) {
  const chapterId = Number(raw.chapterId) || 1;
  const stars = Math.min(3, Math.max(1, Number(raw.stars) || 1));
  return {
    won: Boolean(raw.won),
    stars,
    chapterId,
    score: Math.max(1, Number(raw.score) || 1),
    artifact: raw.artifact ?? '',
    fact: raw.fact ?? '',
    cliffhanger: raw.cliffhanger ?? '',
    stats: {
      perfect: raw.stats?.perfect ?? 0,
      miss: raw.stats?.miss ?? 0,
      maxCombo: raw.stats?.maxCombo ?? 0,
    },
  };
}

/**
 * @param {Phaser.Scene} fromScene
 * @param {object} data
 */
export function goToChapterOver(fromScene, data) {
  if (!fromScene?.scene) return;
  const payload = normalizeChapterOverResult(data);
  deferredSceneNavigate(fromScene, () => {
    fromScene.scene.start('ChapterOverScene', payload);
  });
}

/**
 * @param {Phaser.Scene} fromScene
 * @param {number} chapterId
 */
export function goToChapter(fromScene, chapterId) {
  const data = { chapterId: Number(chapterId) || 1 };

  deferredSceneNavigate(fromScene, () => {
    if (fromScene.scene?.key === 'ChapterScene') {
      fromScene.scene.restart(data);
    } else {
      fromScene.scene.start('ChapterScene', data);
    }
  });
}

/**
 * @param {Phaser.Scene} fromScene
 */
export function goToHub(fromScene) {
  deferredSceneNavigate(fromScene, () => {
    fromScene.scene.start('HubScene');
  });
}

/**
 * @param {Phaser.Scene} fromScene
 */
export function goToIntro(fromScene) {
  deferredSceneNavigate(fromScene, () => {
    fromScene.scene.start('IntroScene');
  });
}
