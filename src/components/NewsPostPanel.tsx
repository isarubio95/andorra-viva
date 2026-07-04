import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from '@/components/ui/drawer';
import NewsPostDetail from '@/components/NewsPostDetail';
import type { NewsPost } from '@/types/domain';

type NewsPostPanelProps = {
  post: NewsPost | null;
  onClose: () => void;
};

export default function NewsPostPanel({ post, onClose }: NewsPostPanelProps) {
  const [open, setOpen] = useState(false);
  const [displayedPost, setDisplayedPost] = useState<NewsPost | null>(null);

  useEffect(() => {
    if (!post) return;
    setDisplayedPost(post);
    setOpen(true);
  }, [post]);

  const handleClosed = () => {
    setDisplayedPost(null);
    onClose();
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) handleClosed();
  };

  if (!displayedPost) return null;

  return (
    <Drawer
      open={open}
      onOpenChange={handleOpenChange}
      onClose={handleClosed}
      direction="right"
      shouldScaleBackground={false}
    >
      <DrawerContent
        side="right"
        hideCloseButton
        className="flex h-full w-full flex-col gap-0 rounded-none border-0 bg-card p-0 shadow-none"
      >
        <DrawerTitle className="sr-only">{displayedPost.title}</DrawerTitle>
        <DrawerDescription className="sr-only">Detalle de la noticia</DrawerDescription>
        <div className="relative flex h-full min-h-0 flex-col">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="absolute right-4 top-4 z-10 rounded-full bg-card/80 p-2 hover:bg-card"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <NewsPostDetail post={displayedPost} showBody inDrawer />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
