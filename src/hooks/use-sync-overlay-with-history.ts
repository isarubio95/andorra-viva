import { useEffect, useRef } from 'react';

const OVERLAY_STATE_KEY = '__andorraVivaOverlay';

/** Overlay abierto con entrada extra en el historial (p. ej. drawer de vista previa). */
export const isOverlayHistoryActive = { current: false };

function locationKey() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

/**
 * Vincula un overlay al historial del navegador: Atrás / gesto atrás en móvil
 * cierra el overlay en lugar de salir de la página.
 * Si el usuario cierra con la UI, se hace history.back() para quitar la entrada extra.
 * Si el usuario navega a otra ruta desde el overlay, no se revierte esa navegación.
 */
export function useSyncOverlayWithHistory(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const closedByPopRef = useRef(false);
  const locationWhenOpenedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      isOverlayHistoryActive.current = false;
      return;
    }

    closedByPopRef.current = false;
    locationWhenOpenedRef.current = locationKey();
    isOverlayHistoryActive.current = true;
    window.history.pushState({ [OVERLAY_STATE_KEY]: true }, '', window.location.href);

    const handlePopState = () => {
      closedByPopRef.current = true;
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      const navigatedAway = locationWhenOpenedRef.current !== locationKey();
      if (!closedByPopRef.current && !navigatedAway) {
        window.history.back();
      }
      isOverlayHistoryActive.current = false;
    };
  }, [isOpen]);
}
