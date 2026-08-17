import React from 'react';
import { motion } from 'framer-motion';

export default function SolutionProcess({
  eyebrow,
  title,
  items,
}) {
  return (
    <section className="solution-detail-section">
      <div className="solution-detail-container">
        <span className="solution-detail-label">{eyebrow}</span>
        <h2 className="solution-process__title">{title}</h2>

        <div className="solution-process">
          {items.map((item, index) => (
            <motion.article
              key={item.number}
              className="solution-process__item"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.4,
                delay: index * 0.05,
              }}
            >
              <span>{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}