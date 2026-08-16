import React, {
  useEffect,
  useRef,
  forwardRef,
} from 'react';


const HeroBackground = forwardRef(
  function HeroBackground(props, ref) {
    const posterRef = useRef(null);

    const posterPath =
      '/images/hero/hero-poster.webp';

    const webmPath =
      '/videos/hero/hero.webm';

    const mp4Path =
      '/videos/hero/hero.mp4';


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
    }, [ref]);


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