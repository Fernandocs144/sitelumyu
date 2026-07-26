import { EXPERIENCE_STATES } from '../controllers/StateMachine.constants';
import { clamp } from './math';

/**
 * Narrative segments from 06_SCROLL_TIMELINE.md.
 * Intervals are half-open [start, end), except the final segment which includes 1.0.
 */
export const TIMELINE_SEGMENTS = Object.freeze([
  { id: EXPERIENCE_STATES.ROBOT, start: 0.0, end: 0.1 },
  { id: EXPERIENCE_STATES.ROBOT_DISSOLVE, start: 0.1, end: 0.2 },
  { id: EXPERIENCE_STATES.DIGITAL_FIBER, start: 0.2, end: 0.35 },
  { id: EXPERIENCE_STATES.PREMIUM_WEBSITES, start: 0.35, end: 0.45 },
  { id: EXPERIENCE_STATES.AUTOMATION, start: 0.45, end: 0.55 },
  { id: EXPERIENCE_STATES.ARTIFICIAL_INTELLIGENCE, start: 0.55, end: 0.65 },
  { id: EXPERIENCE_STATES.SOLUTIONS, start: 0.65, end: 0.78 },
  { id: EXPERIENCE_STATES.LUMYO_LOGO, start: 0.78, end: 0.88 },
  { id: EXPERIENCE_STATES.DIAMOND, start: 0.88, end: 0.96 },
  { id: EXPERIENCE_STATES.GALAXY, start: 0.96, end: 1.0 },
]);

export function resolveTimelineSegment(globalProgress) {
  const progress = clamp(globalProgress, 0, 1);

  for (let i = 0; i < TIMELINE_SEGMENTS.length; i += 1) {
    const segment = TIMELINE_SEGMENTS[i];
    const isLast = i === TIMELINE_SEGMENTS.length - 1;

    if (progress >= segment.start && (isLast ? progress <= segment.end : progress < segment.end)) {
      return segment;
    }
  }

  return TIMELINE_SEGMENTS[0];
}

export function computeStateProgress(globalProgress, segment) {
  const span = segment.end - segment.start;
  if (span <= 0) return 0;
  return clamp((globalProgress - segment.start) / span, 0, 1);
}
