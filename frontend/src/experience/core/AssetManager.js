import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { MODEL_PATHS } from '../assets';
import { extractGeometryData } from '../assets/extractGeometryData';
import { SurfaceSampler, createEmptyPointCloud } from '../assets/SurfaceSampler';

/**
 * Central manager for GLB model assets.
 *
 * Responsibilities:
 * - Load GLB models via GLTFLoader (with DRACO support)
 * - Maintain a cache — each model is loaded only once
 * - Extract and expose metadata and normalized GeometryData per model
 * - Generate and cache surface point clouds via SurfaceSampler
 * - Provide a simple public API (load / get / getGeometry / getMetadata / sampleSurface / has / clear)
 *
 * This class does NOT render, animate, or create particles.
 * GLBs are treated as raw geometry data (04_GLB_PIPELINE.md).
 */
export class AssetManager {
  constructor() {
    /** @type {Map<string, object>} Loaded model entries keyed by name */
    this._cache = new Map();

    /** @type {Map<string, Promise<object|null>>} In-flight load promises */
    this._pending = new Map();

    /** @type {GLTFLoader} */
    this._gltfLoader = new GLTFLoader();

    /** @type {DRACOLoader} */
    this._dracoLoader = new DRACOLoader();
    this._dracoLoader.setDecoderPath('/draco/');
    this._gltfLoader.setDRACOLoader(this._dracoLoader);
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Load a model by name. Returns the cached entry if already loaded.
   * Concurrent calls for the same model share a single in-flight request.
   *
   * @param {string} name — model key as defined in MODEL_PATHS (e.g. 'robot')
   * @returns {Promise<object|null>} ModelEntry or null on error
   */
  async load(name) {
    // Return from cache if already loaded
    if (this._cache.has(name)) {
      return this._cache.get(name);
    }

    // Return existing in-flight promise to prevent duplicate requests
    if (this._pending.has(name)) {
      return this._pending.get(name);
    }

    // Validate model name
    const path = MODEL_PATHS[name];
    if (!path) {
      console.error(
        `[AssetManager] Unknown model "${name}". Available: ${Object.keys(MODEL_PATHS).join(', ')}`
      );
      return null;
    }

    // Start loading and store the promise
    const loadPromise = this._loadModel(name, path);
    this._pending.set(name, loadPromise);

    try {
      const entry = await loadPromise;
      return entry;
    } finally {
      this._pending.delete(name);
    }
  }

  /**
   * Get a previously loaded model entry from cache.
   *
   * @param {string} name — model key
   * @returns {object|null} ModelEntry or null if not loaded
   */
  get(name) {
    return this._cache.get(name) ?? null;
  }

  /**
   * Get the normalized GeometryData for a loaded model.
   *
   * @param {string} name — model key
   * @returns {object|null} GeometryData or null if not loaded
   */
  getGeometry(name) {
    const entry = this._cache.get(name);
    return entry ? entry.geometryData : null;
  }

  /**
   * Get a lightweight metadata summary for a loaded model.
   * Contains only counts and dimensions — no heavy Three.js object references.
   *
   * @param {string} name — model key
   * @returns {object|null} Metadata summary or null if not loaded
   */
  getMetadata(name) {
    const entry = this._cache.get(name);
    if (!entry) return null;

    const gd = entry.geometryData;
    return {
      name: entry.name,
      meshCount: entry.meshCount,
      materialCount: gd.materials.length,
      vertexCount: gd.vertexCount,
      triangleCount: gd.triangleCount,
      indexCount: gd.indexCount,
      normalCount: gd.normalCount,
      uvCount: gd.uvCount,
      boundingBox: { min: gd.boundingBox.min.toArray(), max: gd.boundingBox.max.toArray() },
      boundingSphere: { center: gd.boundingSphere.center.toArray(), radius: gd.boundingSphere.radius },
      center: gd.center.toArray(),
      size: gd.size.toArray(),
    };
  }

  /**
   * Sample `count` points on the surface of a model.
   * Auto-loads the model if not loaded. Results are cached inside `ModelEntry.sampledSurfaces[count]`.
   *
   * @param {string} name — model key
   * @param {number} count — number of surface points
   * @returns {Promise<object>} SurfacePointCloud structure
   */
  async sampleSurface(name, count) {
    const entry = await this.load(name);
    if (!entry) {
      return createEmptyPointCloud();
    }

    const sampleCount = Math.floor(count);
    if (entry.sampledSurfaces[sampleCount]) {
      return entry.sampledSurfaces[sampleCount];
    }

    const pointCloud = SurfaceSampler.sample(entry.geometryData, sampleCount);

    if (pointCloud.count > 0) {
      entry.sampledSurfaces[sampleCount] = pointCloud;
      console.info(
        `[AssetManager] Sampled surface for "${name}" (${sampleCount} points)`
      );
    }

    return pointCloud;
  }

  /**
   * Check if a model is already loaded in cache.
   *
   * @param {string} name — model key
   * @returns {boolean}
   */
  has(name) {
    return this._cache.has(name);
  }

  /**
   * Clear the cache and remove all references.
   * Does NOT execute deep resource disposal (geometry.dispose, etc.).
   */
  clear() {
    this._cache.clear();
    this._pending.clear();
  }

  /**
   * Dispose the AssetManager — clears cache and releases the DRACO decoder.
   */
  dispose() {
    this.clear();
    this._dracoLoader.dispose();
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  /**
   * Internal loading routine. Loads a GLB file, extracts metadata,
   * and stores the result in the cache.
   *
   * @param {string} name — model key
   * @param {string} path — URL path relative to public/
   * @returns {Promise<object|null>} ModelEntry or null on error
   * @private
   */
  _loadModel(name, path) {
    return new Promise((resolve) => {
      this._gltfLoader.load(
        path,
        (gltf) => {
          const entry = this._buildModelEntry(name, gltf);
          this._cache.set(name, entry);
          console.info(
            `[AssetManager] Loaded "${name}" — ` +
            `${entry.meshCount} mesh(es), ` +
            `${entry.geometryData.vertexCount} vertices, ` +
            `${entry.geometryData.triangleCount} triangles`
          );
          resolve(entry);
        },
        undefined, // onProgress — not needed
        (error) => {
          console.error(`[AssetManager] Failed to load "${name}" from "${path}":`, error);
          resolve(null);
        }
      );
    });
  }

  /**
   * Build a ModelEntry from a loaded GLTF result.
   * Extracts both legacy fields and normalized GeometryData.
   *
   * @param {string} name — model key
   * @param {object} gltf — GLTFLoader result
   * @returns {object} ModelEntry
   * @private
   */
  _buildModelEntry(name, gltf) {
    const scene = gltf.scene;
    const geometryData = extractGeometryData(name, scene);

    return {
      name,
      scene,
      meshes: geometryData.meshes,
      meshCount: geometryData.meshes.length,
      boundingBox: geometryData.boundingBox,
      boundingSphere: geometryData.boundingSphere,
      mainGeometry: geometryData.geometry,
      geometryData,
      sampledSurfaces: {},
    };
  }
}
