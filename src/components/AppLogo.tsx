import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const LOGO_ASPECT = 361 / 198;

const LOGO_SIZES = {
  xs: {
    src: '/logo-xs.png',
    srcSet: '/logo-xs.png 1x, /logo-sm.png 2x',
    height: 36,
    className: 'h-9',
  },
  sm: {
    src: '/logo-sm.png',
    srcSet: '/logo-sm.png 1x, /logo-md.png 2x',
    height: 44,
    className: 'h-10 sm:h-11',
  },
  md: {
    src: '/logo-md.png',
    srcSet: '/logo-md.png 1x, /logo.png 2x',
    height: 56,
    className: 'h-12 sm:h-14',
  },
  lg: {
    src: '/logo.png',
    srcSet: '/logo.png 1x, /logo.png 2x',
    height: 72,
    className: 'h-16 sm:h-[4.5rem]',
  },
} as const;

type AppLogoSize = keyof typeof LOGO_SIZES;

interface AppLogoProps {
  size?: AppLogoSize;
  className?: string;
  asLink?: boolean;
  priority?: boolean;
}

export function AppLogo({
  size = 'xs',
  className,
  asLink = false,
  priority = false,
}: AppLogoProps) {
  const config = LOGO_SIZES[size];
  const width = Math.round(config.height * LOGO_ASPECT);

  const img = (
    <img
      src={config.src}
      srcSet={config.srcSet}
      alt="Andorra Viva"
      width={width}
      height={config.height}
      className={cn('w-auto object-contain', config.className, className)}
      decoding={priority ? 'sync' : 'async'}
      {...(priority ? { fetchpriority: 'high' as const } : {})}
    />
  );

  if (asLink) {
    return (
      <Link to="/" className="inline-flex shrink-0">
        {img}
      </Link>
    );
  }

  return img;
}
