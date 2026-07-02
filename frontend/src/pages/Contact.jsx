import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, Check, Globe, Settings, Sparkles, TrendingUp, Loader2 } from 'lucide-react';
import { CONTACT_EMAIL } from '../data';
import { useLang } from '../i18n';
import ParticleField from '../components/ParticleField';

const serviceIcons = [Globe, Settings, Sparkles, TrendingUp];
const API = process.env.REACT_APP_BACKEND_URL;

export default function Contact() {
  const { t, lang } = useLang();
  const c = t.contact;
  const [form, setForm] = useState({ name: '', email: '', service: c.services[0], message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch(`${API}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, language: lang }),
      });
      if (!res.ok) throw new Error('Request failed');
      setStatus('sent');
    } catch (err) {
      setStatus('error');
    }
  };

  const reset = () => {
    setForm({ name: '', email: '', service: c.services[0], message: '' });
    setStatus('idle');
  };

  return (
    <div className="page-enter section-bg relative min-h-screen overflow-hidden pt-40 pb-28">
      <ParticleField count={40} />
      <div className="relative z-10 mx-auto max-w-[1600px] px-6 md:px-10">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          <div>
            <p className="font-head text-sm tracking-mega text-magenta">{t.nav.contact}</p>
            <h1 className="mt-6 font-head text-4xl font-bold leading-tight text-white md:text-6xl">
              {c.heading}
            </h1>
            <p className="mt-6 max-w-md font-body text-lg leading-relaxed text-white/60">{c.desc}</p>

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
              {c.services.map((label, i) => {
                const Icon = serviceIcons[i];
                return (
                  <div key={label} className="glass flex items-center gap-3 rounded-xl px-4 py-3 font-body text-white/70">
                    <Icon className="h-5 w-5 text-magenta" /> {label}
                  </div>
                );
              })}
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
            {status === 'sent' ? (
              <div className="flex flex-col items-center py-16 text-center" data-testid="contact-success">
                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-magenta text-magenta">
                  <Check className="h-8 w-8" />
                </span>
                <h3 className="mt-6 font-head text-2xl font-semibold text-white">{c.successTitle}</h3>
                <p className="mt-3 font-body text-white/60">{c.successMsg}</p>
                <button
                  type="button"
                  onClick={reset}
                  data-testid="send-another"
                  className="mt-8 rounded-full border border-magenta px-6 py-3 pill-btn font-head text-xs tracking-[0.3em] text-white"
                >
                  {c.sendAnother}
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  <div>
                    <label className="font-head text-xs tracking-[0.25em] text-white/50">{c.labelName}</label>
                    <input
                      required
                      value={form.name}
                      onChange={update('name')}
                      data-testid="input-name"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-body text-white outline-none transition-colors focus:border-magenta"
                      placeholder={c.phName}
                    />
                  </div>
                  <div>
                    <label className="font-head text-xs tracking-[0.25em] text-white/50">{c.labelEmail}</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={update('email')}
                      data-testid="input-email"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-body text-white outline-none transition-colors focus:border-magenta"
                      placeholder={c.phEmail}
                    />
                  </div>
                  <div>
                    <label className="font-head text-xs tracking-[0.25em] text-white/50">{c.labelService}</label>
                    <select
                      value={form.service}
                      onChange={update('service')}
                      data-testid="input-service"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-body text-white outline-none transition-colors focus:border-magenta"
                    >
                      {c.services.map((label) => (
                        <option key={label} className="bg-night">{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-head text-xs tracking-[0.25em] text-white/50">{c.labelMessage}</label>
                    <textarea
                      required
                      rows={4}
                      value={form.message}
                      onChange={update('message')}
                      data-testid="input-message"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-body text-white outline-none transition-colors focus:border-magenta"
                      placeholder={c.phMessage}
                    />
                  </div>
                </div>

                {status === 'error' && (
                  <p data-testid="contact-error" className="mt-5 font-body text-magenta">{c.errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  data-testid="contact-submit"
                  className="mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-magenta to-violet px-8 py-4 pill-btn font-head text-sm tracking-[0.3em] text-white disabled:opacity-60"
                >
                  {status === 'sending' ? (
                    <>
                      {c.sending} <Loader2 className="h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    <>
                      {c.submit} <Send className="h-4 w-4" />
                    </>
                  )}
                </button>
              </>
            )}
          </motion.form>
        </div>
      </div>
    </div>
  );
}
