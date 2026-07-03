import { useCallback, useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

const SCROLL_SHOW_THRESHOLD_PX = 12;

export function useMobileMapHeaderVisibility() {
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(true);

  const onMapInteraction = useCallback(() => {
    if (isMobile) setVisible(false);
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) {
      setVisible(true);
      return;
    }

    const onScroll = () => {
      if (window.scrollY > SCROLL_SHOW_THRESHOLD_PX) {
        setVisible(true);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isMobile]);

  return {
    isMobile,
    headerVisible: !isMobile || visible,
    onMapInteraction,
  };
}
