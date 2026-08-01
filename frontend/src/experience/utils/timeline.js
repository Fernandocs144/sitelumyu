import StoryModel from '../story/StoryModel';

export function resolveTimelineSegment(progress) {
    return StoryModel.getChapter(progress);
}

export function computeStateProgress(progress) {
    return StoryModel.getChapterProgress(progress);
}