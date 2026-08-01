import { ScrollController } from '../controllers/ScrollController';
import { TimelineController } from '../controllers/TimelineController';
import { StateMachine } from '../controllers/StateMachine';
import { ResourceManager } from './ResourceManager';
import { SceneManager } from './SceneManager';
import { AssetManager } from './AssetManager';
import { logExperienceStateChange, resetExperienceDebug } from '../utils/debug';
import ExperienceState from './ExperienceState';
import { RobotSystem } from '../systems/RobotSystem';

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
    this.assetManager = new AssetManager();
    this.state = ExperienceState;
    this.robotSystem = null;
    this._initialized = false;
  }

  get isInitialized() {
    return this._initialized;
  }

  createRobotSystem() {
    if (this.robotSystem) return this.robotSystem;

    this.robotSystem = new RobotSystem(this);

    return this.robotSystem;
  }

  async init() {
    if (this._initialized) return;

    
    this.scrollController.init(() => {
      this.update();
    });

    this._initialized = true;
    this.update();
  }

  update() {
    if (!this._initialized) return;

    const progress = this.scrollController.progress;

    this.timelineController.update(progress);

    this.state.update({
      progress,
      chapter: this.timelineController.currentStateId,
      chapterProgress: this.timelineController.stateProgress
    });

    if (this.robotSystem) {
      this.robotSystem.setStoryState(
        this.timelineController.currentStateId,
        this.timelineController.stateProgress
      );
    }

    switch (this.state.chapter) {
      case 'arrival':
        this.state.actors.robot.visible = true;
        this.state.actors.robot.awake = false;
        break;

      case 'awakening':
        this.state.actors.robot.awake = true;
        this.state.actors.robot.energy = this.state.chapterProgress;
        break;

      case 'transformation':
        this.state.actors.robot.dissolve = this.state.chapterProgress;
        this.state.actors.fibers.visible = true;
        this.state.actors.fibers.progress = this.state.chapterProgress;
        break;

      case 'fiber_highway':
        this.state.actors.fibers.visible = true;
        this.state.actors.fibers.progress = 1;
        this.state.actors.fibers.intensity = this.state.chapterProgress;
        break;
    }

    this.stateMachine.update(this.timelineController);

    logExperienceStateChange(this);
  }

  dispose() {
    this.scrollController.dispose();
    this.timelineController.dispose();
    this.stateMachine.dispose();
    this.resourceManager.dispose();
    this.sceneManager.dispose();
    this.assetManager.dispose();
    this.state.reset();
    resetExperienceDebug();
    this._initialized = false;
    this.robotSystem?.dispose();
  }
}