import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Canvas,
  useFrame,
} from '@react-three/fiber';

import {
  Environment,
  useGLTF,
} from '@react-three/drei';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import './StudioDiamondIntro.css';

gsap.registerPlugin(ScrollTrigger);


/* =========================================================
   DIAMOND MODEL
========================================================= */

function DiamondModel({ onReady }) {
  const diamondRef = useRef(null);

  const { scene } = useGLTF(
    '/models/diamond/diamond-compressed.glb'
  );

  /*
   * Aplicamos a identidade Lumyo aos materiais.
   *
   * Fazemos clone dos materiais para não modificar
   * permanentemente o objecto que o useGLTF mantém em cache.
   */
  useEffect(() => {
    scene.traverse((child) => {
      if (!child.isMesh) return;

      if (Array.isArray(child.material)) {
        child.material = child.material.map((material) => {
          const cloned = material.clone();

          if (cloned.color) {
            cloned.color.set('#b32cff');
          }

          if (cloned.emissive) {
            cloned.emissive.set('#240019');
            cloned.emissiveIntensity = 0.18;
          }

          cloned.needsUpdate = true;

          return cloned;
        });
      } else if (child.material) {
        const cloned = child.material.clone();

        if (cloned.color) {
          cloned.color.set('#b32cff');
        }

        if (cloned.emissive) {
          cloned.emissive.set('#240019');
          cloned.emissiveIntensity = 0.18;
        }

        cloned.needsUpdate = true;

        child.material = cloned;
      }
    });
  }, [scene]);


  /*
   * Igual ao código original:
   *
   * o eixo Y nunca deixa de rodar.
   *
   * O GSAP vai controlar X, posição e escala,
   * mas esta rotação Y continua autónoma.
   */
  useFrame((state, delta) => {
    if (!diamondRef.current) return;

    diamondRef.current.rotation.y += delta * 0.50;
  });


  /*
   * Só avisamos o componente principal quando
   * temos efectivamente o primitive montado.
   */
  useEffect(() => {
    if (!diamondRef.current) return;

    onReady(diamondRef.current);
  }, [onReady]);


  return (
    <primitive
      ref={diamondRef}
      object={scene}

      /*
       * Não uses 1.05 aqui.
       * O compressed tem uma escala visual diferente.
       */
      scale={0.72}

      /*
       * Aproximação conceptual ao original:
       * inicialmente mais acima e mais afastado.
       */
      position={[0, 0.55, -2.2]}

      rotation={[0, 0, 0]}
    />
  );
}

function AnimatedWord({ word, wordRef }) {
  return (
    <span
      ref={wordRef}
      className="studio-diamond-intro__word"
      aria-label={word}
    >
      {word.split('').map((letter, index) => (
        <span
          key={`${word}-${index}`}
          className="studio-diamond-intro__letter"
          aria-hidden="true"
        >
          {letter}
        </span>
      ))}
    </span>
  );
}

/* =========================================================
   STUDIO INTRO
========================================================= */

