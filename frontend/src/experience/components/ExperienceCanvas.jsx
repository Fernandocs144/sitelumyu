import React, { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useExperience } from '../hooks/useExperience';
import PointCloudScene from './PointCloudScene';

function SceneBootstrap() {
  const { engine } = useExperience();
  const { scene, camera, gl } = useThree();

  useEffect(() => {
    engine.sceneManager.attach({ scene, camera, renderer: gl });
    return () => engine.sceneManager.detach();
  }, [engine, scene, camera, gl]);

  return null;
}

/**
 * Single R3F Canvas for the homepage experience.
 * Cleanly mounts scene components.
 */
export default function ExperienceCanvas() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden
      data-testid="experience-canvas"
    >
      <Canvas
        camera={{ position: [0, 0, 9], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        frameloop="demand"
      >
        <SceneBootstrap />
        <PointCloudScene />
      </Canvas>
    </div>
  );
}
