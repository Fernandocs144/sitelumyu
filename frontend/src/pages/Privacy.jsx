import React from 'react';
import SEO from '../components/seo/SEO';
import { useLang } from '../i18n';

export default function Privacy() {
  const { t } = useLang();
  const page = t.privacy;

  return (
    <>
      <SEO
        title={page.seoTitle}
        description={page.seoDescription}
        canonical="/privacy"
      />

      <main
        className="min-h-screen text-white"
        style={{
          background:
            'radial-gradient(circle at 15% 20%, rgba(255, 31, 143, 0.08), transparent 32%), radial-gradient(circle at 85% 65%, rgba(62, 72, 255, 0.10), transparent 35%), #070512',
        }}
      >
        <article className="mx-auto max-w-3xl px-6 pb-24 pt-40 md:px-10 md:pt-48">
          <header className="mb-16">
            <p className="mb-5 text-xs uppercase tracking-[0.35em] text-[#ff1f8f]">
              LEGAL
            </p>

            <h1 className="text-4xl font-light md:text-6xl">
              {page.title}
            </h1>

            <p className="mt-6 text-sm text-white/40">
              {t.legal.lastUpdated}
            </p>
          </header>

          <div className="space-y-12 text-base leading-8 text-white/65">
            {page.sections.map((section) => (
              <section key={section.title}>
                <h2 className="mb-4 text-xl text-white">
                  {section.title}
                </h2>

                {section.paragraphs?.map((paragraph, index) => (
                  <p
                    key={`${section.title}-paragraph-${index}`}
                    className={index > 0 ? 'mt-4' : undefined}
                    style={{ whiteSpace: 'pre-line' }}
                  >
                    {paragraph}
                  </p>
                ))}

                {section.list && (
                  <ul className="mt-4 list-disc space-y-2 pl-6">
                    {section.list.map((item, index) => (
                      <li key={`${section.title}-item-${index}`}>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </article>
      </main>
    </>
  );
}