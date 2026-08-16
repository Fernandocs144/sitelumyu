import React, {
  Suspense,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import {
  Canvas,
  useFrame,
  useThree,
} from '@react-three/fiber';

import { useGLTF } from '@react-three/drei';

import * as THREE from 'three';

import { MeshSurfaceSampler } from
  'three/examples/jsm/math/MeshSurfaceSampler.js';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import './FinalLumyoFlow.css';


gsap.registerPlugin(ScrollTrigger);


const PARTICLES_PER_MESH = 4500;

const CURSOR_RADIUS = 0.65;
const CURSOR_FORCE = 0.30;
const RETURN_SPEED = 0.09;


/* =========================================================
   POSIÇÃO FINAL DO LOGO
========================================================= */

const FINAL_POSITION = {
  x: 0,
  y: -0.1,
  z: 0,
};

const FINAL_SCALE = 1.2;

const FINAL_ROTATION_Z =
  Math.PI / -4.5;


/* =========================================================
   DIGITAL MESH
========================================================= */

function DigitalMesh({ sourceGeometry }) {
  const lineGeometry = useMemo(() => {
    if (!sourceGeometry) return null;

    const positionAttribute =
      sourceGeometry.getAttribute('position');

    if (!positionAttribute) return null;

    const vertices = [];
    const sampledPoints = [];

    const step = Math.max(
      1,
      Math.floor(positionAttribute.count / 45)
    );

    for (
      let i = 0;
      i < positionAttribute.count;
      i += step
    ) {
      sampledPoints.push(
        new THREE.Vector3(
          positionAttribute.getX(i),
          positionAttribute.getY(i),
          positionAttribute.getZ(i)
        )
      );
    }

    const MAX_DISTANCE = 0.75;
    const MAX_CONNECTIONS = 2;

    sampledPoints.forEach((point, index) => {
      const neighbours = [];

      sampledPoints.forEach(
        (otherPoint, otherIndex) => {
          if (index === otherIndex) return;

          const distance =
            point.distanceTo(otherPoint);

          if (distance < MAX_DISTANCE) {
            neighbours.push({
              point: otherPoint,
              distance,
            });
          }
        }
      );

      neighbours.sort(
        (a, b) => a.distance - b.distance
      );

      neighbours
        .slice(0, MAX_CONNECTIONS)
        .forEach((neighbour) => {
          vertices.push(
            point.x,
            point.y,
            point.z,

            neighbour.point.x,
            neighbour.point.y,
            neighbour.point.z
          );
        });
    });

    const geometry =
      new THREE.BufferGeometry();

    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        vertices,
        3
      )
    );

    return geometry;
  }, [sourceGeometry]);

  if (!lineGeometry) return null;

  return (
    <lineSegments geometry={lineGeometry}>
      <lineBasicMaterial
        color="#b484e8"
        transparent
        opacity={0.20}
        depthWrite={false}
        toneMapped={false}
      />
    </lineSegments>
  );
}


/* =========================================================
   PARTICLE LOGO
========================================================= */

