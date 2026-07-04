import { useIsPhone } from '@/hooks/use-mobile';
import type { NewsPost } from '@/types/domain';
import NewsPostDetail from '@/components/NewsPostDetail';

type NewsCardProps = {
  post: NewsPost;
  onReadMore?: () => void;
};

export default function NewsCard({ post, onReadMore }: NewsCardProps) {
  const isPhone = useIsPhone();

  return (
    <NewsPostDetail
      post={post}
      showBody={!isPhone}
      onReadMore={isPhone ? onReadMore : undefined}
    />
  );
}
