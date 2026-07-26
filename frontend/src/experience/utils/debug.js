/**
 * Temporary debug helper — set to false to disable, or remove this file in a future sprint.
 */
export const EXPERIENCE_DEBUG = process.env.NODE_ENV === 'development';

let lastLoggedState = null;

export function logExperienceStateChange(engine) {
  if (!EXPERIENCE_DEBUG) return;

  const currentState = engine.stateMachine.currentState;
  if (currentState === lastLoggedState) return;

  lastLoggedState = currentState;

  console.info('[Experience Engine]', {
    'Current State': currentState,
    Progress: engine.scrollController.progress,
    Timeline: {
      globalProgress: engine.timelineController.globalProgress,
      stateProgress: engine.timelineController.stateProgress,
      currentStateId: engine.timelineController.currentStateId,
    },
  });
}

export function resetExperienceDebug() {
  lastLoggedState = null;
}
