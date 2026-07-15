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
  DEFAULT_SUBCATEGORY_CONFIG,
  mergeSubcategoryConfig,
  type SubcategoryConfig,
  getSubcategoriesForCategory as getSubsForCategory,
  getAvailableSubcategories as getAvailableSubs,
} from '@/constants/businessSubcategories';
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
import {
  DEFAULT_SUBCATEGORY_LABELS,
  getSubcategoryDisplayLabel,
} from '@/constants/subcategory-display';
import { fetchSiteSettings } from '@/services/admin-api';

interface SiteContentContextValue {
  loading: boolean;
  getText: (key: SiteTextKey) => string;
  getCategoryLabel: (category: BusinessCategory | string) => string;
  getSubcategoryLabel: (subcategory: string) => string;
  getSubcategoriesForCategory: (category: string) => readonly string[];
  getAvailableSubcategories: (selectedCategories: string[]) => string[];
  getLegalPage: (key: LegalPageKey) => LegalPageDocument;
  texts: Record<SiteTextKey, string>;
  categoryLabels: Record<BusinessCategory, string>;
  subcategories: SubcategoryConfig;
  subcategoryLabels: Record<string, string>;
  subcategoryIcons: Record<string, string>;
  legalPages: Record<LegalPageKey, LegalPageDocument>;
  refresh: () => Promise<void>;
}

const SiteContentContext = createContext<SiteContentContextValue>({
  loading: true,
  getText: key => DEFAULT_SITE_TEXTS[key],
  getCategoryLabel: category =>
    DEFAULT_CATEGORY_LABELS[category as BusinessCategory] ?? String(category),
  getSubcategoryLabel: subcategory => getSubcategoryDisplayLabel(subcategory),
  getSubcategoriesForCategory: category => getSubsForCategory(category),
  getAvailableSubcategories: selected => getAvailableSubs(selected),
  getLegalPage: key => DEFAULT_LEGAL_PAGES[key],
  texts: DEFAULT_SITE_TEXTS,
  categoryLabels: DEFAULT_CATEGORY_LABELS,
  subcategories: DEFAULT_SUBCATEGORY_CONFIG,
  subcategoryLabels: DEFAULT_SUBCATEGORY_LABELS,
  subcategoryIcons: {},
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
  const [subcategories, setSubcategories] =
    useState<SubcategoryConfig>(DEFAULT_SUBCATEGORY_CONFIG);
  const [subcategoryLabels, setSubcategoryLabels] =
    useState<Record<string, string>>(DEFAULT_SUBCATEGORY_LABELS);
  const [subcategoryIcons, setSubcategoryIcons] = useState<Record<string, string>>({});
  const [legalPages, setLegalPages] =
    useState<Record<LegalPageKey, LegalPageDocument>>(DEFAULT_LEGAL_PAGES);

  const load = useCallback(async () => {
    setLoading(true);
    const {
      texts: remoteTexts,
      categoryLabels: remoteLabels,
      subcategories: remoteSubcategories,
      subcategoryLabels: remoteSubcategoryLabels,
      subcategoryIcons: remoteSubcategoryIcons,
      legalPages: remoteLegal,
    } = await fetchSiteSettings();
    setTexts({ ...DEFAULT_SITE_TEXTS, ...remoteTexts });
    setCategoryLabels({ ...DEFAULT_CATEGORY_LABELS, ...remoteLabels });
    setSubcategories(mergeSubcategoryConfig(remoteSubcategories));
    setSubcategoryLabels({ ...DEFAULT_SUBCATEGORY_LABELS, ...remoteSubcategoryLabels });
    setSubcategoryIcons(
      Object.fromEntries(
        Object.entries({ ...remoteSubcategoryIcons }).map(([name, value]) => [
          name,
          String(value),
        ]),
      ),
    );
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

  const getSubcategoryLabel = useCallback(
    (subcategory: string) =>
      getSubcategoryDisplayLabel(subcategory, subcategoryLabels),
    [subcategoryLabels],
  );

  const getSubcategoriesForCategory = useCallback(
    (category: string) => getSubsForCategory(category, subcategories),
    [subcategories],
  );

  const getAvailableSubcategories = useCallback(
    (selectedCategories: string[]) => getAvailableSubs(selectedCategories, subcategories),
    [subcategories],
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
      getSubcategoryLabel,
      getSubcategoriesForCategory,
      getAvailableSubcategories,
      getLegalPage,
      texts,
      categoryLabels,
      subcategories,
      subcategoryLabels,
      subcategoryIcons,
      legalPages,
      refresh: load,
    }),
    [
      loading,
      getText,
      getCategoryLabel,
      getSubcategoryLabel,
      getSubcategoriesForCategory,
      getAvailableSubcategories,
      getLegalPage,
      texts,
      categoryLabels,
      subcategories,
      subcategoryLabels,
      subcategoryIcons,
      legalPages,
      load,
    ],
  );

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}
