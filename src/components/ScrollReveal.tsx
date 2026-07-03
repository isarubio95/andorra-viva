import {
  useEffect,
  useRef,
  useState,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import { getScrollDirection, initScrollDirection } from '@/lib/scroll-direction';

type RevealState = 'hidden' | 'from-below' | 'from-above' | 'visible';

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
} & Omit<HTMLAttributes<HTMLElement>, 'children' | 'className'>;

export function ScrollReveal({
  children,
  className,
  as: Tag = 'div',
  ...props
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<RevealState>('hidden');

  useEffect(() => {
    initScrollDirection();
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setState('visible');
      return;
    }

    let revealed = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || revealed) return;
        revealed = true;
        setState(getScrollDirection() === 'down' ? 'from-below' : 'from-above');
        observer.disconnect();
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn(
        state === 'hidden' && 'opacity-0',
        state === 'from-below' &&
          'animate-scroll-reveal-up motion-reduce:animate-none motion-reduce:opacity-100',
        state === 'from-above' &&
          'animate-scroll-reveal-down motion-reduce:animate-none motion-reduce:opacity-100',
        state === 'visible' && 'opacity-100',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
