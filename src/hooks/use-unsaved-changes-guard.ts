import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { isOverlayHistoryActive } from '@/hooks/use-sync-overlay-with-history';

type PendingNavigation =
  | 'back'
  | {
      pathname: string;
      search?: string;
      state?: unknown;
    };

interface UseUnsavedChangesGuardOptions {
  enabled: boolean;
}

export function useUnsavedChangesGuard({ enabled }: UseUnsavedChangesGuardOptions) {
  const navigate = useNavigate();
  const allowNavigationRef = useRef(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const pendingNavigationRef = useRef<PendingNavigation | null>(null);

  const openLeaveDialog = useCallback((pending: PendingNavigation) => {
    pendingNavigationRef.current = pending;
    setDialogOpen(true);
  }, []);

  const closeLeaveDialog = useCallback(() => {
    pendingNavigationRef.current = null;
    setDialogOpen(false);
  }, []);

  const proceedPendingNavigation = useCallback(() => {
    const pending = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    setDialogOpen(false);

    if (!pending) return;

    allowNavigationRef.current = true;
    if (pending === 'back') {
      window.history.back();
      return;
    }

    navigate(`${pending.pathname}${pending.search ?? ''}`, { state: pending.state });
  }, [navigate]);

  const allowNextNavigation = useCallback(() => {
    allowNavigationRef.current = true;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowNavigationRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const handlePopState = () => {
      if (allowNavigationRef.current) return;
      if (isOverlayHistoryActive.current) return;
      window.history.pushState(null, '', window.location.href);
      openLeaveDialog('back');
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [enabled, openLeaveDialog]);

  useEffect(() => {
    if (!enabled) return;

    const handleClick = (event: MouseEvent) => {
      if (allowNavigationRef.current) return;

      const anchor = (event.target as Element | null)?.closest('a[href]');
      if (!anchor) return;
      if (anchor.getAttribute('target') === '_blank') return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;

      const nextPath = `${url.pathname}${url.search}`;
      const currentPath = `${window.location.pathname}${window.location.search}`;
      if (nextPath === currentPath) return;

      event.preventDefault();
      event.stopPropagation();
      openLeaveDialog({ pathname: url.pathname, search: url.search || undefined });
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [enabled, openLeaveDialog]);

  return {
    dialogOpen,
    setDialogOpen,
    closeLeaveDialog,
    proceedPendingNavigation,
    allowNextNavigation,
    requestLeave: openLeaveDialog,
  };
}
