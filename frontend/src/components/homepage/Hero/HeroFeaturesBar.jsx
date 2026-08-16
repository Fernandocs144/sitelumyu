import React from 'react';
import { useLang } from '../../../i18n';

/**
 * HeroFeaturesBar
 *
 * Mobile:
 * - grelha 2 × 2
 * - todos os serviços visíveis
 * - alturas consistentes
 *
 * Desktop:
 * - 4 colunas horizontais
 */
export default function HeroFeaturesBar() {
  const { t } = useLang();
  const h = t.home;

  const blocks = [
    {
      num: '01',
      title: h.solutionLabels?.[0]?.join(' ') || 'WEBSITES PREMIUM',
      desc:
        h.features?.[0]?.d?.[0] ||
        h.servicePremium?.lines?.[0],
    },
    {
      num: '02',
      title: h.solutionLabels?.[1]?.join(' ') || 'AUTOMAÇÃO',
      desc:
        h.features?.[1]?.d?.[0] ||
        h.serviceAutomation?.lines?.[0],
    },
    {
      num: '03',
      title: h.solutionLabels?.[2]?.join(' ') || 'SOLUÇÕES IA',
      desc:
        h.serviceAI?.lines?.[0],
    },
    {
      num: '04',
      title: h.solutionLabels?.[3]?.join(' ') || 'CRESCIMENTO DIGITAL',
      desc:
        h.features?.[2]?.d?.[0],
    },
  ];

 return (
  <div
    data-hero-features-bar
    className="
      relative z-20
      mx-auto
      mt-8
      w-full
      max-w-[1600px]
      px-3
      md:mt-16
      md:px-4
    "
  >
    <div
      className="
        features-bar
        relative
        grid
        grid-cols-4
        overflow-hidden
        rounded-2xl
        border border-white/15
        bg-black/40
        shadow-[0_15px_40px_rgba(0,0,0,0.5)]
        backdrop-blur-xl
      "
    >
      {/* brilho magenta */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-y-0 left-0
          w-12
          bg-gradient-to-r from-magenta/20 to-transparent
          md:w-24
        "
      />

      {/* brilho azul */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-y-0 right-0
          w-12
          bg-gradient-to-l from-electric/20 to-transparent
          md:w-24
        "
      />

      {blocks.map((block, idx) => (
        <div
          key={block.num}
          className={`
            features-bar-col
            relative
            flex
            min-w-0
            flex-col
            px-2
            py-4

            sm:px-3
            md:min-h-[130px]
            md:px-6
            md:py-5

            ${
              idx < blocks.length - 1
                ? 'border-r border-white/10'
                : ''
            }
          `}
        >
          {/* número */}
          <div className="flex items-center justify-between">
            <span
              className="
                font-head
                text-[8px]
                font-bold
                tracking-[0.12em]
                text-magenta

                sm:text-[9px]
                md:text-xs
                md:tracking-[0.25em]
              "
            >
              {block.num}
            </span>

            <span
              aria-hidden="true"
              className="
                h-[3px]
                w-[3px]
                rounded-full
                bg-magenta/70
              "
            />
          </div>

          {/* conteúdo */}
          <div
            className="
              mt-5
              flex
              flex-1
              flex-col
              justify-start

              md:mt-4
            "
          >
            <h4
  className="
    flex
    min-h-[20px]
    items-start
    font-head
    text-[8px]
    font-bold
    uppercase
    leading-[1.25]
    tracking-[-0.01em]
    text-white

    sm:min-h-[23px]
    sm:text-[9px]

    md:min-h-[36px]
    md:text-sm
    md:tracking-wider
  "
>
  {block.title}
</h4>

            <p
              className="
                mt-2
                font-body
                text-[7px]
                leading-[1.4]
                text-white/55

                sm:text-[8px]
                md:text-xs
                md:leading-relaxed
              "
            >
              {block.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);
}