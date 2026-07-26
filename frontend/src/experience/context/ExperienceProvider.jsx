import React, { useEffect, useMemo, useRef } from 'react';
import { ExperienceContext } from './ExperienceContext';
import { ExperienceEngine } from '../core/ExperienceEngine';

/**
 * React integration layer for the Experience Engine.
 * Provides a single engine instance to the component tree.
 */
export function ExperienceProvider({ children }) {
  const engineRef = useRef(null);

  if (!engineRef.current) {
    engineRef.current = new ExperienceEngine();
  }

  useEffect(() => {
    const engine = engineRef.current;
    engine.init();
    return () => engine.dispose();
  }, []);

  const value = useMemo(() => ({ engine: engineRef.current }), []);

  return (
    <ExperienceContext.Provider value={value}>
      {children}
    </ExperienceContext.Provider>
  );
}
