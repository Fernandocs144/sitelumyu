import React from 'react';
import { motion } from 'framer-motion';

export default function SolutionCapabilities({
  eyebrow,
  title,
  description,
  items,
}) {
  return (
    <section className="solution-detail-section">
      <div className="solution-detail-container">
        <div className="solution-detail-section__header">
          <div>
            <span className="solution-detail-label">{eyebrow}</span>
            <h2>{title}</h2>
          </div>

          <p>{description}</p>
        </div>

        <div className="solution-capabilities">
          {items.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.article
                key={item.number}
                className="solution-capability"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.04,
                }}
              >
                <div className="solution-capability__top">
                  <Icon strokeWidth={1.4} />
                  <span>{item.number}</span>
                </div>

                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}