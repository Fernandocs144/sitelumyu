import React, { useEffect, useRef } from 'react';
import './SolutionCard.css';

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
  '04': {
    primary: '0, 132, 255',
    secondary: '98, 82, 255',
  },
};

export default function SolutionCard({
  number = '01',
  children,
  onClick,
  className = '',
}) {
  const cardRef = useRef(null);
  const frameRef = useRef(null);

  const accent = ACCENTS[number] || ACCENTS['01'];

  useEffect(() => {
    const card = cardRef.current;

    if (!card) return undefined;

    const handlePointerMove = (event) => {
      // Não aplicamos tilt em touch.
      if (event.pointerType === 'touch') return;

      const rect = card.getBoundingClientRect();

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const percentX = Math.max(
        0,
        Math.min(1, x / rect.width)
      );

      const percentY = Math.max(
        0,
        Math.min(1, y / rect.height)
      );

      const rotateY = (percentX - 0.5) * 10;
      const rotateX = (0.5 - percentY) * 10;

      const contentX = (percentX - 0.5) * 8;
      const contentY = (percentY - 0.5) * 8;

      const iconX = (percentX - 0.5) * 14;
      const iconY = (percentY - 0.5) * 14;

      cancelAnimationFrame(frameRef.current);

      frameRef.current = requestAnimationFrame(() => {
        card.style.setProperty(
          '--mouse-x',
          `${percentX * 100}%`
        );

        card.style.setProperty(
          '--mouse-y',
          `${percentY * 100}%`
        );

        card.style.setProperty(
          '--rotate-x',
          `${rotateX}deg`
        );

        card.style.setProperty(
          '--rotate-y',
          `${rotateY}deg`
        );

        card.style.setProperty(
          '--content-x',
          `${contentX}px`
        );

        card.style.setProperty(
          '--content-y',
          `${contentY}px`
        );

        card.style.setProperty(
          '--icon-x',
          `${iconX}px`
        );

        card.style.setProperty(
          '--icon-y',
          `${iconY}px`
        );
      });
    };

    const handlePointerEnter = (event) => {
      if (event.pointerType === 'touch') return;

      card.classList.add('is-interacting');
    };

    const handlePointerLeave = () => {
      cancelAnimationFrame(frameRef.current);

      card.classList.remove('is-interacting');

      card.style.setProperty('--mouse-x', '50%');
      card.style.setProperty('--mouse-y', '50%');

      card.style.setProperty('--rotate-x', '0deg');
      card.style.setProperty('--rotate-y', '0deg');

      card.style.setProperty('--content-x', '0px');
      card.style.setProperty('--content-y', '0px');

      card.style.setProperty('--icon-x', '0px');
      card.style.setProperty('--icon-y', '0px');
    };

    card.addEventListener(
      'pointermove',
      handlePointerMove
    );

    card.addEventListener(
      'pointerenter',
      handlePointerEnter
    );

    card.addEventListener(
      'pointerleave',
      handlePointerLeave
    );

    return () => {
      cancelAnimationFrame(frameRef.current);

      card.removeEventListener(
        'pointermove',
        handlePointerMove
      );

      card.removeEventListener(
        'pointerenter',
        handlePointerEnter
      );

      card.removeEventListener(
        'pointerleave',
        handlePointerLeave
      );
    };
  }, []);

  const handleClick = () => {
    if (typeof onClick === 'function') {
      onClick();
    }
  };

  const handleKeyDown = (event) => {
    if (!onClick) return;

    if (
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <article
      ref={cardRef}
      className={`solution-card ${className}`}
      style={{
        '--accent-primary': accent.primary,
        '--accent-secondary': accent.secondary,
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      data-solution-card={number}
    >
      <div className="solution-card__ambient" />

      <div className="solution-card__border-glow" />

      <div className="solution-card__inner-light" />

      {number === '02' && (
        <div
          className="solution-card__automation"
          aria-hidden="true"
        >
          <span className="solution-card__automation-line solution-card__automation-line--1" />
          <span className="solution-card__automation-line solution-card__automation-line--2" />
          <span className="solution-card__automation-line solution-card__automation-line--3" />

          <span className="solution-card__automation-node solution-card__automation-node--1" />
          <span className="solution-card__automation-node solution-card__automation-node--2" />
          <span className="solution-card__automation-node solution-card__automation-node--3" />
        </div>
      )}

      {number === '03' && (
        <div
          className="solution-card__ai"
          aria-hidden="true"
        >
          <span className="solution-card__ai-orbit solution-card__ai-orbit--1" />
          <span className="solution-card__ai-orbit solution-card__ai-orbit--2" />
          <span className="solution-card__ai-core" />
        </div>
      )}

      {number === '04' && (
        <div
          className="solution-card__growth"
          aria-hidden="true"
        >
          <span className="solution-card__growth-line solution-card__growth-line--1" />
          <span className="solution-card__growth-line solution-card__growth-line--2" />
          <span className="solution-card__growth-line solution-card__growth-line--3" />
        </div>
      )}

      <div className="solution-card__content">
        {children}
      </div>
    </article>
  );
}