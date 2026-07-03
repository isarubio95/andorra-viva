type ScrollDirection = 'up' | 'down';

let direction: ScrollDirection = 'down';
let lastScrollY = 0;
let initialized = false;

export function initScrollDirection() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  lastScrollY = window.scrollY;

  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY;
      if (y === lastScrollY) return;
      direction = y > lastScrollY ? 'down' : 'up';
      lastScrollY = y;
    },
    { passive: true },
  );
}

export function getScrollDirection(): ScrollDirection {
  return direction;
}
