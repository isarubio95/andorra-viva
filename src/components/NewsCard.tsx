import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Newspaper, Store } from 'lucide-react';
import type { NewsPost } from '@/types/domain';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type NewsCardProps = {
  post: NewsPost;
};

export default function NewsCard({ post }: NewsCardProps) {
  const publishedAt = format(new Date(post.created_at), "d 'de' MMMM yyyy", { locale: es });

  return (
    <Card className="overflow-hidden">
      {post.image_url ? (
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <img
            src={post.image_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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
        <h2 className="text-xl font-semibold leading-tight text-foreground">{post.title}</h2>
        <p className="text-sm text-muted-foreground">Por {post.author_name}</p>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{post.body}</p>
      </CardContent>
    </Card>
  );
}
