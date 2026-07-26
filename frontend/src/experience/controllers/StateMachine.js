import { EXPERIENCE_STATES } from './StateMachine.constants';

export { EXPERIENCE_STATES } from './StateMachine.constants';

/**
 * Narrative state holder aligned with 06_SCROLL_TIMELINE.md.
 * Resolves the current experience state from timeline data.
 */
export class StateMachine {
  constructor() {
    this._currentState = EXPERIENCE_STATES.ROBOT;
  }

  get currentState() {
    return this._currentState;
  }

  update(timeline) {
    const nextState = timeline.currentStateId ?? EXPERIENCE_STATES.ROBOT;
    this._currentState = nextState;
  }

  dispose() {
    this._currentState = EXPERIENCE_STATES.ROBOT;
  }
}
