import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteContent } from '@/contexts/SiteContentContext';
import { resolvePageBackgroundId } from '@/constants/page-backgrounds';
import {
  applyPageBackgroundToBody,
  clearPageBackgroundOnBody,
} from '@/lib/page-background-dom';

/**
 * Aplica el fondo configurado en admin según la ruta actual.
 * Modo default: deja el CSS estático de index.css.
 */
export default function PageBackgroundApplier() {
  const { pathname } = useLocation();
  const { getPageBackground } = useSiteContent();

  useEffect(() => {
    const pageId = resolvePageBackgroundId(pathname);
    if (!pageId) {
      clearPageBackgroundOnBody();
      return;
    }

    applyPageBackgroundToBody(getPageBackground(pageId));
  }, [pathname, getPageBackground]);

  useEffect(() => {
    return () => {
      clearPageBackgroundOnBody();
    };
  }, []);

  return null;
}
