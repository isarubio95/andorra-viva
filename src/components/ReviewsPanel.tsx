import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import BusinessProfileView from '@/components/BusinessProfileView';
import { useIsMobile } from '@/hooks/use-mobile';
import { getReviewsByBusiness, trackBusinessVisit } from '@/services/api';
import type { Business, Review } from '@/types/domain';
import { getOrCreateVisitorKey } from '@/lib/visitor-key';

interface ReviewsPanelProps {
  business: Business | null;
  onClose: () => void;
}

const DESKTOP_PROFILE_WIDTH =
  'h-[min(96vh,900px)] max-h-[96vh] w-[min(36rem,calc(100%-2.75rem))] max-w-xl';

export default function ReviewsPanel({ business, onClose }: ReviewsPanelProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [displayedBusiness, setDisplayedBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!business) return;
    setDisplayedBusiness(business);
    setOpen(true);
  }, [business]);

  useEffect(() => {
    if (!displayedBusiness) return;
    getReviewsByBusiness(displayedBusiness.id).then(setReviews);
  }, [displayedBusiness?.id]);

  useEffect(() => {
    if (!displayedBusiness) return;
    const visitorKey = getOrCreateVisitorKey();
    void trackBusinessVisit(displayedBusiness.id, visitorKey);
  }, [displayedBusiness?.id]);

  const handleClosed = () => {
    setDisplayedBusiness(null);
    setReviews([]);
    onClose();
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) handleClosed();
  };

  if (!displayedBusiness) return null;

  const profileContent = (
    <div className="relative flex h-full min-h-0 flex-col">
      <button
        type="button"
        onClick={() => handleOpenChange(false)}
        className="absolute right-4 top-4 z-10 rounded-full bg-card/80 p-2 hover:bg-card"
        aria-label="Cerrar"
      >
        <X className="h-5 w-5" />
      </button>
      <BusinessProfileView business={displayedBusiness} reviews={reviews} />
    </div>
  );

  if (isMobile) {
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
          className="flex h-full w-full flex-col gap-0 bg-card p-0"
        >
          <DrawerTitle className="sr-only">{displayedBusiness.name}</DrawerTitle>
          <DrawerDescription className="sr-only">
            Detalle y reseñas del negocio
          </DrawerDescription>
          {profileContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        animation="fade"
        hideCloseButton
        className={`flex ${DESKTOP_PROFILE_WIDTH} flex-col gap-0 overflow-hidden border-0 bg-card p-0 sm:rounded-xl`}
      >
        <DialogTitle className="sr-only">{displayedBusiness.name}</DialogTitle>
        <DialogDescription className="sr-only">
          Detalle y reseñas del negocio
        </DialogDescription>
        {profileContent}
      </DialogContent>
    </Dialog>
  );
}
