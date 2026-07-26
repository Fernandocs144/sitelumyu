/**
 * Owns Three.js scene references from the main Canvas.
 * No narrative logic — resize and lifecycle only.
 */
export class SceneManager {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this._attached = false;
  }

  get isAttached() {
    return this._attached;
  }

  attach({ scene, camera, renderer }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this._attached = true;
  }

  detach() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this._attached = false;
  }

  dispose() {
    this.detach();
  }
}
