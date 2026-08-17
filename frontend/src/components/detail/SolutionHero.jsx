import React from 'react';
import { motion } from 'framer-motion';
import './SolutionDetail.css';

export default function SolutionHero({
  number,
  eyebrow,
  title,
  highlight,
  description,
}) {
  return (
    <section className="solution-detail-hero">
      <div className="solution-detail-container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <div className="solution-detail-eyebrow">
            <span>{number}</span>
            <i />
            {eyebrow}
          </div>

          <h1 className="solution-detail-hero__title">
            {title}
            <span>{highlight}</span>
          </h1>
        </motion.div>

        <motion.p
          className="solution-detail-hero__description"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          {description}
        </motion.p>
      </div>
    </section>
  );
}