import type { ReactNode } from 'react';
import { useIsPhone } from '@/hooks/use-mobile';
import type { NewsPost } from '@/types/domain';
import NewsPostDetail from '@/components/NewsPostDetail';

type NewsCardProps = {
  post: NewsPost;
  onReadMore?: () => void;
  headerAction?: ReactNode;
};

export default function NewsCard({ post, onReadMore, headerAction }: NewsCardProps) {
  const isPhone = useIsPhone();

  return (
    <NewsPostDetail
      post={post}
      showBody={!isPhone}
      onReadMore={isPhone ? onReadMore : undefined}
      headerAction={headerAction}
    />
  );
}
