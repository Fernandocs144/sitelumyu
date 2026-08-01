import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler';

/**
 * SurfaceSampler module.
 * Responsible for generating uniformly distributed points on model surfaces.
 *
 * Accepts EXCLUSIVELY a normalized `GeometryData` object.
 * Returns a normalized `SurfacePointCloud` structure.
 */
export class SurfaceSampler {
  /**
   * Sample `count` points on the surface represented by `geometryData`.
   *
   * @param {object} geometryData — Normalized GeometryData from AssetManager / extractGeometryData
   * @param {number} count — Number of surface points to sample
   * @returns {object} SurfacePointCloud structure
   */
  static sample(geometryData, count) {
    // ── Input Validation ──────────────────────────────────────────────────
    const sampleCount = Math.floor(count);

    if (!geometryData || !geometryData.geometry) {
      console.error('[SurfaceSampler] Invalid or missing geometryData.');
      return createEmptyPointCloud();
    }

    if (isNaN(sampleCount) || sampleCount <= 0) {
      console.error(`[SurfaceSampler] Invalid sample count: ${count}`);
      return createEmptyPointCloud();
    }

    const geometry = geometryData.geometry;
    if (!geometry.attributes.position || geometry.attributes.position.count === 0) {
      console.error('[SurfaceSampler] Geometry has no position attribute or vertex count is 0.');
      return createEmptyPointCloud();
    }

    // ── Sampling Execution via MeshSurfaceSampler ─────────────────────────
    try {
      // Create temporary mesh for MeshSurfaceSampler
      const tempMesh = new THREE.Mesh(geometry);
      const sampler = new MeshSurfaceSampler(tempMesh).build();

      const positions = new Float32Array(sampleCount * 3);
      const normals = new Float32Array(sampleCount * 3);

      const tempPosition = new THREE.Vector3();
      const tempNormal = new THREE.Vector3();

      const boundingBox = new THREE.Box3();
      const boundingSphere = new THREE.Sphere();

      for (let i = 0; i < sampleCount; i++) {
        sampler.sample(tempPosition, tempNormal);

        const i3 = i * 3;
        positions[i3] = tempPosition.x;
        positions[i3 + 1] = tempPosition.y;
        positions[i3 + 2] = tempPosition.z;

        normals[i3] = tempNormal.x;
        normals[i3 + 1] = tempNormal.y;
        normals[i3 + 2] = tempNormal.z;

        boundingBox.expandByPoint(tempPosition);
      }

      boundingBox.getBoundingSphere(boundingSphere);

      return {
        count: sampleCount,
        positions,
        normals,
        boundingBox,
        boundingSphere,
      };
    } catch (error) {
      console.error('[SurfaceSampler] Failed to sample surface:', error);
      return createEmptyPointCloud();
    }
  }
}

/**
 * Returns an empty SurfacePointCloud structure.
 * Ensures strict normalization when sampling fails or is invalid.
 *
 * @returns {object} SurfacePointCloud
 */
export function createEmptyPointCloud() {
  return {
    count: 0,
    positions: new Float32Array(0),
    normals: new Float32Array(0),
    boundingBox: new THREE.Box3(),
    boundingSphere: new THREE.Sphere(),
  };
}

/**
 * Standalone helper function for sampling surface directly from a GeometryData.
 *
 * @param {object} geometryData — Normalized GeometryData
 * @param {number} count — Number of points
 * @returns {object} SurfacePointCloud
 */
export function sampleGeometrySurface(geometryData, count) {
  return SurfaceSampler.sample(geometryData, count);
}
