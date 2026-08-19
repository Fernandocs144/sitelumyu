import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
} from 'react';

const HeroBackground = forwardRef(
  function HeroBackground(props, ref) {
    const posterRef = useRef(null);

    const [isMobile, setIsMobile] = useState(() => {
      if (typeof window === 'undefined') {
        return false;
      }

      return window.matchMedia(
        '(max-width: 767px)'
      ).matches;
    });

    const posterPath =
      '/images/hero/hero-poster.webp';

    const desktopWebmPath =
      '/videos/hero/hero.webm';

    const desktopMp4Path =
      '/videos/hero/hero.mp4';

    const mobileWebmPath =
      '/videos/hero/hero-mobile.webm';

    const mobileMp4Path =
      '/videos/hero/hero-mobile.mp4';

    const webmPath = isMobile
      ? mobileWebmPath
      : desktopWebmPath;

    const mp4Path = isMobile
      ? mobileMp4Path
      : desktopMp4Path;

    useEffect(() => {
      const mediaQuery = window.matchMedia(
        '(max-width: 767px)'
      );

      const handleChange = (event) => {
        setIsMobile(event.matches);
      };

      setIsMobile(mediaQuery.matches);

      mediaQuery.addEventListener(
        'change',
        handleChange
      );

      return () => {
        mediaQuery.removeEventListener(
          'change',
          handleChange
        );
      };
    }, []);

    useEffect(() => {
      const video = ref?.current;
      const poster = posterRef.current;

      if (!video || !poster) {
        return undefined;
      }

      let isPosterRemoved = false;

      const removePoster = () => {
        if (isPosterRemoved) {
          return;
        }

        isPosterRemoved = true;

        poster.style.transition =
          'opacity 700ms ease-in-out';

        poster.style.opacity = '0';
        poster.style.pointerEvents = 'none';

        setTimeout(() => {
          if (poster) {
            poster.style.display = 'none';
          }
        }, 750);
      };

      if (video.readyState >= 2) {
        removePoster();
      } else {
        video.addEventListener(
          'loadeddata',
          removePoster,
          { once: true }
        );

        video.addEventListener(
          'canplay',
          removePoster,
          { once: true }
        );

        video.addEventListener(
          'loadedmetadata',
          removePoster,
          { once: true }
        );

        video.addEventListener(
          'seeked',
          removePoster,
          { once: true }
        );
      }

      return () => {
        video.removeEventListener(
          'loadeddata',
          removePoster
        );

        video.removeEventListener(
          'canplay',
          removePoster
        );

        video.removeEventListener(
          'loadedmetadata',
          removePoster
        );

        video.removeEventListener(
          'seeked',
          removePoster
        );
      };
    }, [ref, isMobile]);

    return (
      <div
        data-hero-background
        data-hero-media
        className="
          absolute
          inset-0
          z-0
          h-full
          w-full
          overflow-hidden
          select-none
          pointer-events-none
          bg-transparent
        "
      >
        <img
          ref={posterRef}
          src={posterPath}
          alt="Lumyo Hero Poster"
          loading="eager"
          fetchPriority="high"
          className="
            absolute
            inset-0
            z-10
            h-full
            w-full
            object-cover
            object-center
            opacity-100
          "
        />

        <video
          key={isMobile ? 'mobile' : 'desktop'}
          ref={ref}
          data-hero-video
          muted
          preload="auto"
          playsInline
          className="
            absolute
            inset-0
            z-0
            h-full
            w-full
            object-cover
            object-center
            opacity-100
          "
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
);

export default HeroBackground;