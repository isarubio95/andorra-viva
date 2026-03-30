import { useEffect, useRef } from 'react';

const OVERLAY_STATE_KEY = '__andorraVivaOverlay';

/**
 * Vincula un overlay al historial del navegador: Atrás / gesto atrás en móvil
 * cierra el overlay en lugar de salir de la página.
 * Si el usuario cierra con la UI, se hace history.back() para quitar la entrada extra.
 */
export function useSyncOverlayWithHistory(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const closedByPopRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    closedByPopRef.current = false;
    window.history.pushState({ [OVERLAY_STATE_KEY]: true }, '', window.location.href);

    const handlePopState = () => {
      closedByPopRef.current = true;
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (!closedByPopRef.current) {
        window.history.back();
      }
    };
  }, [isOpen]);
}
