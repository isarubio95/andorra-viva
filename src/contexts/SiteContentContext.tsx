import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { mergeCategories } from '@/constants/businessCategories';
import {
  DEFAULT_SUBCATEGORY_CONFIG,
  mergeSubcategoryConfig,
  type SubcategoryConfig,
  getSubcategoriesForCategory as getSubsForCategory,
  getAvailableSubcategories as getAvailableSubs,
} from '@/constants/businessSubcategories';
import {
  getCategoryTheme as resolveTheme,
  type CategoryTheme,
  type CategoryThemesConfig,
} from '@/constants/categoryDisplay';
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
  DEFAULT_MAP_THEME,
  getInitialMapTheme,
  readCachedMapTheme,
  writeCachedMapTheme,
  type MapThemeId,
} from '@/constants/map-themes';
import {
  DEFAULT_SUBCATEGORY_LABELS,
  getSubcategoryDisplayLabel,
} from '@/constants/subcategory-display';
import { fetchSiteSettings } from '@/services/admin-api';

interface SiteContentContextValue {
  loading: boolean;
  /** true cuando el tema del mapa es el del admin (caché local o fetch remoto). */
  mapThemeReady: boolean;
  getText: (key: SiteTextKey) => string;
  getCategoryLabel: (category: string) => string;
  getCategoryTheme: (category: string) => CategoryTheme | null;
  getSubcategoryLabel: (subcategory: string) => string;
  getSubcategoriesForCategory: (category: string) => readonly string[];
  getAvailableSubcategories: (selectedCategories: string[]) => string[];
  getLegalPage: (key: LegalPageKey) => LegalPageDocument;
  texts: Record<SiteTextKey, string>;
  categories: string[];
  categoryLabels: Record<string, string>;
  categoryThemes: CategoryThemesConfig;
  subcategories: SubcategoryConfig;
  subcategoryLabels: Record<string, string>;
  subcategoryIcons: Record<string, string>;
  legalPages: Record<LegalPageKey, LegalPageDocument>;
  mapTheme: MapThemeId;
  refresh: () => Promise<void>;
}

const SiteContentContext = createContext<SiteContentContextValue>({
  loading: true,
  mapThemeReady: false,
  getText: key => DEFAULT_SITE_TEXTS[key],
  getCategoryLabel: category => DEFAULT_CATEGORY_LABELS[category] ?? String(category),
  getCategoryTheme: category => resolveTheme(category),
  getSubcategoryLabel: subcategory => getSubcategoryDisplayLabel(subcategory),
  getSubcategoriesForCategory: category => getSubsForCategory(category),
  getAvailableSubcategories: selected => getAvailableSubs(selected),
  getLegalPage: key => DEFAULT_LEGAL_PAGES[key],
  texts: DEFAULT_SITE_TEXTS,
  categories: mergeCategories(),
  categoryLabels: DEFAULT_CATEGORY_LABELS,
  categoryThemes: {},
  subcategories: DEFAULT_SUBCATEGORY_CONFIG,
  subcategoryLabels: DEFAULT_SUBCATEGORY_LABELS,
  subcategoryIcons: {},
  legalPages: DEFAULT_LEGAL_PAGES,
  mapTheme: DEFAULT_MAP_THEME,
  refresh: async () => {},
});

export function useSiteContent() {
  return useContext(SiteContentContext);
}

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [texts, setTexts] = useState<Record<SiteTextKey, string>>(DEFAULT_SITE_TEXTS);
  const [categories, setCategories] = useState<string[]>(() => mergeCategories());
  const [categoryLabels, setCategoryLabels] =
    useState<Record<string, string>>(DEFAULT_CATEGORY_LABELS);
  const [categoryThemes, setCategoryThemes] = useState<CategoryThemesConfig>({});
  const [subcategories, setSubcategories] =
    useState<SubcategoryConfig>(DEFAULT_SUBCATEGORY_CONFIG);
  const [subcategoryLabels, setSubcategoryLabels] =
    useState<Record<string, string>>(DEFAULT_SUBCATEGORY_LABELS);
  const [subcategoryIcons, setSubcategoryIcons] = useState<Record<string, string>>({});
  const [legalPages, setLegalPages] =
    useState<Record<LegalPageKey, LegalPageDocument>>(DEFAULT_LEGAL_PAGES);
  const [mapTheme, setMapTheme] = useState<MapThemeId>(getInitialMapTheme);
  const [mapThemeReady, setMapThemeReady] = useState(() => readCachedMapTheme() !== null);

  const load = useCallback(async () => {
    setLoading(true);
    const {
      texts: remoteTexts,
      categories: remoteCategories,
      categoryLabels: remoteLabels,
      categoryThemes: remoteThemes,
      subcategories: remoteSubcategories,
      subcategoryLabels: remoteSubcategoryLabels,
      subcategoryIcons: remoteSubcategoryIcons,
      legalPages: remoteLegal,
      mapTheme: remoteMapTheme,
    } = await fetchSiteSettings();
    const nextCategories = mergeCategories(remoteCategories);
    setTexts({ ...DEFAULT_SITE_TEXTS, ...remoteTexts });
    setCategories(nextCategories);
    setCategoryLabels({ ...DEFAULT_CATEGORY_LABELS, ...remoteLabels });
    setCategoryThemes(remoteThemes ?? {});
    setSubcategories(mergeSubcategoryConfig(remoteSubcategories, nextCategories));
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
    writeCachedMapTheme(remoteMapTheme);
    setMapTheme(remoteMapTheme);
    setMapThemeReady(true);
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
    (category: string) =>
      categoryLabels[category] ?? DEFAULT_CATEGORY_LABELS[category] ?? String(category),
    [categoryLabels],
  );

  const getCategoryTheme = useCallback(
    (category: string) => resolveTheme(category, categoryThemes, categoryLabels),
    [categoryThemes, categoryLabels],
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
      mapThemeReady,
      getText,
      getCategoryLabel,
      getCategoryTheme,
      getSubcategoryLabel,
      getSubcategoriesForCategory,
      getAvailableSubcategories,
      getLegalPage,
      texts,
      categories,
      categoryLabels,
      categoryThemes,
      subcategories,
      subcategoryLabels,
      subcategoryIcons,
      legalPages,
      mapTheme,
      refresh: load,
    }),
    [
      loading,
      mapThemeReady,
      getText,
      getCategoryLabel,
      getCategoryTheme,
      getSubcategoryLabel,
      getSubcategoriesForCategory,
      getAvailableSubcategories,
      getLegalPage,
      texts,
      categories,
      categoryLabels,
      categoryThemes,
      subcategories,
      subcategoryLabels,
      subcategoryIcons,
      legalPages,
      mapTheme,
      load,
    ],
  );

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}
