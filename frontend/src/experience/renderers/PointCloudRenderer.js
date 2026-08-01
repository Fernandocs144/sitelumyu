import * as THREE from 'three';

/**
 * Generic PointCloudRenderer.
 * Converts a SurfacePointCloud into a THREE.Points object.
 *
 * Responsibilities:
 * - Build BufferGeometry using Float32BufferAttribute for position and normal
 * - Assign boundingBox and boundingSphere
 * - Create a neutral THREE.PointsMaterial (0xffffff)
 * - Return the THREE.Points instance ready for rendering
 *
 * The renderer is completely decoupled:
 * Does NOT know AssetManager, Timeline, Scroll, StateMachine, or Camera.
 */
export class PointCloudRenderer {
  /**
   * @param {object} [options]
   * @param {number} [options.size=0.03] Point size
   * @param {number} [options.color=0xffffff] Neutral point color
   * @param {boolean} [options.sizeAttenuation=true] Enable size attenuation
   */
  constructor(options = {}) {
    this.options = {
      size: 0.03,
      color: 0xffffff,
      sizeAttenuation: true,
      ...options,
    };
  }

  /**
   * Create a THREE.Points object from a normalized SurfacePointCloud.
   *
   * @param {object} pointCloud — Normalized SurfacePointCloud
   * @returns {THREE.Points|null} Points object or null if invalid
   */
  create(pointCloud) {
    if (!pointCloud || !pointCloud.positions || pointCloud.count === 0) {
      console.error('[PointCloudRenderer] Invalid or empty SurfacePointCloud.');
      return null;
    }

    // ── Build BufferGeometry ───────────────────────────────────────────────
    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(pointCloud.positions, 3)
    );

    if (pointCloud.normals && pointCloud.normals.length > 0) {
      geometry.setAttribute(
        'normal',
        new THREE.Float32BufferAttribute(pointCloud.normals, 3)
      );
    }

    if (pointCloud.boundingBox) {
      geometry.boundingBox = pointCloud.boundingBox.clone();
    }

    if (pointCloud.boundingSphere) {
      geometry.boundingSphere = pointCloud.boundingSphere.clone();
    }

    // ── Create neutral PointsMaterial ─────────────────────────────────────
    const material = new THREE.PointsMaterial({
      color: this.options.color,
      size: this.options.size,
      sizeAttenuation: this.options.sizeAttenuation,
    });

    // ── Return THREE.Points instance ──────────────────────────────────────
    return new THREE.Points(geometry, material);
  }
}
