import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const N = 16000;

// Scroll progress + mouse are shared via module refs (canvas has pointer-events:none).
const scrollRef = { p: 0 };
const mouseRef = { x: 0, y: 0 };

// Soft round sprite for glowing particles
function makeSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, 'rgba(255,255,255,0.85)');
  grd.addColorStop(0.6, 'rgba(255,255,255,0.25)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

// Sample points forming the "LUMYO" wordmark via 2D raster
function buildLogoPoints() {
  const w = 512, h = 128;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff';
  g.font = 'bold 92px "Michroma", Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('LUMYO', w / 2, h / 2 + 4);
  const data = g.getImageData(0, 0, w, h).data;
  const filled = [];
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      if (data[(y * w + x) * 4] > 128) filled.push([x, y]);
    }
  }
  const out = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const p = filled.length ? filled[(i * 7919) % filled.length] : [w / 2, h / 2];
    out[i * 3] = (p[0] / w - 0.5) * 12;
    out[i * 3 + 1] = (0.5 - p[1] / h) * 3;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
  }
  return out;
}

// Sample points on a diamond (bipyramid) surface
function buildDiamondPoints() {
  const top = [0, 2.0, 0];
  const bot = [0, -2.4, 0];
  const mid = [
    [1.6, 0.3, 0], [0, 0.3, 1.6], [-1.6, 0.3, 0], [0, 0.3, -1.6],
  ];
  const faces = [];
  for (let i = 0; i < 4; i++) {
    faces.push([top, mid[i], mid[(i + 1) % 4]]);
    faces.push([bot, mid[(i + 1) % 4], mid[i]]);
  }
  const out = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const f = faces[(Math.random() * faces.length) | 0];
    let a = Math.random(), b = Math.random();
    if (a + b > 1) { a = 1 - a; b = 1 - b; }
    for (let k = 0; k < 3; k++) {
      out[i * 3 + k] = f[0][k] + a * (f[1][k] - f[0][k]) + b * (f[2][k] - f[0][k]);
    }
  }
  return out;
}

