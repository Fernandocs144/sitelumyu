import React from 'react';

import Hero from '../components/homepage/Hero/Hero';
import Footer from '../components/Footer';
import SEO from '../components/seo/SEO';
import StructuredData from '../components/seo/StructuredData';

import {
  organizationSchema,
  websiteSchema,
} from '../seo/schema';

export default function Home() {
  return (
    <div
      className="
        lumyo-homepage
        relative
        min-h-screen
        text-white/65
      "
    >
      <SEO
        title="Lumyo — Websites, Automação, IA e Crescimento Digital"
        titleEn="Lumyo — Websites, Automation, AI & Digital Growth"
        description="A Lumyo cria sistemas digitais completos para empresas: websites premium, automação de processos, soluções de inteligência artificial e crescimento digital."
        descriptionEn="Lumyo builds complete digital systems for businesses: premium websites, process automation, artificial intelligence solutions and digital growth."
        path="/"
      />

      <StructuredData data={organizationSchema} />
      <StructuredData data={websiteSchema} />

      {/* ================================================= */}
      {/* HERO                                              */}
      {/* ================================================= */}

      <Hero />

      {/* ================================================= */}
      {/* HOME FOOTER                                       */}
      {/*                                                   */}
      {/* Sobrepõe-se ao último viewport visual do Hero.    */}
      {/* O HeroBackground continua intacto.                */}
      {/* ================================================= */}

      <div
        className="
          relative
          z-20
          -mt-[90vh]
          min-h-screen
          flex
          items-end
          pointer-events-none
        "
      >
        <div
          className="
            w-full
            pointer-events-auto
          "
        >
          <Footer variant="home" />
        </div>
      </div>
    </div>
  );
}