import React, { useRef } from 'react';
import './ServiceCardInteractive.css';

const ACCENTS = {
  '01': {
    primary: '255, 20, 95',
    secondary: '230, 38, 255',
  },
  '02': {
    primary: '230, 38, 255',
    secondary: '98, 82, 255',
  },
  '03': {
    primary: '98, 82, 255',
    secondary: '0, 132, 255',
  },
};

export default function ServiceCardInteractive({
  number,
  children,
  enabled = true,
  onClick,
}) {
  const shellRef = useRef(null);
  const frameRef = useRef(null);
  const rafRef = useRef(null);

  const accent = ACCENTS[number] || ACCENTS['01'];

  const updateCard = (event) => {
    if (!enabled || !shellRef.current || !frameRef.current) {
      return;
    }

    const shell = shellRef.current;
    const frame = frameRef.current;
    const rect = shell.getBoundingClientRect();

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const x = mouseX / rect.width;
    const y = mouseY / rect.height;

    const rotateY = (x - 0.5) * 8;
    const rotateX = (0.5 - y) * 8;

    const pointerX = x * 100;
    const pointerY = y * 100;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      frame.style.setProperty(
        '--card-rotate-x',
        `${rotateX}deg`
      );

      frame.style.setProperty(
        '--card-rotate-y',
        `${rotateY}deg`
      );

      frame.style.setProperty(
        '--pointer-x',
        `${pointerX}%`
      );

      frame.style.setProperty(
        '--pointer-y',
        `${pointerY}%`
      );

      frame.style.setProperty(
        '--content-x',
        `${(x - 0.5) * 5}px`
      );

      frame.style.setProperty(
        '--content-y',
        `${(y - 0.5) * 5}px`
      );

      frame.style.setProperty(
        '--icon-x',
        `${(x - 0.5) * 8}px`
      );

      frame.style.setProperty(
        '--icon-y',
        `${(y - 0.5) * 8}px`
      );
    });
  };

  const activateCard = () => {
    if (!enabled || !frameRef.current) {
      return;
    }

    frameRef.current.classList.add('is-interacting');
  };

  const resetCard = () => {
    if (!frameRef.current) {
      return;
    }

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    const frame = frameRef.current;

    frame.classList.remove('is-interacting');

    frame.style.setProperty('--card-rotate-x', '0deg');
    frame.style.setProperty('--card-rotate-y', '0deg');

    frame.style.setProperty('--pointer-x', '50%');
    frame.style.setProperty('--pointer-y', '50%');

    frame.style.setProperty('--content-x', '0px');
    frame.style.setProperty('--content-y', '0px');

    frame.style.setProperty('--icon-x', '0px');
    frame.style.setProperty('--icon-y', '0px');
  };

  return (
    <div
      ref={shellRef}
      className="service-card-interactive-shell"
      onMouseEnter={activateCard}
      onMouseMove={updateCard}
      onMouseLeave={resetCard}
      onClick={onClick}
      style={{
        '--accent-primary': accent.primary,
        '--accent-secondary': accent.secondary,
      }}
    >
      <div
        ref={frameRef}
        className="service-card-interactive-frame"
      >
        <div
          className="service-card-interactive-ambient"
          aria-hidden="true"
        />

        <div
          className="service-card-interactive-inner-light"
          aria-hidden="true"
        />

        <div
          className="service-card-interactive-glow"
          aria-hidden="true"
        />

        <div
          className="service-card-interactive-hologram"
          aria-hidden="true"
        />
        {number === '02' && (
  <div
    className="service-card-automation"
    aria-hidden="true"
  >
    <span className="automation-path automation-path-1" />
    <span className="automation-path automation-path-2" />
    <span className="automation-path automation-path-3" />

    <span className="automation-node automation-node-1" />
    <span className="automation-node automation-node-2" />
    <span className="automation-node automation-node-3" />
    <span className="automation-node automation-node-4" />

    <span className="automation-pulse automation-pulse-1" />
    <span className="automation-pulse automation-pulse-2" />
    <span className="automation-pulse automation-pulse-3" />
  </div>
)}
{number === '03' && (
  <div
    className="service-card-ai"
    aria-hidden="true"
  >
    <span className="ai-orbit ai-orbit-1" />
    <span className="ai-orbit ai-orbit-2" />

    <span className="ai-particle ai-particle-1" />
    <span className="ai-particle ai-particle-2" />
    <span className="ai-particle ai-particle-3" />
    <span className="ai-particle ai-particle-4" />
    <span className="ai-particle ai-particle-5" />
    <span className="ai-particle ai-particle-6" />
    <span className="ai-particle ai-particle-7" />
    <span className="ai-particle ai-particle-8" />
    <span className="ai-particle ai-particle-9" />

    <span className="ai-core">
      <span className="ai-core-inner" />
    </span>
  </div>
)}

        <div
          className="service-card-interactive-glare"
          aria-hidden="true"
        />

        <div className="service-card-interactive-content p-8 md:p-12">
          {children}
        </div>
      </div>
    </div>
  );
}