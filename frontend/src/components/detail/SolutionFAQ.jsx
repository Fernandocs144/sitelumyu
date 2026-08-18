import React from 'react';
import { motion } from 'framer-motion';

export default function SolutionFAQ({ eyebrow, title, items = [] }) {
  if (!items.length) return null;

  return (
    <section className="relative py-20 md:py-28">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10">

        <div className="max-w-3xl">
          <p className="font-head text-xs tracking-mega text-magenta md:text-sm">
            {eyebrow}
          </p>

          <h2 className="mt-5 font-head text-3xl font-semibold leading-tight text-white md:text-5xl">
            {title}
          </h2>
        </div>

        <div className="mt-12 border-t border-white/10">
          {items.map((item, index) => (
            <motion.div
              key={item.question}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.45,
                delay: index * 0.06,
              }}
              className="grid gap-4 border-b border-white/10 py-8 md:grid-cols-[0.8fr_1.2fr] md:gap-12 md:py-10"
            >
              <h3 className="font-head text-base font-medium leading-relaxed text-white md:text-lg">
                {item.question}
              </h3>

              <p className="font-body text-base leading-relaxed text-white/55 md:text-lg">
                {item.answer}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}