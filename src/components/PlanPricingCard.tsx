import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  formatPlanPrice,
  getPlanFeatureDisplay,
  getPlanTheme,
} from '@/lib/plan-display';
import { cn } from '@/lib/utils';
import type { Plan } from '@/types/domain';

interface PlanPricingCardProps {
  plan: Plan;
  plans: Plan[];
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  action?: ReactNode;
  topBadge?: ReactNode;
  showPopularBadge?: boolean;
  showPreview?: boolean;
  className?: string;
}

function PlanPreview({ variant }: { variant: PlanTheme['preview'] }) {
  if (variant === 'mountains') {
    return (
      <div className="relative mt-5 h-28 overflow-hidden rounded-xl bg-linear-to-b from-emerald-100 to-emerald-50">
        <svg viewBox="0 0 320 120" className="absolute inset-x-0 bottom-0 h-full w-full" aria-hidden>
          <path d="M0 120 L0 72 L48 44 L88 68 L128 36 L168 58 L208 28 L256 52 L320 24 L320 120 Z" fill="#34d399" opacity="0.55" />
          <path d="M0 120 L0 88 L56 62 L104 82 L152 54 L200 74 L248 48 L320 64 L320 120 Z" fill="#10b981" opacity="0.75" />
          <path d="M0 120 L0 98 L72 78 L128 92 L184 72 L248 86 L320 76 L320 120 Z" fill="#059669" />
        </svg>
      </div>
    );
  }

  if (variant === 'stats') {
    return (
      <div className="relative mt-5 flex h-28 flex-col overflow-hidden rounded-xl border border-orange-100 bg-orange-50/60 p-3 text-left">
        <p className="text-xs font-semibold text-orange-700">Estadísticas</p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] leading-tight text-orange-900/80">
          <div>
            <p className="font-medium text-orange-950">Visitas</p>
            <p className="text-sm font-bold text-orange-600">1.256</p>
          </div>
          <div>
            <p className="font-medium text-orange-950">Clics WhatsApp</p>
            <p className="text-sm font-bold text-orange-600">87</p>
          </div>
          <div>
            <p className="font-medium text-orange-950">Llamadas</p>
            <p className="text-sm font-bold text-orange-600">34</p>
          </div>
        </div>
        <div className="mt-auto h-8 rounded-md bg-linear-to-r from-orange-200 via-orange-400 to-orange-200 opacity-80" />
      </div>
    );
  }

  if (variant === 'premium-photo') {
    return (
      <div className="mt-5 h-28 overflow-hidden rounded-xl bg-linear-to-br from-slate-900 via-indigo-950 to-amber-900">
        <div className="flex h-full flex-col justify-end bg-linear-to-t from-black/50 to-transparent p-3">
          <p className="text-xs font-medium text-amber-100">Destacado en portada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 h-28 overflow-hidden rounded-xl bg-linear-to-br from-stone-200 via-stone-100 to-sky-100">
      <div className="flex h-full items-end bg-linear-to-t from-black/25 to-transparent p-3">
        <p className="text-xs font-medium text-white drop-shadow-sm">Tu negocio en el directorio</p>
      </div>
    </div>
  );
}

type PlanTheme = ReturnType<typeof getPlanTheme>;

export default function PlanPricingCard({
  plan,
  plans,
  selected = false,
  disabled = false,
  onSelect,
  action,
  topBadge,
  showPopularBadge = true,
  showPreview = true,
  className,
}: PlanPricingCardProps) {
  const theme = getPlanTheme(plan.id);
  const Icon = theme.icon;
  const { previousPlanName, incremental, included, isFreeTier } = getPlanFeatureDisplay(
    plans,
    plan.id,
  );

  const interactive = !!onSelect && !disabled;
  const floatingBadge =
    topBadge ??
    (theme.defaultTopBadge && showPopularBadge ? (
      <Badge className={cn('border-0 uppercase tracking-wide', theme.badgeClass)}>
        {theme.defaultTopBadge}
      </Badge>
    ) : null);

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-disabled={interactive ? disabled : undefined}
      onClick={interactive ? onSelect : undefined}
      onKeyDown={
        interactive
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect?.();
              }
            }
          : undefined
      }
      className={cn(
        'relative flex h-full min-h-0 flex-col rounded-2xl border bg-card p-4 shadow-sm sm:p-5',
        theme.borderClass,
        theme.cardClass,
        selected && 'border-primary shadow-md ring-2 ring-primary/20',
        interactive && !selected && 'cursor-pointer hover:shadow-md',
        interactive && 'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        disabled && 'pointer-events-none opacity-70',
        className,
      )}
    >
      <div className="relative shrink-0 flex flex-col items-center text-center">
        {floatingBadge && (
          <div className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap">
            {floatingBadge}
          </div>
        )}

        <div
          className={cn(
            'mb-3 flex h-12 w-12 items-center justify-center rounded-full shadow-sm',
            theme.iconWrapClass,
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>

        <h3 className={cn('text-xl font-extrabold uppercase tracking-wide sm:text-2xl', theme.nameClass)}>
          {plan.name}
        </h3>

        <div className="mt-2 flex flex-col items-center gap-1">
          <span className={cn('text-2xl font-extrabold sm:text-3xl', theme.priceClass)}>
            {formatPlanPrice(plan)}
            {plan.price > 0 && (
              <span className="text-base font-bold sm:text-lg">/{plan.interval}</span>
            )}
          </span>
          {(isFreeTier || theme.priceSubtitle) && (
            <span className={cn('text-xs font-semibold uppercase tracking-wide', theme.priceClass)}>
              {theme.priceSubtitle ?? 'Para siempre'}
            </span>
          )}
          <div className="flex min-h-[26px] items-center justify-center">
            {theme.subBadge && showPopularBadge ? (
              <Badge variant="outline" className={cn('border-0', theme.badgeClass)}>
                {theme.subBadge}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 min-h-0 flex-1">
        {isFreeTier ? (
          <ul className="space-y-2">
            {included.map(feature => (
              <li key={feature} className="flex items-start gap-2 text-left text-sm">
                <Check className={cn('mt-0.5 h-4 w-4 shrink-0', theme.checkClass)} strokeWidth={2.5} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-2 text-left">
            {previousPlanName && (
              <p className="text-sm font-semibold text-foreground">
                Todo lo de {previousPlanName.toUpperCase()}, más:
              </p>
            )}
            <ul className="space-y-2">
              {incremental.map(feature => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className={cn('mt-0.5 h-4 w-4 shrink-0', theme.checkClass)} strokeWidth={2.5} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-auto shrink-0">
        {showPreview && <PlanPreview variant={theme.preview} />}

        <div className="mt-4 flex min-h-10 items-center">{action ?? null}</div>
      </div>
    </div>
  );
}
