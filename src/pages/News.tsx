import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Newspaper } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsCard from '@/components/NewsCard';
import { getNewsPosts } from '@/services/api';
import type { NewsPost } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MONTHS = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

function parseYearParam(value: string | null): number | null {
  if (!value) return null;
  const year = Number(value);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return null;
  return year;
}

function parseMonthParam(value: string | null): number | null {
  if (!value) return null;
  const month = Number(value);
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  return month;
}

export default function News() {
  const [searchParams, setSearchParams] = useSearchParams();
  const now = new Date();
  const defaultYear = now.getFullYear();
  const defaultMonth = now.getMonth() + 1;

  const selectedYear = parseYearParam(searchParams.get('ano')) ?? defaultYear;
  const selectedMonth = parseMonthParam(searchParams.get('mes')) ?? defaultMonth;

  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, index) => current - index);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void getNewsPosts({ year: selectedYear, month: selectedMonth }).then(result => {
      if (cancelled) return;
      setPosts(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedYear, selectedMonth]);

  const updateFilters = (year: number, month: number) => {
    setSearchParams({ ano: String(year), mes: String(month) }, { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-10">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Newspaper className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Noticias</h1>
            <p className="text-muted-foreground">
              Novedades de negocios locales. Filtra por año y mes para ver publicaciones anteriores.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="grid w-full gap-3 sm:max-w-md sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="news-year" className="text-sm font-medium text-foreground">
                  Año
                </label>
                <Select
                  value={String(selectedYear)}
                  onValueChange={value => updateFilters(Number(value), selectedMonth)}
                >
                  <SelectTrigger id="news-year">
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map(year => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="news-month" className="text-sm font-medium text-foreground">
                  Mes
                </label>
                <Select
                  value={String(selectedMonth)}
                  onValueChange={value => updateFilters(selectedYear, Number(value))}
                >
                  <SelectTrigger id="news-month">
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(month => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => updateFilters(defaultYear, defaultMonth)}
            >
              Mes actual
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
              <p className="font-medium text-foreground">No hay noticias en este periodo</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Prueba otro mes o vuelve más adelante.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map(post => (
                <NewsCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
