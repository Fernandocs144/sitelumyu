import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SolutionCTA({
  eyebrow,
  title,
  description,
  buttonText,
  buttonTo,
}) {
  return (
    <section className="solution-detail-section solution-detail-cta-section">
      <div className="solution-detail-container">
        <motion.div
          className="solution-detail-cta"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <span className="solution-detail-label">{eyebrow}</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>

          <Link to={buttonTo} className="solution-detail-cta__link">
            {buttonText}
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}