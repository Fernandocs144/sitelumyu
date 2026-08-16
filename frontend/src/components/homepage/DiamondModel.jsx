import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

/**
 * DiamondMesh — Loads and displays static /models/diamond/diamond.glb (Sprint 1.3).
 * Model scale and camera frustum configured with ample clearance for future transformations.
 */
function DiamondMesh() {
  const { scene } = useGLTF('/models/diamond/diamond.glb');
  return <primitive object={scene} scale={1.3} position={[0, 0, 0]} />;
}

/**
 * DiamondModel — 3D Stage for Diamond model with large spatial bounds to prevent clipping during future transformations.
 */
export default function DiamondModel({ className = '' }) {
  return (
    <div
      className={`relative w-full h-full min-h-[450px] md:min-h-[520px] pointer-events-none overflow-visible ${className}`}
      data-testid="diamond-model-container"
    >
      {/* Ambient background glow for seamless integration */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-[radial-gradient(circle_at_center,rgba(49,84,245,0.20),rgba(155,36,230,0.08)_50%,transparent_75%)]" />

      <Canvas
        camera={{ position: [0, 0, 6], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={1.8} />
        <directionalLight position={[5, 5, 5]} intensity={3} color="#3154f5" />
        <directionalLight position={[-5, -5, -5]} intensity={1.8} color="#ff2d78" />
        <pointLight position={[0, 0, 4]} intensity={2.5} color="#ffffff" />
        <Suspense fallback={null}>
          <DiamondMesh />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload('/models/diamond/diamond.glb');
