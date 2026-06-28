export const ACCOUNT_DASHBOARD_TABS = ['perfil', 'negocios', 'plan', 'metricas', 'seguridad'] as const;

export type AccountDashboardTab = (typeof ACCOUNT_DASHBOARD_TABS)[number];

const PRO_ONLY_TABS = new Set<AccountDashboardTab>(['negocios', 'plan', 'metricas']);

export function isAccountDashboardTab(value: string | null | undefined): value is AccountDashboardTab {
  return !!value && (ACCOUNT_DASHBOARD_TABS as readonly string[]).includes(value);
}

export function parseAccountDashboardTab(value: string | null | undefined): AccountDashboardTab {
  return isAccountDashboardTab(value) ? value : 'perfil';
}

export function isProOnlyAccountDashboardTab(tab: AccountDashboardTab): boolean {
  return PRO_ONLY_TABS.has(tab);
}

/** Ruta del panel de cuenta con la pestaña en la URL (historial del navegador). */
export function accountDashboardPath(tab: AccountDashboardTab = 'perfil'): string {
  return tab === 'perfil' ? '/mi-cuenta' : `/mi-cuenta?tab=${tab}`;
}

export function isAccountDashboardPath(pathname: string): boolean {
  return pathname === '/mi-cuenta' || pathname.startsWith('/mi-cuenta/');
}

export function getAccountDashboardTabFromSearch(search: string): AccountDashboardTab {
  return parseAccountDashboardTab(new URLSearchParams(search).get('tab'));
}

export function isCurrentAccountDashboardTab(
  pathname: string,
  search: string,
  tab: AccountDashboardTab,
): boolean {
  if (pathname !== '/mi-cuenta') return false;
  return getAccountDashboardTabFromSearch(search) === tab;
}

export function navigateAccountDashboardTab(
  navigate: (to: { pathname: string; search: string }, options?: { replace?: boolean; state?: null }) => void,
  tab: AccountDashboardTab,
  options?: { replace?: boolean },
) {
  navigate(
    {
      pathname: '/mi-cuenta',
      search: tab === 'perfil' ? '' : `?tab=${tab}`,
    },
    { replace: options?.replace ?? false, state: null },
  );
}
