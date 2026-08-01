/**
 * Official model paths (04_GLB_PIPELINE.md).
 * Loading is handled exclusively by AssetManager.
 */
export const MODEL_PATHS = Object.freeze({
  robot: '/models/robot.glb',
  logo: '/models/logo.glb',
  diamond: '/models/diamond.glb',
  base: '/models/base.glb',
});

export { extractGeometryData } from './extractGeometryData';
export { SurfaceSampler, sampleGeometrySurface, createEmptyPointCloud } from './SurfaceSampler';
