import { ScrollController } from '../controllers/ScrollController';
import { TimelineController } from '../controllers/TimelineController';
import { StateMachine } from '../controllers/StateMachine';
import { ResourceManager } from './ResourceManager';
import { SceneManager } from './SceneManager';
import { logExperienceStateChange, resetExperienceDebug } from '../utils/debug';

/**
 * Central coordinator for the Lumyo Experience Engine.
 * Orchestrates controllers and systems without owning render logic.
 *
 * Event flow (05_TECHNICAL_ARCHITECTURE.md):
 * ScrollController → TimelineController → StateMachine → Systems
 */
export class ExperienceEngine {
  constructor() {
    this.scrollController = new ScrollController();
    this.timelineController = new TimelineController();
    this.stateMachine = new StateMachine();
    this.resourceManager = new ResourceManager();
    this.sceneManager = new SceneManager();
    this._initialized = false;
  }

  get isInitialized() {
    return this._initialized;
  }

  init() {
    if (this._initialized) return;

    this.scrollController.init(() => {
      this.update();
    });

    this._initialized = true;
    this.update();
  }

  update() {
    if (!this._initialized) return;

    const scrollProgress = this.scrollController.progress;
    this.timelineController.update(scrollProgress);
    this.stateMachine.update(this.timelineController);
    logExperienceStateChange(this);
  }

  dispose() {
    this.scrollController.dispose();
    this.timelineController.dispose();
    this.stateMachine.dispose();
    this.resourceManager.dispose();
    this.sceneManager.dispose();
    resetExperienceDebug();
    this._initialized = false;
  }
}