export default function StudioDiamondIntro() {
  const sectionRef = useRef(null);

  const strategyRef = useRef(null);
  const designRef = useRef(null);
  const technologyRef = useRef(null);
  const growthRef = useRef(null);

  const [diamond, setDiamond] = useState(null);


  const handleDiamondReady = useCallback((object) => {
    setDiamond(object);
  }, []);


  useEffect(() => {
    if (!diamond) return;

    const section = sectionRef.current;

    if (!section) return;
    const studioContent = document.getElementById('studio-content');


    const words = [
      strategyRef.current,
      designRef.current,
      technologyRef.current,
      growthRef.current,
    ].filter(Boolean);


    const ctx = gsap.context(() => {

      /* =====================================================
         ESTADO INICIAL
      ===================================================== */

      words.forEach((word) => {
        const letters = word.querySelectorAll(
          '.studio-diamond-intro__letter'
        );

        gsap.set(word, {
          autoAlpha: 1,
        });

        gsap.set(letters, {
          opacity: 0,
          filter: 'blur(20px)',
          y: 12,
        });
      });


      /*
       * O original começa afastado e ligeiramente acima.
       * Aqui usamos valores adaptados à nossa câmara R3F.
       */
      gsap.set(diamond.position, {
        x: 0,
        y: 0.55,
        z: -2.2,
      });

      gsap.set(diamond.rotation, {
        x: 0,
        z: 0,
      });

      gsap.set(diamond.scale, {
        x: 0.72,
        y: 0.72,
        z: 0.72,
      });

      if (studioContent) {
  gsap.set(studioContent, {
    opacity: 0,
    y: 70,
  });
}


      /* =====================================================
         TIMELINE PRINCIPAL DO DIAMANTE

         Equivalente conceptual ao tl3d original.
      ===================================================== */

      const diamondTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',

          /*
           * O original usa +=2000.
           * Mantemos também uma distância longa
           * e previsível.
           */
          end: '+=2400',

          scrub: 1,
          pin: true,

          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });


      /*
       * PRIMEIRA PARTE
       *
       * O diamante vem ligeiramente para o centro
       * enquanto roda progressivamente no eixo X.
       *
       * Y continua sempre a rodar no useFrame().
       */
      diamondTimeline.to(
        diamond.position,
        {
          y: 0,
          z: -0.6,
          duration: 7,
          ease: 'none',
        },
        0
      );

      /* =====================================================
         WORD ANIMATION
      ===================================================== */

      const animateWord = (word, start) => {
        if (!word) return;

        const letters = Array.from(
          word.querySelectorAll(
            '.studio-diamond-intro__letter'
          )
        );

        /*
         * Ordem pseudo-aleatória fixa.
         *
         * Não usamos Math.random() porque queremos que
         * o comportamento seja determinístico quando
         * fazemos scroll para a frente e para trás.
         */
        const revealOrder = [
          ...letters.keys()
        ].sort((a, b) => {
          const valueA = (a * 7) % letters.length;
          const valueB = (b * 7) % letters.length;

          return valueA - valueB;
        });

        const orderedLetters = revealOrder.map(
          index => letters[index]
        );


        /* ENTRADA */

        diamondTimeline.to(
          orderedLetters,
          {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,

            duration: 0.28,

            stagger: {
              each: 0.035,
            },

            ease: 'power2.out',
          },
          start
        );


        /* SAÍDA */

        diamondTimeline.to(
          orderedLetters.slice().reverse(),
          {
            opacity: 0,
            filter: 'blur(16px)',
            y: -8,

            duration: 0.24,

            stagger: {
              each: 0.025,
            },

            ease: 'power2.in',
          },
          start + 1.05
        );
      };

      animateWord(
        strategyRef.current,
        0.35
      );

      animateWord(
        designRef.current,
        1.95
      );

      animateWord(
        technologyRef.current,
        3.55
      );

      animateWord(
        growthRef.current,
        5.15
      );


      /*
       * Esta é exactamente a lógica central
       * que existe no original:
       *
       * x: 1.5 * Math.PI
       */
      diamondTimeline.to(
        diamond.rotation,
        {
          x: 1.5 * Math.PI,
          duration: 7,
          ease: 'none',
        },
        0
      );


      /*
       * ÚLTIMA PARTE
       *
       * No original:
       *
       * objeto.position.z → 3.2
       *
       * Ou seja, o diamante praticamente entra
       * dentro da câmara.
       */
      diamondTimeline.to(
        diamond.position,
        {
          z: 3.35,
          duration: 1.2,
          ease: 'power2.in',
        },
        7
      );


      /*
       * Reforçamos ligeiramente o efeito com escala.
       * Não substitui o Z; complementa-o.
       */
      diamondTimeline.to(
        diamond.scale,
        {
          x: 1.25,
          y: 1.25,
          z: 1.25,
          duration: 1.2,
          ease: 'power2.in',
        },
        7
      );
      /* =====================================================
   REVEAL DO STUDIO
===================================================== */

if (studioContent) {

  /*
   * Quando o diamante já ocupa o viewport,
   * fazemos desaparecer a intro.
   */
  diamondTimeline.to(
    section,
    {
      autoAlpha: 0,
      duration: 0.22,
      ease: 'none',
    },
    8.0
  );


  /*
   * Simultaneamente revelamos o conteúdo real.
   */
  diamondTimeline.to(
    studioContent,
    {
      opacity: 1,
      y: 0,
      duration: 0.45,
      ease: 'power2.out',
    },
    8.05
  );
}


      /*
       * Muito importante quando Three.js está
       * dentro de elementos pinados.
       */
      ScrollTrigger.refresh();

    }, section);


    return () => {
      ctx.revert();
    };

  }, [diamond]);


  return (
    <section
      ref={sectionRef}
      className="studio-diamond-intro"
      aria-hidden="true"
    >

      {/* =====================================================
          WORDS
      ====================================================== */}

      <div className="studio-diamond-intro__words">
        <AnimatedWord
          word="ESTRATÉGIA"
          wordRef={strategyRef}
        />

        <AnimatedWord
          word="DESIGN"
          wordRef={designRef}
        />

        <AnimatedWord
          word="TECNOLOGIA"
          wordRef={technologyRef}
        />

        <AnimatedWord
          word="CRESCIMENTO"
          wordRef={growthRef}
        />
      </div>


      {/* =====================================================
          THREE
      ====================================================== */}

      <div className="studio-diamond-intro__canvas">
        <Canvas
          camera={{
            position: [0, 0, 5],
            fov: 40,
            near: 0.1,
            far: 1000,
          }}

          dpr={[1, 1.75]}

          gl={{
            antialias: true,
            alpha: true,
          }}

          onCreated={({ gl }) => {
            gl.toneMappingExposure = 1.2;
          }}
        >

          <ambientLight intensity={0.55} />


          <directionalLight
            position={[4, 5, 5]}
            intensity={1.8}
            color="#ff58d6"
          />


          <directionalLight
            position={[-4, -2, 3]}
            intensity={1.2}
            color="#486cff"
          />


          <pointLight
            position={[0, 0, 3]}
            intensity={1.2}
            color="#ff2d78"
          />


          <Suspense fallback={null}>
            <DiamondModel
              onReady={handleDiamondReady}
            />

            <Environment preset="city" />
          </Suspense>

        </Canvas>
      </div>

    </section>
  );
}


useGLTF.preload(
  '/models/diamond/diamond-compressed.glb'
);