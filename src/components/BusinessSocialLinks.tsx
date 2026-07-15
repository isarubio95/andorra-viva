import { Button } from '@/components/ui/button';
import type { BusinessSocialUrls } from '@/lib/social-links';
import { buildSocialLinkList, type SocialNetwork } from '@/lib/social-links';
import { cn } from '@/lib/utils';

interface BusinessSocialLinksProps {
  urls: BusinessSocialUrls;
  className?: string;
  size?: 'sm' | 'md';
  onLinkClick?: (network: SocialNetwork) => void;
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8a3.6 3.6 0 0 0 3.6 3.6h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6a3.6 3.6 0 0 0-3.6-3.6H7.6m9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.3l-.4 3h-1.9v7A10 10 0 0 0 22 12Z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.7l-5.2-6.8L5.4 22H2.3l7.3-8.4L.8 2h6.9l4.7 6.2L18.9 2Zm-1.2 18h1.9L7.1 3.9H5.1l12.6 16.1Z" />
    </svg>
  );
}

function SocialIcon({ network, className }: { network: SocialNetwork; className?: string }) {
  switch (network) {
    case 'instagram':
      return <InstagramIcon className={className} />;
    case 'facebook':
      return <FacebookIcon className={className} />;
    case 'x':
      return <XIcon className={className} />;
  }
}

export default function BusinessSocialLinks({
  urls,
  className,
  size = 'md',
  onLinkClick,
}: BusinessSocialLinksProps) {
  const links = buildSocialLinkList(urls);
  if (links.length === 0) return null;

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-4 w-4';

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {links.map(link => (
        <Button
          key={link.network}
          variant="outline"
          size="sm"
          className="h-9 max-w-full gap-2 px-3"
          asChild
        >
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${link.label}: ${link.accountName}`}
            onClick={() => onLinkClick?.(link.network)}
          >
            <SocialIcon network={link.network} className={cn(iconSize, 'shrink-0')} />
            <span className="truncate text-sm font-medium">{link.accountName}</span>
          </a>
        </Button>
      ))}
    </div>
  );
}
