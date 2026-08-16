import React from 'react';

import Hero from '../components/homepage/Hero/Hero';
import Footer from '../components/Footer';


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