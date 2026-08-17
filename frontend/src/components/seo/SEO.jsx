import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLang } from '../../i18n';

const SITE_NAME = 'Lumyo';

const SITE_URL = 'https://www.lumyo.pt';

const DEFAULT_TITLE_PT =
  'Lumyo — Websites, Automação, IA e Crescimento Digital';

const DEFAULT_TITLE_EN =
  'Lumyo — Websites, Automation, AI and Digital Growth';

const DEFAULT_DESCRIPTION_PT =
  'A Lumyo cria sistemas digitais completos: websites premium, automação, soluções de inteligência artificial e crescimento digital.';

const DEFAULT_DESCRIPTION_EN =
  'Lumyo builds complete digital systems: premium websites, automation, artificial intelligence solutions, and digital growth.';

export default function SEO({
  title,
  titleEn,
  description,
  descriptionEn,
  path = '/',
  image,
  type = 'website',
  noindex = false,
  children,
}) {
  const { lang } = useLang();

  const isEn = lang === 'en';

  const chosenTitle = isEn && titleEn ? titleEn : title;
  const chosenDescription = isEn && descriptionEn ? descriptionEn : description;

  const defaultTitle = isEn ? DEFAULT_TITLE_EN : DEFAULT_TITLE_PT;
  const defaultDescription = isEn ? DEFAULT_DESCRIPTION_EN : DEFAULT_DESCRIPTION_PT;

  const currentTitle = chosenTitle
    ? `${chosenTitle} | ${SITE_NAME}`
    : defaultTitle;

  const currentDescription = chosenDescription || defaultDescription;

  const canonical =
    SITE_URL && path
      ? `${SITE_URL}${path === '/' ? '' : path}`
      : null;

  const socialImage =
    SITE_URL && image
      ? `${SITE_URL}${image}`
      : null;

  return (
    <Helmet>
      <html lang={isEn ? 'en' : 'pt-PT'} />

      <title>{currentTitle}</title>

      <meta
        name="description"
        content={currentDescription}
      />

      <meta
        name="robots"
        content={noindex ? 'noindex, nofollow' : 'index, follow'}
      />

      {canonical && (
        <link
          rel="canonical"
          href={canonical}
        />
      )}

      <meta
        property="og:type"
        content={type}
      />

      <meta
        property="og:site_name"
        content={SITE_NAME}
      />

      <meta
        property="og:title"
        content={currentTitle}
      />

      <meta
        property="og:description"
        content={currentDescription}
      />

      {canonical && (
        <meta
          property="og:url"
          content={canonical}
        />
      )}

      {socialImage && (
        <meta
          property="og:image"
          content={socialImage}
        />
      )}

      <meta
        name="twitter:card"
        content={socialImage ? 'summary_large_image' : 'summary'}
      />

      <meta
        name="twitter:title"
        content={currentTitle}
      />

      <meta
        name="twitter:description"
        content={currentDescription}
      />

      {socialImage && (
        <meta
          name="twitter:image"
          content={socialImage}
        />
      )}

      {children}
    </Helmet>
  );
}