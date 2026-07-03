import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { BusinessCategory } from '@/constants/businessCategories';
import {
  DEFAULT_CATEGORY_LABELS,
  DEFAULT_SITE_TEXTS,
  type SiteTextKey,
} from '@/constants/site-content-defaults';
import { fetchSiteSettings } from '@/services/admin-api';

interface SiteContentContextValue {
  loading: boolean;
  getText: (key: SiteTextKey) => string;
  getCategoryLabel: (category: BusinessCategory | string) => string;
  texts: Record<SiteTextKey, string>;
  categoryLabels: Record<BusinessCategory, string>;
  refresh: () => Promise<void>;
}

const SiteContentContext = createContext<SiteContentContextValue>({
  loading: true,
  getText: key => DEFAULT_SITE_TEXTS[key],
  getCategoryLabel: category =>
    DEFAULT_CATEGORY_LABELS[category as BusinessCategory] ?? String(category),
  texts: DEFAULT_SITE_TEXTS,
  categoryLabels: DEFAULT_CATEGORY_LABELS,
  refresh: async () => {},
});

export function useSiteContent() {
  return useContext(SiteContentContext);
}

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [texts, setTexts] = useState<Record<SiteTextKey, string>>(DEFAULT_SITE_TEXTS);
  const [categoryLabels, setCategoryLabels] =
    useState<Record<BusinessCategory, string>>(DEFAULT_CATEGORY_LABELS);

  const load = useCallback(async () => {
    setLoading(true);
    const { texts: remoteTexts, categoryLabels: remoteLabels } = await fetchSiteSettings();
    setTexts({ ...DEFAULT_SITE_TEXTS, ...remoteTexts });
    setCategoryLabels({ ...DEFAULT_CATEGORY_LABELS, ...remoteLabels });
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const getText = useCallback(
    (key: SiteTextKey) => texts[key] ?? DEFAULT_SITE_TEXTS[key],
    [texts],
  );

  const getCategoryLabel = useCallback(
    (category: BusinessCategory | string) =>
      categoryLabels[category as BusinessCategory] ??
      DEFAULT_CATEGORY_LABELS[category as BusinessCategory] ??
      String(category),
    [categoryLabels],
  );

  const value = useMemo(
    () => ({
      loading,
      getText,
      getCategoryLabel,
      texts,
      categoryLabels,
      refresh: load,
    }),
    [loading, getText, getCategoryLabel, texts, categoryLabels, load],
  );

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}
