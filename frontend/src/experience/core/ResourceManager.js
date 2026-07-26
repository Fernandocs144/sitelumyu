/**
 * Central asset registry. All systems receive asset references from here.
 * GLTFLoader and loading logic will be added in a future sprint.
 */
export class ResourceManager {
  constructor() {
    this._cache = new Map();
  }

  get(key) {
    return this._cache.get(key) ?? null;
  }

  has(key) {
    return this._cache.has(key);
  }

  dispose() {
    this._cache.clear();
  }
}
