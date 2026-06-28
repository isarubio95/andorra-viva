import { useRef } from 'react';
import Autoplay from 'embla-carousel-autoplay';

const DEFAULT_DELAY_MS = 4000;

export function useCarouselAutoplay(delay = DEFAULT_DELAY_MS) {
  const plugin = useRef(
    Autoplay({
      delay,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    }),
  );

  return plugin.current;
}
