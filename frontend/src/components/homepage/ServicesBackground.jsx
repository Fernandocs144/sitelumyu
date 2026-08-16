import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

/**
 * ServicesBackground
 *
 * Desktop / Tablet:
 *   /videos/services/services.webm
 *   /videos/services/services.mp4
 *
 * Mobile:
 *   /videos/services/services-mobile.webm
 *   /videos/services/services-mobile.mp4
 *
 * O vídeo contém apenas a componente visual.
 * Textos, ícones e números continuam em HTML.
 */

export default function ServicesBackground() {
  const [videoLoaded, setVideoLoaded] =
    useState(false);

  const [isMobile, setIsMobile] =
    useState(false);

  const videoRef = useRef(null);


  /* =========================================================
     DETECTAR MOBILE
  ========================================================= */

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      '(max-width: 767px)'
    );

    const updateDevice = () => {
      setIsMobile(mediaQuery.matches);
    };

    updateDevice();

    mediaQuery.addEventListener(
      'change',
      updateDevice
    );

    return () => {
      mediaQuery.removeEventListener(
        'change',
        updateDevice
      );
    };
  }, []);


  /* =========================================================
     CAMINHOS
  ========================================================= */

  const posterPath =
    '/images/services/services-poster.webp';

  const desktopWebm =
    '/videos/services/services.webm';

  const desktopMp4 =
    '/videos/services/services.mp4';

  const mobileWebm =
    '/videos/services/services-mobile.webm';

  const mobileMp4 =
    '/videos/services/services-mobile.mp4';


  const webmPath = isMobile
    ? mobileWebm
    : desktopWebm;

  const mp4Path = isMobile
    ? mobileMp4
    : desktopMp4;


  /* =========================================================
     TROCA DE VÍDEO
  ========================================================= */

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    /*
     * Sempre que passamos desktop <-> mobile
     * fazemos novamente o fade.
     */
    setVideoLoaded(false);

    video.load();

    const playPromise = video.play();

    if (
      playPromise &&
      typeof playPromise.catch === 'function'
    ) {
      playPromise.catch(() => {
        /*
         * Não fazemos nada.
         * Alguns browsers podem impedir autoplay
         * temporariamente.
         */
      });
    }
  }, [webmPath, mp4Path]);


  const handleVideoLoaded = () => {
    setVideoLoaded(true);
  };


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      data-services-background
      data-services-layout={
        isMobile ? 'mobile' : 'desktop'
      }
      className="
        pointer-events-none
        absolute
        inset-0
        z-0
        h-full
        w-full
        select-none
        overflow-hidden
        rounded-3xl
      "
      style={{
        WebkitMaskImage: isMobile
          ? 'linear-gradient(to bottom, rgba(0,0,0,1) 92%, rgba(0,0,0,0) 100%)'
          : 'radial-gradient(ellipse 90% 88% at 50% 50%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',

        maskImage: isMobile
          ? 'linear-gradient(to bottom, rgba(0,0,0,1) 92%, rgba(0,0,0,0) 100%)'
          : 'radial-gradient(ellipse 90% 88% at 50% 50%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
      }}
    >

      {/* ===============================================
          FALLBACK / POSTER
      ================================================ */}

      <img
        src={posterPath}
        alt=""
        aria-hidden="true"
        className={`
          absolute
          inset-0
          h-full
          w-full
          transition-opacity
          duration-700
          ease-in-out

          ${
            isMobile
              ? 'object-cover object-center'
              : 'object-cover object-center'
          }

          ${
            videoLoaded
              ? 'opacity-0'
              : 'opacity-100'
          }
        `}
        loading="eager"
      />


      {/* ===============================================
          VÍDEO RESPONSIVO
      ================================================ */}

      <video
        key={
          isMobile
            ? 'services-mobile'
            : 'services-desktop'
        }
        ref={videoRef}
        data-services-video
        data-services-video-layout={
          isMobile ? 'mobile' : 'desktop'
        }
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onLoadedData={handleVideoLoaded}
        onCanPlay={handleVideoLoaded}
        className={`
          absolute
          inset-0
          h-full
          w-full
          transition-opacity
          duration-700
          ease-in-out

          ${
            /*
             * Desktop:
             * vídeo horizontal ocupa o container.
             *
             * Mobile:
             * vídeo 9:16 mantém igualmente cover,
             * mas agora a proporção da própria secção
             * será corrigida no Home.jsx.
             */
            'object-cover object-center'
          }

          ${
            videoLoaded
              ? 'opacity-100'
              : 'opacity-0'
          }
        `}
      >
        <source
          src={webmPath}
          type="video/webm"
        />

        <source
          src={mp4Path}
          type="video/mp4"
        />
      </video>

    </div>
  );
}