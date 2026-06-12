import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from '@/components/ui/drawer';
import BusinessProfileView from '@/components/BusinessProfileView';
import { getReviewsByBusiness, trackBusinessVisit } from '@/services/api';
import type { Business, Review } from '@/types/domain';
import { getOrCreateVisitorKey } from '@/lib/visitor-key';

interface ReviewsPanelProps {
  business: Business | null;
  onClose: () => void;
}

export default function ReviewsPanel({ business, onClose }: ReviewsPanelProps) {
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

  if (!displayedBusiness) return null;

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      onClose={handleClosed}
      direction="right"
      shouldScaleBackground={false}
    >
      <DrawerContent
        side="right"
        hideCloseButton
        className="flex w-full flex-col gap-0 bg-card p-0 md:w-[min(36rem,calc(100%-2.75rem))] md:max-w-xl"
      >
        <DrawerTitle className="sr-only">{displayedBusiness.name}</DrawerTitle>
        <DrawerDescription className="sr-only">
          Detalle y reseñas del negocio
        </DrawerDescription>

        <div className="relative flex h-full flex-col">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 z-10 rounded-full bg-card/80 p-2 hover:bg-card"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <BusinessProfileView business={displayedBusiness} reviews={reviews} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
