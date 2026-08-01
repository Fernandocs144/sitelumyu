
import StoryModel from '../story/StoryModel';

/**
 * Converts normalized scroll progress into timeline values.
 * Does not read scroll directly — receives progress from ExperienceEngine.
 */
export class TimelineController {
  constructor() {
    this._globalProgress = 0;
    this._stateProgress = 0;
    this._currentStateId = null;
  }

  get globalProgress() {
    return this._globalProgress;
  }

  get stateProgress() {
    return this._stateProgress;
  }

  get currentStateId() {
    return this._currentStateId;
  }

  update(globalProgress) {
    this._globalProgress = globalProgress;

    const chapter = StoryModel.getChapter(globalProgress);

    this._currentStateId = chapter.id;

    this._stateProgress = StoryModel.getChapterProgress(globalProgress);
}

  dispose() {
    this._globalProgress = 0;
    this._stateProgress = 0;
    this._currentStateId = null;
  }
}
