class ExperienceState {
    constructor() {
        this.reset();
    }

    reset() {

        this.progress = 0;

        this.chapter = "arrival";
        this.chapterProgress = 0;

        this.previousChapter = null;
        this.nextChapter = null;

        this.actors = {

            robot: {
                visible: true,
                awake: false,
                dissolve: 0,
                energy: 0
            },

            fibers: {
                visible: false,
                progress: 0,
                intensity: 0
            },

            cards: {
                first: false,
                second: false,
                third: false
            },

            solutions: {
                visible: false
            },

            logo: {
                visible: false,
                progress: 0
            },

            diamond: {
                visible: false,
                progress: 0
            },

            galaxy: {
                visible: false
            }

        };

    }

    update(data = {}) {
        Object.assign(this, data);
         if (typeof this.__notify === "function") {
        this.__notify();
    }

}
}
export default new ExperienceState();