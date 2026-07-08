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
import {
  DEFAULT_LEGAL_PAGES,
  mergeLegalPages,
  type LegalPageDocument,
  type LegalPageKey,
} from '@/constants/legal-pages-defaults';
import { fetchSiteSettings } from '@/services/admin-api';

interface SiteContentContextValue {
  loading: boolean;
  getText: (key: SiteTextKey) => string;
  getCategoryLabel: (category: BusinessCategory | string) => string;
  getLegalPage: (key: LegalPageKey) => LegalPageDocument;
  texts: Record<SiteTextKey, string>;
  categoryLabels: Record<BusinessCategory, string>;
  legalPages: Record<LegalPageKey, LegalPageDocument>;
  refresh: () => Promise<void>;
}

const SiteContentContext = createContext<SiteContentContextValue>({
  loading: true,
  getText: key => DEFAULT_SITE_TEXTS[key],
  getCategoryLabel: category =>
    DEFAULT_CATEGORY_LABELS[category as BusinessCategory] ?? String(category),
  getLegalPage: key => DEFAULT_LEGAL_PAGES[key],
  texts: DEFAULT_SITE_TEXTS,
  categoryLabels: DEFAULT_CATEGORY_LABELS,
  legalPages: DEFAULT_LEGAL_PAGES,
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
  const [legalPages, setLegalPages] =
    useState<Record<LegalPageKey, LegalPageDocument>>(DEFAULT_LEGAL_PAGES);

  const load = useCallback(async () => {
    setLoading(true);
    const { texts: remoteTexts, categoryLabels: remoteLabels, legalPages: remoteLegal } =
      await fetchSiteSettings();
    setTexts({ ...DEFAULT_SITE_TEXTS, ...remoteTexts });
    setCategoryLabels({ ...DEFAULT_CATEGORY_LABELS, ...remoteLabels });
    setLegalPages(mergeLegalPages(remoteLegal));
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

  const getLegalPage = useCallback(
    (key: LegalPageKey) => legalPages[key] ?? DEFAULT_LEGAL_PAGES[key],
    [legalPages],
  );

  const value = useMemo(
    () => ({
      loading,
      getText,
      getCategoryLabel,
      getLegalPage,
      texts,
      categoryLabels,
      legalPages,
      refresh: load,
    }),
    [loading, getText, getCategoryLabel, getLegalPage, texts, categoryLabels, legalPages, load],
  );

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}