function ParticleLogo() {
  const { scene } =
    useGLTF('/models/logo.glb');

  const groupRef = useRef();
  const pointsRef = useRef();

  const mainMaterialRef = useRef();
  const glowMaterialRef = useRef();
  const haloMaterialRef = useRef();

  const { camera, gl } = useThree();

  const mouse = useRef(
    new THREE.Vector2(999, 999)
  );

  const mouseWorld = useRef(
    new THREE.Vector3()
  );

  const raycaster = useMemo(
    () => new THREE.Raycaster(),
    []
  );

  const interactionPlane = useMemo(
    () =>
      new THREE.Plane(
        new THREE.Vector3(0, 0, 1),
        0
      ),
    []
  );


  /* =======================================================
     GEOMETRIA
  ======================================================= */

  const geometry = useMemo(() => {
    const positions = [];
    const colors = [];
    const meshes = [];

    scene.traverse((child) => {
      if (
        child.isMesh &&
        child.geometry
      ) {
        meshes.push(child);
      }
    });

    if (!meshes.length) {
      return null;
    }

    scene.updateMatrixWorld(true);

    const tempPosition =
      new THREE.Vector3();

    const tempColor =
      new THREE.Color();


    const coral =
      new THREE.Color('#F07877');

    const rose =
      new THREE.Color('#D987A5');

    const lilac =
      new THREE.Color('#B484B8');

    const violet =
      new THREE.Color('#9766DC');

    const purple =
      new THREE.Color('#735CC9');

    const junction =
      new THREE.Color('#E8D9F4');


    meshes.forEach((mesh) => {
      const sampler =
        new MeshSurfaceSampler(mesh)
          .build();

      for (
        let i = 0;
        i < PARTICLES_PER_MESH;
        i += 1
      ) {
        sampler.sample(tempPosition);

        tempPosition.applyMatrix4(
          mesh.matrixWorld
        );

        positions.push(
          tempPosition.x,
          tempPosition.y,
          tempPosition.z
        );


        const x =
          THREE.MathUtils.clamp(
            (tempPosition.x + 1.5) / 3,
            0,
            1
          );

        const y =
          THREE.MathUtils.clamp(
            (tempPosition.y + 1.5) / 3,
            0,
            1
          );


        if (x < 0.25) {
          tempColor
            .copy(coral)
            .lerp(
              rose,
              x / 0.25
            );
        }

        else if (x < 0.50) {
          tempColor
            .copy(rose)
            .lerp(
              lilac,
              (x - 0.25) / 0.25
            );
        }

        else if (x < 0.72) {
          tempColor
            .copy(lilac)
            .lerp(
              violet,
              (x - 0.50) / 0.22
            );
        }

        else {
          tempColor
            .copy(violet)
            .lerp(
              purple,
              (x - 0.72) / 0.28
            );
        }


        if (
          y > 0.62 &&
          x < 0.55
        ) {
          const strength =
            THREE.MathUtils.smoothstep(
              y,
              0.62,
              1
            ) * 0.45;

          tempColor.lerp(
            coral,
            strength
          );
        }


        const junctionDistance =
          Math.sqrt(
            Math.pow(
              tempPosition.x + 0.15,
              2
            ) +
            Math.pow(
              tempPosition.y + 0.35,
              2
            )
          );

        if (
          junctionDistance < 0.45
        ) {
          const strength =
            1 -
            THREE.MathUtils.clamp(
              junctionDistance / 0.45,
              0,
              1
            );

          tempColor.lerp(
            junction,
            strength * 0.65
          );
        }


        colors.push(
          tempColor.r,
          tempColor.g,
          tempColor.b
        );
      }
    });


    const bufferGeometry =
      new THREE.BufferGeometry();

    bufferGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        positions,
        3
      )
    );

    bufferGeometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(
        colors,
        3
      )
    );


    bufferGeometry.computeBoundingBox();

    const box =
      bufferGeometry.boundingBox;

    if (box) {
      const center =
        new THREE.Vector3();

      box.getCenter(center);

      bufferGeometry.translate(
        -center.x,
        -center.y,
        -center.z
      );
    }


    const positionAttribute =
      bufferGeometry.getAttribute(
        'position'
      );

    bufferGeometry.userData.originalPositions =
      new Float32Array(
        positionAttribute.array
      );


    return bufferGeometry;
  }, [scene]);


  /* =======================================================
     CONVERTER PIXEL DO ECRÃ PARA THREE.JS
  ======================================================= */

  const screenToWorld = (
    screenX,
    screenY
  ) => {
    const rect =
      gl.domElement.getBoundingClientRect();

    const ndc =
      new THREE.Vector2(
        (
          (screenX - rect.left) /
          rect.width
        ) * 2 - 1,

        -(
          (
            screenY - rect.top
          ) /
          rect.height
        ) * 2 + 1
      );

    const caster =
      new THREE.Raycaster();

    caster.setFromCamera(
      ndc,
      camera
    );

    const plane =
      new THREE.Plane(
        new THREE.Vector3(0, 0, 1),
        0
      );

    const result =
      new THREE.Vector3();

    const hit =
      caster.ray.intersectPlane(
        plane,
        result
      );

    return hit
      ? result
      : new THREE.Vector3();
  };


  /* =======================================================
     ENTRADA DO LOGO A PARTIR DO CARD 03
  ======================================================= */

  useEffect(() => {
    if (
      !groupRef.current ||
      !geometry
    ) {
      return undefined;
    }


    const card03 =
      document.querySelector(
        '[data-service-card="03"]'
      );

    if (!card03) {
      console.warn(
        '[LUMYO LOGO] Card 03 não encontrado.'
      );

      return undefined;
    }


    const group =
      groupRef.current;


    /*
     * Obtemos a posição real do Card 03.
     *
     * O ponto de nascimento fica perto
     * da lateral direita do card.
     */

    const calculateStartPosition = () => {
      const cardRect =
        card03.getBoundingClientRect();

      const screenX =
        cardRect.right - 10;

      const screenY =
        cardRect.top +
        cardRect.height * 0.55;

      return screenToWorld(
        screenX,
        screenY
      );
    };


    const startPosition =
      calculateStartPosition();


    /*
     * ESTADO INICIAL
     */

    group.position.set(
      startPosition.x,
      startPosition.y,
      0
    );

    group.scale.setScalar(0.16);

    group.rotation.set(
      0,
      0,
      Math.PI / -2.8
    );


    if (mainMaterialRef.current) {
      mainMaterialRef.current.opacity = 0;
    }

    if (glowMaterialRef.current) {
      glowMaterialRef.current.opacity = 0;
    }

    if (haloMaterialRef.current) {
      haloMaterialRef.current.opacity = 0;
    }


    /*
     * TIMELINE
     */

    const timeline =
      gsap.timeline({
        scrollTrigger: {
          id: 'lumyo-logo-reveal',

          trigger: card03,

          /*
           * Começa quando o Card 03
           * já está bem dentro do viewport.
           */

          start: 'center 68%',

          /*
           * O movimento ocupa uma boa
           * quantidade de scroll.
           */

          end: 'center 30%',

          scrub: 0.8,

          invalidateOnRefresh: true,

          // DEBUG:
          // markers: true,
        },
      });


    /*
     * SAÍDA DO CARD
     */

    timeline.to(
      group.position,
      {
        x: FINAL_POSITION.x,
        y: FINAL_POSITION.y,
        z: FINAL_POSITION.z,

        duration: 1,

        ease: 'none',
      },
      0
    );


    /*
     * CRESCIMENTO
     */

    timeline.to(
      group.scale,
      {
        x: FINAL_SCALE,
        y: FINAL_SCALE,
        z: FINAL_SCALE,

        duration: 1,

        ease: 'power2.out',
      },
      0
    );


    /*
     * ROTAÇÃO
     */

    timeline.to(
      group.rotation,
      {
        z: FINAL_ROTATION_Z,

        duration: 1,

        ease: 'power2.out',
      },
      0
    );


    /*
     * APARECIMENTO DA MASSA PRINCIPAL
     */

    if (mainMaterialRef.current) {
      timeline.to(
        mainMaterialRef.current,
        {
          opacity: 0.72,

          duration: 0.42,

          ease: 'power1.out',
        },
        0.02
      );
    }


    /*
     * PARTÍCULAS LUMINOSAS
     */

    if (glowMaterialRef.current) {
      timeline.to(
        glowMaterialRef.current,
        {
          opacity: 0.30,

          duration: 0.50,

          ease: 'power1.out',
        },
        0.06
      );
    }


    /*
     * HALO
     */

    if (haloMaterialRef.current) {
      timeline.to(
        haloMaterialRef.current,
        {
          opacity: 0.07,

          duration: 0.58,

          ease: 'power1.out',
        },
        0.10
      );
    }


    /*
     * REFRESH depois de tudo existir.
     */

    const refreshTimer =
      window.setTimeout(() => {
        ScrollTrigger.refresh();
      }, 100);


    return () => {
      window.clearTimeout(
        refreshTimer
      );

      timeline.scrollTrigger?.kill();
      timeline.kill();
    };
  }, [
    geometry,
    camera,
    gl,
  ]);


  /* =======================================================
     RATO
  ======================================================= */

  useEffect(() => {
    const handlePointerMove = (
      event
    ) => {
      const canvas =
        gl.domElement;

      const rect =
        canvas.getBoundingClientRect();

      const localX =
        event.clientX -
        rect.left;

      const localY =
        event.clientY -
        rect.top;


      if (
        localX < 0 ||
        localY < 0 ||
        localX > rect.width ||
        localY > rect.height
      ) {
        mouse.current.set(
          999,
          999
        );

        return;
      }


      mouse.current.x =
        (localX / rect.width) *
          2 -
        1;

      mouse.current.y =
        -(
          localY /
          rect.height
        ) *
          2 +
        1;
    };


    const handlePointerLeave = () => {
      mouse.current.set(
        999,
        999
      );
    };


    window.addEventListener(
      'pointermove',
      handlePointerMove,
      { passive: true }
    );

    document.addEventListener(
      'mouseleave',
      handlePointerLeave
    );


    return () => {
      window.removeEventListener(
        'pointermove',
        handlePointerMove
      );

      document.removeEventListener(
        'mouseleave',
        handlePointerLeave
      );
    };
  }, [gl]);


  /* =======================================================
     INTERACÇÃO DAS PARTÍCULAS
  ======================================================= */

  useFrame(() => {
    if (
      !geometry ||
      !pointsRef.current
    ) {
      return;
    }


    const positions =
      geometry.getAttribute(
        'position'
      );

    const original =
      geometry.userData
        .originalPositions;

    if (!original) return;


    raycaster.setFromCamera(
      mouse.current,
      camera
    );


    const hasIntersection =
      raycaster.ray.intersectPlane(
        interactionPlane,
        mouseWorld.current
      );


    if (
      hasIntersection &&
      pointsRef.current.parent
    ) {
      pointsRef.current.parent.worldToLocal(
        mouseWorld.current
      );
    }


    for (
      let i = 0;
      i < positions.count;
      i += 1
    ) {
      const index =
        i * 3;

      const originalX =
        original[index];

      const originalY =
        original[index + 1];

      const originalZ =
        original[index + 2];


      let targetX =
        originalX;

      let targetY =
        originalY;

      let targetZ =
        originalZ;


      if (hasIntersection) {
        const dx =
          originalX -
          mouseWorld.current.x;

        const dy =
          originalY -
          mouseWorld.current.y;

        const distance =
          Math.sqrt(
            dx * dx +
            dy * dy
          );


        if (
          distance <
          CURSOR_RADIUS
        ) {
          const safeDistance =
            Math.max(
              distance,
              0.001
            );

          const influence =
            1 -
            distance /
              CURSOR_RADIUS;

          const force =
            influence *
            influence *
            CURSOR_FORCE;


          targetX =
            originalX +
            (
              dx /
              safeDistance
            ) *
              force;

          targetY =
            originalY +
            (
              dy /
              safeDistance
            ) *
              force;

          targetZ =
            originalZ +
            influence *
              0.10;
        }
      }


      positions.array[index] +=
        (
          targetX -
          positions.array[index]
        ) *
        RETURN_SPEED;

      positions.array[index + 1] +=
        (
          targetY -
          positions.array[index + 1]
        ) *
        RETURN_SPEED;

      positions.array[index + 2] +=
        (
          targetZ -
          positions.array[index + 2]
        ) *
        RETURN_SPEED;
    }


    positions.needsUpdate = true;
  });


  if (!geometry) {
    return null;
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <group ref={groupRef}>

      {/* MASSA PRINCIPAL */}

      <points
        ref={pointsRef}
        geometry={geometry}
      >
        <pointsMaterial
          ref={mainMaterialRef}
          vertexColors
          size={0.014}
          sizeAttenuation
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </points>


      {/* PARTÍCULAS LUMINOSAS */}

      <points geometry={geometry}>
        <pointsMaterial
          ref={glowMaterialRef}
          vertexColors
          size={0.028}
          sizeAttenuation
          transparent
          opacity={0}
          depthWrite={false}
          blending={
            THREE.AdditiveBlending
          }
          toneMapped={false}
        />
      </points>


      {/* HALO */}

      <points geometry={geometry}>
        <pointsMaterial
          ref={haloMaterialRef}
          vertexColors
          size={0.055}
          sizeAttenuation
          transparent
          opacity={0}
          depthWrite={false}
          blending={
            THREE.AdditiveBlending
          }
          toneMapped={false}
        />
      </points>


      {/* RISCOS INTERIORES */}

      <DigitalMesh
        sourceGeometry={geometry}
      />

    </group>
  );
}


/* =========================================================
   FINAL LUMYO FLOW
========================================================= */

export default function FinalLumyoFlow() {
  return (
    <div
      className="final-lumyo-flow"
      aria-hidden="true"
    >
      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 40,
          near: 0.1,
          far: 100,
        }}
        gl={{
          alpha: true,
          antialias: true,
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <ParticleLogo />
        </Suspense>
      </Canvas>
    </div>
  );
}


useGLTF.preload(
  '/models/logo.glb'
);