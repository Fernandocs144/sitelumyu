import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

function LumyoLogo() {
  const { scene } = useGLTF('/models/logo/lumyo-l.glb');

  return (
    <primitive
      object={scene}
      scale={1.2}
      position={[0.05, -1, 0]}
      rotation={[0, 0, Math.PI / -4.5]}
    />
  );
}

export default function LogoModel({ className = '' }) {
  return (
    <div className={`relative h-full w-full ${className}`}>
      <Canvas
        camera={{
          position: [0, 0, 7],
          fov: 45,
        }}
        dpr={[1, 2]}
        gl={{
          alpha: true,
          antialias: true,
        }}
      >
        <ambientLight intensity={0.65} />

<directionalLight
  position={[-4, 4, 5]}
  intensity={1.7}
  color="#ff6f61"
/>

<directionalLight
  position={[4, 2, 5]}
  intensity={1.35}
  color="#665cff"
/>

<directionalLight
  position={[0, -2, 4]}
  intensity={0.55}
  color="#d78cff"
/>

        <Suspense fallback={null}>
          <LumyoLogo />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload('/models/logo/lumyo-l.glb');