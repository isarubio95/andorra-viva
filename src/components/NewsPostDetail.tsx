import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowUpRight, Newspaper, Store } from 'lucide-react';
import type { NewsPost } from '@/types/domain';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ResponsiveImage } from '@/components/ResponsiveImage';
import { cn } from '@/lib/utils';
import { rewriteSupabaseStorageUrl } from '@/lib/business-image';

type NewsPostDetailProps = {
  post: NewsPost;
  showBody?: boolean;
  onReadMore?: () => void;
  inDrawer?: boolean;
  className?: string;
};

export default function NewsPostDetail({
  post,
  showBody = true,
  onReadMore,
  inDrawer = false,
  className,
}: NewsPostDetailProps) {
  const publishedAt = format(new Date(post.created_at), "d 'de' MMMM yyyy", { locale: es });

  const meta = (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <Newspaper className="h-3.5 w-3.5" />
        {publishedAt}
      </span>
      {post.business_name ? (
        <Badge variant="secondary" className="inline-flex items-center gap-1 font-normal">
          <Store className="h-3 w-3" />
          {post.business_name}
        </Badge>
      ) : null}
    </div>
  );

  const title = (
    <h2
      className={cn(
        'font-semibold leading-tight text-foreground',
        inDrawer ? 'text-2xl font-bold' : 'text-xl',
      )}
    >
      {post.title}
    </h2>
  );

  const readMoreLink =
    !showBody && onReadMore ? (
      <button
        type="button"
        onClick={onReadMore}
        className="inline-flex w-fit items-center gap-1 text-sm text-primary underline underline-offset-4 transition-opacity hover:opacity-80"
      >
        Leer más
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
      </button>
    ) : null;

  const body = showBody ? (
    <p className="whitespace-pre-wrap text-sm text-foreground/90">{post.body}</p>
  ) : null;

  const image = post.image_url ? (
    <div
      className={cn(
        'w-full overflow-hidden bg-muted',
        inDrawer ? 'aspect-3/2 shrink-0' : 'aspect-video',
      )}
    >
      <ResponsiveImage
        src={rewriteSupabaseStorageUrl(post.image_url) ?? post.image_url}
        alt=""
        sizesPreset="detail"
        className="h-full w-full object-cover"
      />
    </div>
  ) : null;

  if (inDrawer) {
    return (
      <div className={cn('flex h-full min-h-0 flex-col bg-card', className)}>
        {image}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-6">
          <div className="space-y-3">
            {meta}
            {title}
          </div>
          {body}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {image}
      <CardHeader className="space-y-3 p-5">
        {meta}
        {title}
        {readMoreLink}
      </CardHeader>
      {body ? <CardContent>{body}</CardContent> : null}
    </Card>
  );
}
