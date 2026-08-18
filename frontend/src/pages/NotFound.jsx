import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/seo/SEO';

export default function NotFound() {
  return (
    <>
      <SEO
        title="Página não encontrada | Lumyo"
        description="A página que procuras não existe ou foi movida."
        robots="noindex, nofollow"
      />

      <section className="min-h-[70vh] flex items-center justify-center px-6 pt-32 pb-20">
        <div className="max-w-3xl text-center">
          <div className="font-mono text-xs tracking-[0.35em] text-[#ff1f8f] mb-6">
            ERRO 404
          </div>

          <h1 className="text-5xl md:text-7xl font-display text-white mb-6">
            Página não encontrada.
          </h1>

          <p className="text-white/60 text-lg mb-10">
            A página que procuras não existe ou foi movida.
          </p>

          <Link
            to="/"
            className="inline-flex items-center justify-center px-8 py-4 border border-[#ff1f8f] text-white uppercase tracking-[0.2em] text-xs hover:bg-[#ff1f8f] transition-colors"
          >
            Voltar ao início
          </Link>
        </div>
      </section>
    </>
  );
}