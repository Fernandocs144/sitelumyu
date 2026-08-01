import * as THREE from 'three';

export class RobotSystem {

    constructor(engine) {
        this.time = 0;

this.breathAmplitude = 0.015;

this.rotationAmplitude = 0.035;

this.floatAmplitude = 0.06;

        this.engine = engine;

        this.points = null;
        this.geometry = null;
        this.material = null;
this.chapter = "arrival";

this.chapterProgress = 0;

this.visible = true;
        this.progress = 0;

        this.initialized = false;

    }

    async create() {
        console.log('[RobotSystem] create()');

        if (this.initialized)
            return;

        this.initialized = true;

        const pointCloud =
            await this.engine.assetManager.sampleSurface(
                'robot',
                100000
            );
console.log('[RobotSystem] pointCloud', pointCloud);
        if (!pointCloud)
            return;

        this.geometry = new THREE.BufferGeometry();

this.geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(
        pointCloud.positions,
        3
    )
);

this.material = new THREE.PointsMaterial({

    size: 0.03,

    color: 0xffffff,

    transparent: true,

    depthWrite: false

});

this.points = new THREE.Points(
    this.geometry,
    this.material
);

        this.engine.sceneManager.scene.add(
            this.points
        );
        console.log('[RobotSystem] added to scene');

    }

    setStoryState(chapter, progress) {

    this.chapter = chapter;

    this.chapterProgress = progress;

}

   update(delta) {
    if (!this.__logged) {
    console.log('[RobotSystem] update()');
    this.__logged = true;
}

    if (!this.points)
        return;

    this.time += delta;

    const breathe =
        Math.sin(this.time * 1.8);

    const idle =
        Math.sin(this.time * 0.65);

    this.points.rotation.y =
        idle * this.rotationAmplitude;

    this.points.position.y =
        breathe * this.floatAmplitude;

    const scale =
        1 +
        breathe *
        this.breathAmplitude;

    this.points.scale.set(
        scale,
        scale,
        scale
    );

}

    dispose() {

        if (this.points) {

            this.engine.sceneManager.scene.remove(
                this.points
            );

        }

        this.geometry?.dispose();

        this.material?.dispose();

    }

}