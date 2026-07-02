import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, Check, Globe, Settings, Sparkles, TrendingUp } from 'lucide-react';
import { CONTACT_EMAIL } from '../data';
import ParticleField from '../components/ParticleField';

const services = [
  { icon: Globe, label: 'Premium Website' },
  { icon: Settings, label: 'Automation' },
  { icon: Sparkles, label: 'AI Solutions' },
  { icon: TrendingUp, label: 'Digital Growth' },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', service: 'Premium Website', message: '' });
  const [sent, setSent] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    // Frontend-only: open user's mail client with prefilled content.
    const subject = encodeURIComponent(`New project — ${form.service}`);
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\nService: ${form.service}\n\n${form.message}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <div className="page-enter section-bg relative min-h-screen overflow-hidden pt-40 pb-28">
      <ParticleField count={40} />
      <div className="relative z-10 mx-auto max-w-[1600px] px-6 md:px-10">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          <div>
            <p className="font-head text-sm tracking-mega text-magenta">CONTACT</p>
            <h1 className="mt-6 font-head text-4xl font-bold leading-tight text-white md:text-6xl">
              Let's build something unique.
            </h1>
            <p className="mt-6 max-w-md font-body text-lg leading-relaxed text-white/60">
              Tell us about your project. We reply to every serious enquiry within 24 hours.
            </p>

            <a
              href={`mailto:${CONTACT_EMAIL}`}
              data-testid="contact-email"
              className="mt-10 inline-flex items-center gap-3 font-body text-xl text-white hover:text-magenta"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-magenta text-magenta">
                <Mail className="h-5 w-5" />
              </span>
              {CONTACT_EMAIL}
            </a>

            <div className="mt-10 grid grid-cols-2 gap-3">
              {services.map((s) => (
                <div key={s.label} className="glass flex items-center gap-3 rounded-xl px-4 py-3 font-body text-white/70">
                  <s.icon className="h-5 w-5 text-magenta" /> {s.label}
                </div>
              ))}
            </div>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onSubmit={submit}
            className="glass rounded-3xl p-8 md:p-10"
            data-testid="contact-form"
          >
            {sent ? (
              <div className="flex flex-col items-center py-16 text-center" data-testid="contact-success">
                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-magenta text-magenta">
                  <Check className="h-8 w-8" />
                </span>
                <h3 className="mt-6 font-head text-2xl font-semibold text-white">Message ready to send.</h3>
                <p className="mt-3 font-body text-white/60">
                  Your email client just opened with your message. Prefer email? Write to us at{' '}
                  <span className="text-magenta">{CONTACT_EMAIL}</span>.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-8 rounded-full border border-magenta px-6 py-3 pill-btn font-head text-xs tracking-[0.3em] text-white"
                >
                  SEND ANOTHER
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  <div>
                    <label className="font-head text-xs tracking-[0.25em] text-white/50">NAME</label>
                    <input
                      required
                      value={form.name}
                      onChange={update('name')}
                      data-testid="input-name"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-body text-white outline-none transition-colors focus:border-magenta"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="font-head text-xs tracking-[0.25em] text-white/50">EMAIL</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={update('email')}
                      data-testid="input-email"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-body text-white outline-none transition-colors focus:border-magenta"
                      placeholder="you@company.com"
                    />
                  </div>
                  <div>
                    <label className="font-head text-xs tracking-[0.25em] text-white/50">SERVICE</label>
                    <select
                      value={form.service}
                      onChange={update('service')}
                      data-testid="input-service"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-body text-white outline-none transition-colors focus:border-magenta"
                    >
                      {services.map((s) => (
                        <option key={s.label} className="bg-night">{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-head text-xs tracking-[0.25em] text-white/50">MESSAGE</label>
                    <textarea
                      required
                      rows={4}
                      value={form.message}
                      onChange={update('message')}
                      data-testid="input-message"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-body text-white outline-none transition-colors focus:border-magenta"
                      placeholder="Tell us about your project..."
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  data-testid="contact-submit"
                  className="mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-magenta to-violet px-8 py-4 pill-btn font-head text-sm tracking-[0.3em] text-white"
                >
                  START YOUR PROJECT <Send className="h-4 w-4" />
                </button>
              </>
            )}
          </motion.form>
        </div>
      </div>
    </div>
  );
}
