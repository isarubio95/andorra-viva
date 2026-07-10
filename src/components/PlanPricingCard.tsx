import type { ReactNode } from 'react';
import { Check, Crown, MapPin, Sparkles, Star } from 'lucide-react';
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
      <div className="relative mt-5 h-28 overflow-hidden rounded-xl bg-linear-to-br from-slate-900 via-indigo-950 to-amber-950 p-2.5">
        <Sparkles className="absolute right-2 top-2 h-3.5 w-3.5 text-amber-300/80" strokeWidth={2} />
        <p className="text-[9px] font-semibold uppercase tracking-wide text-amber-200/70">
          Portada · Destacados
        </p>
        <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-amber-400/40 bg-white/10 p-1.5 shadow-sm backdrop-blur-sm ring-1 ring-amber-300/20">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-linear-to-br from-amber-300 via-yellow-500 to-amber-700">
            <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
            <MapPin className="absolute bottom-0.5 left-0.5 h-3 w-3 text-white/90" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <span className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-amber-400 to-yellow-500 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-amber-950 shadow-sm">
              <Crown className="h-2.5 w-2.5" strokeWidth={2.5} />
              Destacado
            </span>
            <div className="mt-1 h-2 w-4/5 rounded-full bg-white/80" />
            <div className="mt-1 flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" strokeWidth={0} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 h-28 overflow-hidden rounded-xl border border-blue-100 bg-linear-to-br from-sky-50 to-blue-100/70 p-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-blue-500/80">
        Directorio · Resultado
      </p>
      <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-blue-100 bg-white p-1.5 shadow-sm">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-linear-to-br from-sky-300 via-blue-400 to-blue-600">
          <div className="absolute inset-0 bg-linear-to-t from-black/25 to-transparent" />
          <MapPin className="absolute bottom-0.5 left-0.5 h-3 w-3 text-white/90" strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="h-2 w-4/5 rounded-full bg-blue-900/70" />
          <div className="mt-1 flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" strokeWidth={0} />
            ))}
          </div>
          <span className="mt-1 inline-flex w-fit items-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-white">
            Tu negocio
          </span>
        </div>
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
        'group relative flex h-full min-h-0 flex-col',
        interactive && !selected && 'cursor-pointer',
        interactive &&
          'rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        disabled && 'pointer-events-none opacity-70',
        className,
      )}
    >
      {floatingBadge && (
        <div className="pointer-events-none absolute -top-3.5 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap drop-shadow-md">
          {floatingBadge}
        </div>
      )}

      <div
        className={cn(
          'flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border bg-card shadow-lg transition-all duration-300',
          theme.borderClass,
          theme.cardClass,
          theme.glowClass,
          interactive && !selected && 'group-hover:-translate-y-1 group-hover:shadow-xl',
          selected && 'ring-2 ring-primary/40 shadow-xl',
        )}
      >
        <div
          className={cn(
            'relative shrink-0 overflow-hidden px-4 pb-6 pt-9 text-center text-white sm:px-5',
            theme.headerClass,
          )}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-white/25 to-transparent"
            aria-hidden
          />

          <div className="relative flex flex-col items-center">
            <div
              className={cn(
                'mb-3 flex h-16 w-16 items-center justify-center rounded-full shadow-lg',
                theme.iconWrapClass,
              )}
            >
              <Icon className="h-7 w-7 drop-shadow-sm" strokeWidth={2.25} />
            </div>

            <h3 className="text-2xl font-black uppercase tracking-wide drop-shadow-sm sm:text-3xl">
              {plan.name}
            </h3>

            <div className="mt-1 flex flex-col items-center gap-1">
              <span className="text-3xl font-black drop-shadow-sm sm:text-4xl">
                {formatPlanPrice(plan)}
                {plan.price > 0 && (
                  <span className="text-lg font-bold sm:text-xl">/{plan.interval}</span>
                )}
              </span>
              {theme.priceSubtitle && (
                <span className="text-xs font-semibold uppercase tracking-wide text-white/85">
                  {theme.priceSubtitle}
                </span>
              )}
              <div className="flex min-h-[26px] items-center justify-center">
                {theme.subBadge && showPopularBadge ? (
                  <Badge
                    className={cn(
                      'border-0 bg-white/95 font-bold uppercase tracking-wide text-foreground shadow-sm',
                    )}
                  >
                    {theme.subBadge}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 px-4 py-4 sm:px-5">
          {isFreeTier ? (
            <ul className="space-y-2.5">
              {included.map(feature => (
                <li key={feature} className="flex items-start gap-2.5 text-left text-sm">
                  <span
                    className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full shadow-sm',
                      theme.checkWrapClass,
                    )}
                  >
                    <Check className={cn('h-3 w-3', theme.checkClass)} strokeWidth={3} />
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-2.5 text-left">
              {previousPlanName && (
                <p className="text-sm font-semibold text-foreground">
                  Todo lo de {previousPlanName.toUpperCase()}, más:
                </p>
              )}
              <ul className="space-y-2.5">
                {incremental.map(feature => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <span
                      className={cn(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full shadow-sm',
                        theme.checkWrapClass,
                      )}
                    >
                      <Check className={cn('h-3 w-3', theme.checkClass)} strokeWidth={3} />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-auto shrink-0 px-4 pb-4 sm:px-5">
          {showPreview && theme.preview && <PlanPreview variant={theme.preview} />}

          <div className="mt-4 flex min-h-10 items-center">{action ?? null}</div>
        </div>
      </div>
    </div>
  );
}
