import * as THREE from 'three';

/**
 * Extract a normalized GeometryData structure from a GLTF scene.
 *
 * Every model produces the exact same shape regardless of whether
 * it contains UVs, normals, or indices. Missing attributes are
 * represented as zero counts.
 *
 * The returned `geometry` is the BufferGeometry of the mesh with the
 * most vertices — the primary geometry for future Surface Sampling.
 *
 * @param {string} name — model identifier (for logging)
 * @param {THREE.Group} scene — gltf.scene
 * @returns {object} GeometryData
 */
export function extractGeometryData(name, scene) {
  // ── Collect meshes and unique materials ──────────────────────────────────
  const meshes = [];
  const materialSet = new Set();

  scene.traverse((child) => {
    if (child.isMesh) {
      meshes.push(child);

      if (Array.isArray(child.material)) {
        child.material.forEach((m) => materialSet.add(m));
      } else if (child.material) {
        materialSet.add(child.material);
      }
    }
  });

  const materials = Array.from(materialSet);

  // ── Validate: model must contain at least one mesh ──────────────────────
  if (meshes.length === 0) {
    console.error(
      `[GeometryExtractor] Model "${name}" contains no meshes.`
    );
    return _emptyGeometryData(meshes, materials);
  }

  // ── Identify main geometry (mesh with most vertices) ────────────────────
  let geometry = null;
  let maxVertexCount = 0;

  for (const mesh of meshes) {
    const geo = mesh.geometry;
    if (geo && geo.attributes.position) {
      const count = geo.attributes.position.count;
      if (count > maxVertexCount) {
        maxVertexCount = count;
        geometry = geo;
      }
    }
  }

  // ── Validate: at least one mesh must have position attribute ─────────────
  if (!geometry) {
    console.error(
      `[GeometryExtractor] Model "${name}" has meshes but none with a position attribute.`
    );
    return _emptyGeometryData(meshes, materials);
  }

  // ── Extract attribute counts ────────────────────────────────────────────
  const posAttr = geometry.attributes.position;
  const normalAttr = geometry.attributes.normal;
  const uvAttr = geometry.attributes.uv;
  const indexAttr = geometry.index;

  const vertexCount = posAttr ? posAttr.count : 0;
  const normalCount = normalAttr ? normalAttr.count : 0;
  const uvCount = uvAttr ? uvAttr.count : 0;
  const indexCount = indexAttr ? indexAttr.count : 0;

  // Triangle count: from index if indexed, otherwise from vertex count
  let triangleCount = 0;
  if (indexCount > 0) {
    triangleCount = Math.floor(indexCount / 3);
  } else if (vertexCount > 0) {
    triangleCount = Math.floor(vertexCount / 3);
  }

  // ── Bounding information ────────────────────────────────────────────────
  const boundingBox = new THREE.Box3().setFromObject(scene);
  const boundingSphere = new THREE.Sphere();
  boundingBox.getBoundingSphere(boundingSphere);

  const center = new THREE.Vector3();
  boundingBox.getCenter(center);

  const size = new THREE.Vector3();
  boundingBox.getSize(size);

  // ── Return normalized structure ─────────────────────────────────────────
  return {
    geometry,
    vertexCount,
    triangleCount,
    indexCount,
    normalCount,
    uvCount,
    boundingBox,
    boundingSphere,
    center,
    size,
    meshes,
    materials,
  };
}

// ── Helper: empty GeometryData for invalid models ───────────────────────────

/**
 * Returns a GeometryData with all numeric fields at zero and geometry null.
 * Ensures every model returns the exact same structure shape.
 *
 * @param {Array} meshes
 * @param {Array} materials
 * @returns {object} GeometryData
 * @private
 */
function _emptyGeometryData(meshes, materials) {
  return {
    geometry: null,
    vertexCount: 0,
    triangleCount: 0,
    indexCount: 0,
    normalCount: 0,
    uvCount: 0,
    boundingBox: new THREE.Box3(),
    boundingSphere: new THREE.Sphere(),
    center: new THREE.Vector3(),
    size: new THREE.Vector3(),
    meshes,
    materials,
  };
}
