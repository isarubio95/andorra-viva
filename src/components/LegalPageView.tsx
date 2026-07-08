import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { useSiteContent } from '@/contexts/SiteContentContext';
import type { LegalPageKey } from '@/constants/legal-pages-defaults';

const PROSE_CLASS =
  'prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed md:text-base [&_a]:text-primary [&_a]:hover:underline [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:text-base [&_h3]:font-semibold [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_section]:space-y-3 [&_ul]:list-disc [&_ul]:pl-5';

export default function LegalPageView({ pageKey }: { pageKey: LegalPageKey }) {
  const { getLegalPage, loading } = useSiteContent();
  const page = getLegalPage(pageKey);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <article className="container mx-auto max-w-3xl px-4 py-10 md:py-14">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-10 w-full max-w-lg" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <>
              <header className="mb-10 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Última actualización: {page.lastUpdated}
                </p>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{page.title}</h1>
                <div
                  className="text-muted-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: page.summary }}
                />
              </header>

              <div
                className={PROSE_CLASS}
                dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
              />

              <p className="mt-10 text-sm text-muted-foreground">
                <strong>Versión actual:</strong> {page.version}
              </p>
            </>
          )}
        </article>
      </main>
      <Footer />
    </div>
  );
}
