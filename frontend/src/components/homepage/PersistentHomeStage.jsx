import React, { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  Settings,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Check,
  Send,
  CheckCircle2,
  ExternalLink,
  Layers,
  Zap,
  Brain,
  ShieldCheck,
} from 'lucide-react';
import { useLang } from '../../i18n';
import { createPersistentHomeExperience } from './PersistentHomeTimeline';

/**
 * PersistentHomeStage — Continuous Editorial Stage for Post-Hero Homepage.
 *
 * Architecture:
 * - ONE HERO. ONE VISUAL WORLD. ONE CONTINUOUS SCROLL EXPERIENCE.
 * - Pinned desktop stage driven by a single global GSAP ScrollTrigger timeline.
 * - Asymmetric editorial composition for each moment (Services 01/02/03, Capabilities, Selected Work, Positioning, Why Lumyo, Business Approach, Contact).
 * - Zero fake brand names, zero fake metrics.
 * - Clean mobile vertical layout fallback for responsive clarity.
 */
export default function PersistentHomeStage() {
  const { t } = useLang();
  const h = t.home;
  const c = t.contact;

  const triggerRef = useRef(null);
  const stageRef = useRef(null);

  // Moment Refs for GSAP Global Timeline
  const srv1Ref = useRef(null);
  const srv2Ref = useRef(null);
  const srv3Ref = useRef(null);
  const capabRef = useRef(null);
  const workRef = useRef(null);
  const posRef = useRef(null);
  const whyRef = useRef(null);
  const bizRef = useRef(null);
  const contactRef = useRef(null);
  const bgOrb1Ref = useRef(null);
  const bgOrb2Ref = useRef(null);

  // Integrated Contact Form State
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    service: 'Website Premium',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formState.name || !formState.email) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 800);
  };

  useLayoutEffect(() => {
    if (!triggerRef.current || !stageRef.current) return;

    // Only run GSAP pinning timeline on desktop (width >= 1024px)
    if (window.innerWidth < 1024) return;

    const momentsRef = {
      srv1: srv1Ref.current,
      srv2: srv2Ref.current,
      srv3: srv3Ref.current,
      capab: capabRef.current,
      work: workRef.current,
      pos: posRef.current,
      why: whyRef.current,
      biz: bizRef.current,
      contact: contactRef.current,
      bgOrb1: bgOrb1Ref.current,
      bgOrb2: bgOrb2Ref.current,
    };

    const timeline = createPersistentHomeExperience(
      triggerRef.current,
      stageRef.current,
      momentsRef
    );

    return () => {
      if (timeline) timeline.kill();
    };
  }, []);

  // Services Data
  const servicesList = [
    {
      num: '01',
      icon: Globe,
      title: h.servicePremium?.title || 'WEBSITES PREMIUM',
      sub: h.servicePremium?.lines?.[0] || 'Designed to impress. Engineered to convert. Built to grow.',
      lines: h.servicePremium?.lines || ['Feitos para impressionar.', 'Otimizados para converter.', 'Criados para crescer.'],
      features: ['Design personalizado pixel a pixel', 'Otimização para taxa de conversão', 'Desempenho e velocidade máxima'],
    },
    {
      num: '02',
      icon: Settings,
      title: h.serviceAutomation?.title || 'AUTOMAÇÃO',
      sub: h.serviceAutomation?.lines?.[0] || 'Less repetitive work. More productivity. More time to grow.',
      lines: h.serviceAutomation?.lines || ['Menos trabalho repetitivo.', 'Mais produtividade.', 'Mais tempo para crescer.'],
      features: ['Mapeamento de workflows complexos', 'Integração de sistemas & APIs', 'Eliminação de tarefas manuais'],
    },
    {
      num: '03',
      icon: Sparkles,
      title: h.serviceAI?.title || 'INTELIGÊNCIA ARTIFICIAL',
      sub: h.serviceAI?.lines?.[0] || 'AI assistants. Intelligent workflows. Real business impact.',
      lines: h.serviceAI?.lines || ['Assistentes de IA.', 'Fluxos inteligentes.', 'Impacto real no negócio.'],
      features: ['Assistentes virtuais à medida', 'Processamento inteligente de dados', 'Soluções integradas nas operações'],
    },
  ];

  // Capabilities Data
  const capabilitiesColumns = [
    {
      num: '01',
      icon: Globe,
      title: 'WEBSITES PREMIUM',
      glowColor: 'from-magenta/20 to-transparent border-magenta/30',
      textColor: 'text-magenta',
      items: h.cylinderDetails?.[0] || ['Design personalizado', 'Design responsivo', 'Alto desempenho', 'Segurança e fiabilidade'],
    },
    {
      num: '02',
      icon: Settings,
      title: 'AUTOMAÇÃO',
      glowColor: 'from-violet/20 to-transparent border-violet/30',
      textColor: 'text-violet',
      items: h.cylinderDetails?.[1] || ['Automação de workflows', 'Automação de tarefas', 'Integração de sistemas', 'Optimização de processos'],
    },
    {
      num: '03',
      icon: Sparkles,
      title: 'SOLUÇÕES IA',
      glowColor: 'from-blue-500/20 to-transparent border-blue-500/30',
      textColor: 'text-blue-400',
      items: h.cylinderDetails?.[2] || ['Estratégia e consultoria IA', 'Machine Learning', 'Assistentes e chatbots IA', 'Análise de dados e insights'],
    },
    {
      num: '04',
      icon: TrendingUp,
      title: 'CRESCIMENTO DIGITAL',
      glowColor: 'from-cyan-500/20 to-transparent border-cyan-500/30',
      textColor: 'text-cyan-400',
      items: h.cylinderDetails?.[3] || ['Optimização SEO', 'Marketing digital', 'Analytics e tracking', 'Estratégia de crescimento'],
    },
  ];

  // Selected Work Items (Clean structural placeholders — zero fake brands, zero fake metrics)
  const selectedWorkItems = [
    {
      tag: 'WEBSITE PREMIUM',
      title: 'SISTEMA WEB 01',
      result: 'SISTEMA DIGITAL',
      desc: 'Arquitetura e desenvolvimento web de alto desempenho — desenhado para velocidade, clareza e conversão.',
      accent: 'border-magenta/40 hover:border-magenta shadow-[0_0_30px_rgba(255,45,120,0.15)]',
    },
    {
      tag: 'AUTOMAÇÃO IA',
      title: 'SISTEMA IA 02',
      result: 'AUTOMAÇÃO DE PROCESSO',
      desc: 'Geração de orçamentos e fluxos operacionais automatizados com assistentes inteligentes à medida.',
      accent: 'border-violet/40 hover:border-violet shadow-[0_0_30px_rgba(155,36,230,0.15)]',
    },
    {
      tag: 'CRESCIMENTO DIGITAL',
      title: 'SISTEMA CRESCIMENTO 03',
      result: 'AQUISIÇÃO DE DADOS',
      desc: 'Sistema de aquisição orientado por dados que liga anúncios, CRM e analítica num só ciclo.',
      accent: 'border-cyan-500/40 hover:border-cyan-500 shadow-[0_0_30px_rgba(0,212,255,0.15)]',
    },
  ];

  const whyPillars = h.whyLumyo?.pillars || [
    { num: '01', title: 'STRATEGY', desc: 'Estratégia clara focada em objetivos de negócio e resultados mensuráveis.' },
    { num: '02', title: 'DESIGN', desc: 'Design premium personalizado sem templates, desenhado pixel a pixel.' },
    { num: '03', title: 'DEVELOPMENT', desc: 'Engenharia limpa, escalável e de alto desempenho.' },
    { num: '04', title: 'INTELLIGENCE', desc: 'Automação e inteligência artificial integradas no núcleo das operações.' },
  ];

  return (
    <div
      ref={triggerRef}
      data-testid="persistent-home-container"
      className="relative w-full bg-ink text-white"
    >
      {/* =========================================================
          DESKTOP PERSISTENT VISUAL STAGE (Pinned Container >= 1024px)
          ========================================================= */}
      <div
        ref={stageRef}
        data-testid="persistent-home-stage"
        className="hidden lg:flex relative min-h-screen w-full flex-col justify-center overflow-hidden"
      >
        {/* Persistent Lighting Background Stage */}
        <div
          ref={bgOrb1Ref}
          className="pointer-events-none absolute left-1/4 top-1/4 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-radial-magenta opacity-25 blur-3xl transition-transform duration-1000"
        />
        <div
          ref={bgOrb2Ref}
          className="pointer-events-none absolute right-1/4 bottom-1/4 h-[550px] w-[550px] translate-x-1/2 translate-y-1/2 rounded-full bg-radial-violet opacity-20 blur-3xl transition-transform duration-1000"
        />

        <div className="relative z-10 mx-auto w-full max-w-[1500px] px-12">

          {/* ─── MOMENT 01-A: Service 01 (Premium Websites) ─── */}
          <div
            ref={srv1Ref}
            className="absolute inset-0 flex flex-col justify-center px-12"
          >
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <span className="font-head text-xs tracking-[0.3em] text-magenta">02 / SERVIÇOS</span>
                <span className="h-px w-12 bg-magenta/60" />
              </div>
              <h2 className="mt-4 font-head text-5xl font-extrabold text-white tracking-tight leading-tight">
                01. PREMIUM WEBSITES
              </h2>
              <p className="mt-3 font-head text-sm font-medium tracking-wider text-magenta">
                Designed to impress. Engineered to convert. Built to grow.
              </p>
              <p className="mt-6 font-body text-lg leading-relaxed text-white/70">
                Websites de alto desempenho e focados em conversão, criados pixel a pixel — sem templates, apenas sistemas digitais à medida que refletem a sua marca.
              </p>
              <div className="mt-8 flex items-center gap-8">
                <div className="flex items-center gap-3 font-body text-sm text-white/80">
                  <Check className="h-4 w-4 text-magenta" />
                  <span>Design personalizado</span>
                </div>
                <div className="flex items-center gap-3 font-body text-sm text-white/80">
                  <Check className="h-4 w-4 text-magenta" />
                  <span>Otimizado para conversão</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── MOMENT 01-B: Service 02 (Automation) ─── */}
          <div
            ref={srv2Ref}
            className="absolute inset-0 flex flex-col justify-center items-end px-12 text-right"
          >
            <div className="max-w-2xl text-left">
              <div className="flex items-center gap-3">
                <span className="font-head text-xs tracking-[0.3em] text-violet">02 / SERVIÇOS</span>
                <span className="h-px w-12 bg-violet/60" />
              </div>
              <h2 className="mt-4 font-head text-5xl font-extrabold text-white tracking-tight leading-tight">
                02. AUTOMAÇÃO
              </h2>
              <p className="mt-3 font-head text-sm font-medium tracking-wider text-violet">
                Less repetitive work. More productivity. More time to grow.
              </p>
              <p className="mt-6 font-body text-lg leading-relaxed text-white/70">
                Mapeamos os seus processos e automatizamos o trabalho repetitivo, para a sua equipa focar no que realmente faz o negócio avançar.
              </p>
              <div className="mt-8 flex items-center gap-8">
                <div className="flex items-center gap-3 font-body text-sm text-white/80">
                  <Check className="h-4 w-4 text-violet" />
                  <span>Workflows inteligentes</span>
                </div>
                <div className="flex items-center gap-3 font-body text-sm text-white/80">
                  <Check className="h-4 w-4 text-violet" />
                  <span>Integração de sistemas</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── MOMENT 01-C: Service 03 (AI Solutions) ─── */}
          <div
            ref={srv3Ref}
            className="absolute inset-0 flex flex-col justify-center items-center px-12 text-center"
          >
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-3 mb-4">
                <span className="h-px w-8 bg-blue-400/60" />
                <span className="font-head text-xs tracking-[0.3em] text-blue-400">02 / SERVIÇOS</span>
                <span className="h-px w-8 bg-blue-400/60" />
              </div>
              <h2 className="font-head text-5xl font-extrabold text-white tracking-tight leading-tight">
                03. INTELIGÊNCIA ARTIFICIAL
              </h2>
              <p className="mt-3 font-head text-sm font-medium tracking-wider text-blue-400">
                AI assistants. Intelligent workflows. Real business impact.
              </p>
              <p className="mt-6 font-body text-lg leading-relaxed text-white/70">
                Assistentes virtuais e sistemas inteligentes à medida, integrados diretamente nas suas operações para resultados reais e mensuráveis.
              </p>
              <div className="mt-8 inline-flex items-center gap-4">
                <Link to="/solutions" className="pill-btn px-6 py-3">
                  <span className="font-head text-xs tracking-[0.25em] text-white">VER SOLUÇÕES COMPLETAS</span>
                  <ArrowRight className="h-4 w-4 text-magenta" />
                </Link>
              </div>
            </div>
          </div>

          {/* ─── MOMENT 02: Capabilities Editorial Matrix ─── */}
          <div
            ref={capabRef}
            className="absolute inset-0 flex flex-col justify-center px-12"
          >
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className="font-head text-xs tracking-[0.3em] text-magenta">03 / CAPACIDADES</span>
              <h2 className="mt-3 font-head text-4xl font-bold text-white">
                Matriz Completa de Desenvolvimento & Estratégia
              </h2>
            </div>
            <div className="grid grid-cols-4 gap-6">
              {capabilitiesColumns.map((col) => {
                const Icon = col.icon;
                return (
                  <div
                    key={col.num}
                    className={`rounded-2xl border bg-gradient-to-b ${col.glowColor} p-6 backdrop-blur-md`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={`h-6 w-6 ${col.textColor}`} strokeWidth={1.4} />
                      <span className="font-head text-xs tracking-[0.2em] text-white/40">{col.num}</span>
                    </div>
                    <h4 className="mt-4 font-head text-base font-bold text-white">
                      {col.title}
                    </h4>
                    <ul className="mt-4 space-y-2 font-body text-xs text-white/65">
                      {col.items.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-magenta/70" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── MOMENT 03: Selected Work (Structural Neutral Showcase) ─── */}
          <div
            ref={workRef}
            className="absolute inset-0 flex flex-col justify-center px-12"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="font-head text-xs tracking-[0.3em] text-magenta">04 / PROJETOS SELECIONADOS</span>
                <h2 className="mt-2 font-head text-3xl font-bold text-white">Sistemas Reais com Impacto no Negócio</h2>
              </div>
              <Link to="/case-studies" className="font-head text-xs tracking-[0.25em] text-magenta hover:underline flex items-center gap-2">
                TODOS OS PROJETOS <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {selectedWorkItems.map((item) => (
                <div
                  key={item.title}
                  className={`rounded-2xl border bg-white/[0.03] p-6 backdrop-blur-md transition-all duration-300 ${item.accent}`}
                >
                  <span className="font-head text-[10px] tracking-[0.2em] text-magenta">{item.tag}</span>
                  <h3 className="mt-4 font-head text-xl font-bold text-white">{item.title}</h3>
                  <div className="mt-2 inline-block rounded-full bg-magenta/15 px-3 py-1 font-head text-[11px] text-magenta border border-magenta/30">
                    {item.result}
                  </div>
                  <p className="mt-4 font-body text-xs text-white/65 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ─── MOMENT 04: Lumyo Positioning (Massive Asymmetric Typography) ─── */}
          <div
            ref={posRef}
            className="absolute inset-0 flex flex-col justify-center items-center px-12 text-center"
          >
            <div className="max-w-5xl">
              <span className="font-head text-xs tracking-[0.3em] text-magenta mb-6 block">05 / POSICIONAMENTO</span>
              <h2 className="font-head text-4xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
                {h.positioning?.heading || 'NÃO CONSTRUÍMOS APENAS PRODUTOS DIGITAIS.'}
              </h2>
              <div className="mt-4 font-head text-4xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-magenta via-pink-400 to-violet leading-[1.1] tracking-tight drop-shadow-[0_0_35px_rgba(255,45,120,0.35)]">
                {h.positioning?.subheading || 'CONSTRUÍMOS O QUE O SEU NEGÓCIO PRECISA.'}
              </div>
              <p className="mt-8 mx-auto max-w-2xl font-body text-base text-white/60">
                {h.positioning?.desc || 'Websites premium, automação e inteligência artificial integrados numa única visão estratégica.'}
              </p>
            </div>
          </div>

          {/* ─── MOMENT 05: Why Lumyo (4 Pillars) ─── */}
          <div
            ref={whyRef}
            className="absolute inset-0 flex flex-col justify-center px-12"
          >
            <div className="mb-10 text-center">
              <span className="font-head text-xs tracking-[0.3em] text-magenta">06 / PORQUÊ A LUMYO</span>
              <h2 className="mt-3 font-head text-4xl font-bold text-white">Quatro Pilares de Engenharia e Design</h2>
            </div>
            <div className="grid grid-cols-4 gap-6">
              {whyPillars.map((p) => (
                <div key={p.num} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md">
                  <span className="font-head text-xl font-bold text-magenta">{p.num}</span>
                  <h3 className="mt-3 font-head text-lg font-bold text-white">{p.title}</h3>
                  <p className="mt-3 font-body text-xs text-white/65 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ─── MOMENT 06: Business Approach Statement ─── */}
          <div
            ref={bizRef}
            className="absolute inset-0 flex flex-col justify-center items-center px-12 text-center"
          >
            <div className="max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-12 backdrop-blur-xl">
              <div className="font-head text-xs tracking-[0.3em] text-magenta mb-4">MÉTODO LUMYO</div>
              <h2 className="font-head text-3xl font-bold text-white leading-snug">
                Sistemas digitais integrados para gerar valor duradouro ao seu negócio.
              </h2>
              <p className="mt-6 font-body text-sm text-white/65 leading-relaxed">
                Combinamos estratégia comercial, engenharia de alto desempenho, automação de processos e inteligência artificial para que a sua empresa lidere no mercado digital.
              </p>
            </div>
          </div>

          {/* ─── MOMENT 07: Integrated Contact Scene ─── */}
          <div
            ref={contactRef}
            className="absolute inset-0 flex flex-col justify-center px-12"
          >
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-10 backdrop-blur-xl">
              <div className="grid grid-cols-12 gap-8 items-center">
                <div className="col-span-5">
                  <span className="font-head text-xs tracking-[0.3em] text-magenta">07 / CONTACTO</span>
                  <h2 className="mt-4 font-head text-3xl font-extrabold text-white leading-tight">
                    PRONTO PARA CONSTRUIR ALGO DIFERENTE?
                  </h2>
                  <p className="mt-4 font-body text-xs text-white/60 leading-relaxed">
                    Fale-nos do seu projeto e entraremos em contacto em 24 horas.
                  </p>
                </div>

                <div className="col-span-7">
                  {submitted ? (
                    <div className="rounded-2xl border border-magenta/40 bg-magenta/10 p-6 text-center">
                      <CheckCircle2 className="mx-auto h-10 w-10 text-magenta" />
                      <h3 className="mt-3 font-head text-lg font-bold text-white">{c.successTitle}</h3>
                      <p className="mt-2 font-body text-xs text-white/70">{c.successMsg}</p>
                    </div>
                  ) : (
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          name="name"
                          required
                          value={formState.name}
                          onChange={handleInputChange}
                          placeholder={c.phName}
                          className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 font-body text-xs text-white placeholder-white/30 focus:border-magenta focus:outline-none"
                        />
                        <input
                          type="email"
                          name="email"
                          required
                          value={formState.email}
                          onChange={handleInputChange}
                          placeholder={c.phEmail}
                          className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 font-body text-xs text-white placeholder-white/30 focus:border-magenta focus:outline-none"
                        />
                      </div>
                      <select
                        name="service"
                        value={formState.service}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-white/10 bg-ink px-4 py-2.5 font-body text-xs text-white focus:border-magenta focus:outline-none"
                      >
                        {c.services.map((srv) => (
                          <option key={srv} value={srv}>{srv}</option>
                        ))}
                      </select>
                      <textarea
                        name="message"
                        rows={3}
                        value={formState.message}
                        onChange={handleInputChange}
                        placeholder={c.phMessage}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 font-body text-xs text-white placeholder-white/30 focus:border-magenta focus:outline-none"
                      />
                      <button type="submit" disabled={isSubmitting} className="pill-btn w-full justify-center py-3">
                        <span className="font-head text-xs tracking-[0.25em] text-white">{isSubmitting ? c.sending : c.submit}</span>
                        <Send className="h-4 w-4 text-magenta" />
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================
          MOBILE / TABLET RESPONSIVE FALLBACK (< 1024px)
          Natural, fluid vertical scroll narrative without rigid pin
          ========================================================= */}
      <div className="lg:hidden px-6 py-20 space-y-24">
        {/* Services Mobile */}
        <section className="space-y-8">
          <span className="font-head text-xs tracking-[0.3em] text-magenta">02 / SERVIÇOS</span>
          <h2 className="font-head text-3xl font-bold text-white">Sistemas Digitais Desenhados Para Escalar</h2>
          <div className="space-y-6">
            {servicesList.map((srv) => (
              <div key={srv.num} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <span className="font-head text-xs text-magenta">{srv.num}</span>
                <h3 className="mt-2 font-head text-xl font-bold text-white">{srv.title}</h3>
                <p className="mt-2 font-body text-xs text-white/60">{srv.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Capabilities Mobile */}
        <section className="space-y-6">
          <span className="font-head text-xs tracking-[0.3em] text-magenta">03 / CAPACIDADES</span>
          <h2 className="font-head text-3xl font-bold text-white">Competências de Desenvolvimento</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {capabilitiesColumns.map((col) => (
              <div key={col.num} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <h4 className="font-head text-sm font-bold text-white">{col.title}</h4>
                <ul className="mt-3 space-y-1.5 font-body text-xs text-white/65">
                  {col.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-magenta" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Selected Work Mobile */}
        <section className="space-y-6">
          <span className="font-head text-xs tracking-[0.3em] text-magenta">04 / PROJETOS SELECIONADOS</span>
          <div className="space-y-4">
            {selectedWorkItems.map((item) => (
              <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <span className="font-head text-[10px] text-magenta">{item.tag}</span>
                <h3 className="mt-2 font-head text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 font-body text-xs text-white/60">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Positioning Mobile */}
        <section className="text-center space-y-4 py-8">
          <span className="font-head text-xs tracking-[0.3em] text-magenta">05 / POSICIONAMENTO</span>
          <h2 className="font-head text-2xl font-bold text-white leading-tight">
            NÃO CONSTRUÍMOS APENAS PRODUTOS DIGITAIS.
          </h2>
          <div className="font-head text-2xl font-bold text-magenta leading-tight">
            CONSTRUÍMOS O QUE O SEU NEGÓCIO PRECISA.
          </div>
        </section>

        {/* Why Lumyo Mobile */}
        <section className="space-y-6">
          <span className="font-head text-xs tracking-[0.3em] text-magenta">06 / PORQUÊ A LUMYO</span>
          <div className="space-y-4">
            {whyPillars.map((p) => (
              <div key={p.num} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <span className="font-head text-xs text-magenta">{p.num}</span>
                <h3 className="mt-1 font-head text-base font-bold text-white">{p.title}</h3>
                <p className="mt-2 font-body text-xs text-white/60">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Mobile */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-6">
          <span className="font-head text-xs tracking-[0.3em] text-magenta">07 / CONTACTO</span>
          <h2 className="font-head text-2xl font-bold text-white">PRONTO PARA CONSTRUIR ALGO DIFERENTE?</h2>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <input
              type="text"
              name="name"
              required
              value={formState.name}
              onChange={handleInputChange}
              placeholder={c.phName}
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 font-body text-xs text-white placeholder-white/30 focus:border-magenta focus:outline-none"
            />
            <input
              type="email"
              name="email"
              required
              value={formState.email}
              onChange={handleInputChange}
              placeholder={c.phEmail}
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 font-body text-xs text-white placeholder-white/30 focus:border-magenta focus:outline-none"
            />
            <textarea
              name="message"
              rows={3}
              value={formState.message}
              onChange={handleInputChange}
              placeholder={c.phMessage}
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 font-body text-xs text-white placeholder-white/30 focus:border-magenta focus:outline-none"
            />
            <button type="submit" disabled={isSubmitting} className="pill-btn w-full justify-center">
              <span className="font-head text-xs tracking-[0.25em] text-white">{c.submit}</span>
              <Send className="h-4 w-4 text-magenta" />
            </button>
          </form>
        </section>
      </div>

    </div>
  );
}
