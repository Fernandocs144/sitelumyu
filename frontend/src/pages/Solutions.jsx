import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Settings, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../i18n';
import ParticleField from '../components/ParticleField';
import SolutionCard from '../components/solutions/SolutionCard/SolutionCard';
import SEO from '../components/seo/SEO';
const icons = [Globe, Settings, Sparkles, TrendingUp];
const solutionRoutes = [
  '/solutions/websites',
  '/solutions/automation',
  '/solutions/ai',
  '/solutions/growth',
];

export default function Solutions() {
  const { t } = useLang();
  const navigate = useNavigate();

  return (
    <div className="page-enter section-bg relative min-h-screen overflow-hidden pt-40 pb-28">
      <SEO
  title="Soluções Digitais para Empresas"
  titleEn="Digital Solutions for Businesses"
  description="Websites premium, automação, inteligência artificial e crescimento digital integrados num sistema pensado para ajudar empresas a operar melhor e crescer."
  descriptionEn="Premium websites, automation, artificial intelligence and digital growth integrated into systems designed to help businesses operate better and grow."
  path="/solutions"
/>
      <ParticleField count={40} />
      <div className="relative z-10 mx-auto max-w-[1600px] px-6 md:px-10">
        <p className="font-head text-sm tracking-mega text-magenta">
          {t.common.ourSolutions}
        </p>
        <h1 className="mt-6 max-w-3xl font-head text-4xl font-bold leading-tight text-white md:text-6xl">
          {t.solutions.heading}
        </h1>

        <div
          className="
            mt-16
            grid
            grid-cols-1
            gap-6
            md:grid-cols-2
            md:gap-8
          "
        >
          {t.solutions.items.map((service, index) => {
            const Icon = icons[index];
            const number = String(index + 1).padStart(2, '0');

            return (
              <motion.div
                key={service.title || index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.08,
                }}
                className="h-full"
                data-testid={`solution-detail-${number}`}
              >
                <SolutionCard
                  number={number}
                  onClick={() => navigate(solutionRoutes[index])}
                >
                  <div className="flex h-full flex-col">
                    <div className="flex items-start justify-between">
                      {Icon && (
                        <Icon
                          className="
                            solution-card-icon
                            h-9
                            w-9
                            text-magenta
                            md:h-10
                            md:w-10
                          "
                          strokeWidth={1.4}
                        />
                      )}

                      <span
                        className="
                          font-display
                          text-4xl
                          text-magenta/20
                          md:text-5xl
                        "
                      >
                        {number}
                      </span>
                    </div>

                    <div className="mt-7 md:mt-8">
                      <h2
                        className="
                          font-head
                          text-2xl
                          font-semibold
                          leading-tight
                          text-white
                          md:text-3xl
                        "
                      >
                        {service.title}
                      </h2>

                      <div
                        className="
                          mt-4
                          space-y-1
                          font-body
                          text-sm
                          text-magenta/80
                          md:text-base
                        "
                      >
                        {service.lines.map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                      </div>

                      <p
                        className="
                          mt-5
                          max-w-xl
                          font-body
                          text-sm
                          leading-[1.75]
                          text-white/55
                          md:text-base
                        "
                      >
                        {service.body}
                      </p>

                      <div
                        className="
                          mt-6
                          inline-flex
                          items-center
                          gap-3
                          font-head
                          text-[10px]
                          tracking-[0.25em]
                          text-white/65
                        "
                      >
                        EXPLORAR
                        <ArrowRight
                          className="
                            h-4
                            w-4
                            text-magenta
                          "
                        />
                      </div>
                    </div>
                  </div>
                </SolutionCard>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-20 text-center">
          <Link
            to="/contact"
            data-testid="solutions-cta"
            className="pill-btn inline-flex items-center gap-4 rounded-full border border-magenta px-8 py-4 font-head text-sm tracking-[0.3em] text-white"
          >
            {t.common.startProject} <ArrowRight className="h-4 w-4 text-magenta" />
          </Link>
        </div>
      </div>
    </div>
  );
}