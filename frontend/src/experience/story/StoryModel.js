import { STORY_CHAPTERS } from "./StoryChapters";
import { STORY_EVENTS } from "./StoryEvents";

class StoryModel {

    constructor() {
        this.chapters = STORY_CHAPTERS;
        this.events = STORY_EVENTS;
    }

    getChapter(progress) {

        return this.chapters.find(chapter =>
            progress >= chapter.start &&
            progress < chapter.end
        ) || this.chapters[this.chapters.length - 1];

    }

    getChapterProgress(progress) {

        const chapter = this.getChapter(progress);

        const length = chapter.end - chapter.start;

        if (length <= 0)
            return 0;

        return (progress - chapter.start) / length;

    }

    getEvents(chapterId) {

        return this.events[chapterId] || [];

    }

}

export default new StoryModel();