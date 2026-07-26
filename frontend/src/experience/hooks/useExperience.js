import { useContext } from 'react';
import { ExperienceContext } from '../context/ExperienceContext';

export function useExperience() {
  const context = useContext(ExperienceContext);
  if (!context) {
    throw new Error('useExperience must be used within an ExperienceProvider');
  }
  return context;
}
