import { getChapterMeta } from './chapterConfig.js';
import { TimingBarChapterController } from './controllers/TimingBarChapterController.js';
import { RhythmChapterController } from './controllers/RhythmChapterController.js';
import { BinaryChoiceChapterController } from './controllers/BinaryChoiceChapterController.js';
import { SwipeChapterController } from './controllers/SwipeChapterController.js';
import { PathDrawChapterController } from './controllers/PathDrawChapterController.js';
import { RunnerChapterController } from './controllers/RunnerChapterController.js';

/**
 * @param {number} chapterId
 * @param {object} events
 */
export function createChapterController(chapterId, events = {}) {
  const meta = getChapterMeta(chapterId);
  switch (meta?.mechanic) {
    case 'rhythm':
      return new RhythmChapterController(chapterId, events);
    case 'binary_choice':
      return new BinaryChoiceChapterController(chapterId, events);
    case 'rhythm_swipe':
      return new SwipeChapterController(chapterId, events);
    case 'path_draw':
      return new PathDrawChapterController(chapterId, events);
    case 'runner':
      return new RunnerChapterController(chapterId, events);
    case 'timing_bar':
    default:
      return new TimingBarChapterController(chapterId, events);
  }
}

export function getChapterMechanic(chapterId) {
  return getChapterMeta(chapterId)?.mechanic ?? 'timing_bar';
}