function Particles() {
  const pointsRef = useRef();
  const [robot, setRobot] = useState(null);
  const { viewport } = useThree();

  // static per-particle data
  const data = useMemo(() => {
    const logo = buildLogoPoints();
    const diamond = buildDiamondPoints();
    const colors = new Float32Array(N * 3);
    const phase = new Float32Array(N);
    const cIdx = new Uint8Array(N);
    const cU = new Float32Array(N);
    const tubeA = new Float32Array(N);
    const tubeR = new Float32Array(N);
    const pillarBase = new Float32Array(N);
    const galR = new Float32Array(N);
    const galA = new Float32Array(N);
    const galY = new Float32Array(N);
    const galS = new Float32Array(N);

    const cA = new THREE.Color('#ff2d78');
    const cB = new THREE.Color('#a020f0');
    const cC = new THREE.Color('#4b6bff');
    const tmp = new THREE.Color();
    const C = 8;
    for (let i = 0; i < N; i++) {
      const t = i / N;
      if (t < 0.5) tmp.copy(cA).lerp(cB, t / 0.5);
      else tmp.copy(cB).lerp(cC, (t - 0.5) / 0.5);
      colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
      phase[i] = Math.random() * Math.PI * 2;
      cIdx[i] = i % C;
      cU[i] = Math.random();
      tubeA[i] = Math.random() * Math.PI * 2;
      tubeR[i] = Math.random();
      pillarBase[i] = Math.random();
      const r = 1.4 + Math.random() * 5.2;
      galR[i] = r;
      galA[i] = Math.random() * Math.PI * 2;
      galY[i] = (Math.random() - 0.5) * 2.2;
      galS[i] = (0.12 + Math.random() * 0.1) / Math.sqrt(r);
    }
    // cable base params
    const cableBaseY = [], cableAmp = [], cableFreq = [], cableZ = [];
    for (let c = 0; c < C; c++) {
      cableBaseY.push((c / (C - 1) - 0.5) * 3.2);
      cableAmp.push(0.5 + Math.random() * 0.9);
      cableFreq.push(0.8 + Math.random() * 0.8);
      cableZ.push(0.6 + Math.random() * 1.2);
    }
    return { logo, diamond, colors, phase, cIdx, cU, tubeA, tubeR, pillarBase, galR, galA, galY, galS, cableBaseY, cableAmp, cableFreq, cableZ, C };
  }, []);

  const sprite = useMemo(makeSprite, []);

  // load robot point cloud
  useEffect(() => {
    let alive = true;
    fetch('/models/robot_points.bin')
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        if (!alive) return;
        const src = new Float32Array(buf);
        const rob = new Float32Array(N * 3);
        for (let i = 0; i < N * 3; i++) rob[i] = src[i] || 0;
        // orient: model faces +? scale up a touch and lift
        for (let i = 0; i < N; i++) {
          rob[i * 3] *= 1.5;
          rob[i * 3 + 1] = rob[i * 3 + 1] * 1.5 + 0.3;
          rob[i * 3 + 2] *= 1.5;
        }
        setRobot(rob);
      })
      .catch(() => {
        // fallback: sphere
        const rob = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
          const u = Math.random(), v = Math.random();
          const th = 2 * Math.PI * u, ph = Math.acos(2 * v - 1);
          rob[i * 3] = 1.6 * Math.sin(ph) * Math.cos(th);
          rob[i * 3 + 1] = 1.6 * Math.cos(ph) + 0.3;
          rob[i * 3 + 2] = 1.6 * Math.sin(ph) * Math.sin(th);
        }
        setRobot(rob);
      });
    return () => { alive = false; };
  }, []);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(data.colors, 3));
    return g;
  }, [data]);

  // scratch buffers
  const A = useMemo(() => new Float32Array(N * 3), []);
  const B = useMemo(() => new Float32Array(N * 3), []);
  const smoothP = useRef(0);

  const KF = useMemo(() => [
    [0.0, 'robot'], [0.14, 'cables'], [0.52, 'cables'],
    [0.64, 'logo'], [0.78, 'pillars'], [0.9, 'diamond'], [1.0, 'galaxy'],
  ], []);

  const fillScene = useMemo(() => {
    return (type, out, time, progress) => {
      const d = data;
      if (type === 'robot') {
        const rob = robot;
        const breath = 1 + 0.02 * Math.sin(time * 1.1);
        const sway = 0.06 * Math.sin(time * 0.6);
        const OX = 2.7; // keep robot on the right of the hero
        for (let i = 0; i < N; i++) {
          const j = i * 3;
          out[j] = rob[j] * breath + sway + OX;
          out[j + 1] = rob[j + 1] * breath;
          out[j + 2] = rob[j + 2] * breath;
        }
      } else if (type === 'cables') {
        const { cIdx, cU, tubeA, tubeR, cableBaseY, cableAmp, cableFreq, cableZ } = d;
        const bend = (progress - 0.33) * 1.6;
        for (let i = 0; i < N; i++) {
          const c = cIdx[i];
          let tr = (cU[i] + time * 0.05 + c * 0.11) % 1;
          const x = 6.9 - tr * 13.8;
          const y = cableBaseY[c] + Math.sin(tr * 6.283 * cableFreq[c] + c + time * 0.5) * cableAmp[c] + bend * (tr - 0.5) * 2.2;
          const z = Math.cos(tr * 6.283 * cableFreq[c] * 0.7 + c * 1.7 + time * 0.4) * cableZ[c];
          const rr = tubeR[i] * 0.32;
          const j = i * 3;
          out[j] = x + Math.cos(tubeA[i]) * rr * 0.5;
          out[j + 1] = y + Math.sin(tubeA[i]) * rr;
          out[j + 2] = z + Math.sin(tubeA[i] * 1.3) * rr;
        }
      } else if (type === 'logo') {
        const logo = d.logo;
        for (let i = 0; i < N * 3; i++) out[i] = logo[i];
      } else if (type === 'pillars') {
        const { pillarBase } = d;
        for (let i = 0; i < N; i++) {
          const p = i % 4;
          const px = (p - 1.5) * 3.1;
          let tr = (pillarBase[i] + time * 0.14) % 1;
          const j = i * 3;
          out[j] = px + Math.sin(time * 2 + i) * 0.04 + (pillarBase[i] - 0.5) * 0.5;
          out[j + 1] = -2.6 + tr * 5.2;
          out[j + 2] = Math.cos(i * 1.7) * 0.4;
        }
      } else if (type === 'diamond') {
        const dia = d.diamond;
        for (let i = 0; i < N * 3; i++) out[i] = dia[i];
      } else if (type === 'galaxy') {
        const { galR, galA, galY, galS, diamond } = d;
        const core = 2200;
        for (let i = 0; i < N; i++) {
          const j = i * 3;
          if (i < core) {
            out[j] = diamond[j] * 0.42;
            out[j + 1] = diamond[j + 1] * 0.42;
            out[j + 2] = diamond[j + 2] * 0.42;
          } else {
            const r = galR[i];
            const a = galA[i] + time * galS[i];
            out[j] = Math.cos(a) * r;
            out[j + 1] = galY[i] / (1 + r * 0.14);
            out[j + 2] = Math.sin(a) * r;
          }
        }
      }
    };
  }, [data, robot]);

  useFrame((state) => {
    if (!robot || !pointsRef.current) return;
    const time = state.clock.elapsedTime;
    // smooth scroll progress
    smoothP.current += (scrollRef.p - smoothP.current) * 0.08;
    const p = smoothP.current;

    // find segment
    let seg = 0;
    for (let k = 0; k < KF.length - 1; k++) {
      if (p >= KF[k][0] && p <= KF[k + 1][0]) { seg = k; break; }
      if (p > KF[KF.length - 1][0]) seg = KF.length - 2;
    }
    const a0 = KF[seg][0], a1 = KF[seg + 1][0];
    let lt = (p - a0) / (a1 - a0 || 1);
    lt = Math.max(0, Math.min(1, lt));
    lt = lt * lt * (3 - 2 * lt); // smoothstep
    const typeA = KF[seg][1], typeB = KF[seg + 1][1];

    fillScene(typeA, A, time, p);
    if (typeB === typeA) B.set(A);
    else fillScene(typeB, B, time, p);

    // influences
    const robotInfl = (typeA === 'robot' ? 1 - lt : 0) + (typeB === 'robot' ? lt : 0);
    const galInfl = (typeA === 'galaxy' ? 1 - lt : 0) + (typeB === 'galaxy' ? lt : 0);
    const pillarInfl = (typeA === 'pillars' ? 1 - lt : 0) + (typeB === 'pillars' ? lt : 0);

    const mwx = mouseRef.x * (viewport.width / 2);
    const mwy = mouseRef.y * (viewport.height / 2);
    const repelR2 = 4.0;

    const pos = pointsRef.current.geometry.attributes.position.array;
    const ph = data.phase;
    for (let i = 0; i < N; i++) {
      const j = i * 3;
      let x = A[j] + (B[j] - A[j]) * lt;
      let y = A[j + 1] + (B[j + 1] - A[j + 1]) * lt;
      let z = A[j + 2] + (B[j + 2] - A[j + 2]) * lt;
      // living shimmer
      x += Math.sin(time * 1.4 + ph[i]) * 0.014;
      y += Math.cos(time * 1.2 + ph[i]) * 0.014;
      // robot: particles move away from cursor
      if (robotInfl > 0.01) {
        const dx = x - mwx, dy = y - mwy;
        const d2 = dx * dx + dy * dy;
        if (d2 < repelR2) {
          const f = (1 - d2 / repelR2) * robotInfl * 0.9;
          x += dx * f; y += dy * f;
        }
      }
      // pillars: hover agitation near cursor column
      if (pillarInfl > 0.01) {
        const px = ((i % 4) - 1.5) * 3.1;
        if (Math.abs(mwx - px) < 1.6) {
          x += Math.sin(time * 6 + i) * 0.12 * pillarInfl;
          z += Math.cos(time * 5 + i) * 0.12 * pillarInfl;
        }
      }
      // galaxy: subtle gravitational disturbance
      if (galInfl > 0.01) {
        x += (mwx - x) * 0.015 * galInfl;
        y += (mwy - y) * 0.015 * galInfl;
      }
      pos[j] = x; pos[j + 1] = y; pos[j + 2] = z;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    // gentle overall rotation for depth
    pointsRef.current.rotation.y = Math.sin(time * 0.05) * 0.12 + (galInfl * time * 0.05);
  });

  if (!robot) return null;

  return (
    <points ref={pointsRef} geometry={geom}>
      <pointsMaterial
        size={0.075}
        map={sprite}
        vertexColors
        transparent
        opacity={0.92}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

export default function CinematicScene() {
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };
    const onMouse = (e) => {
      mouseRef.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouse, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" data-testid="cinematic-scene">
      <Canvas
        camera={{ position: [0, 0, 9], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Particles />
      </Canvas>
    </div>
  );
}
