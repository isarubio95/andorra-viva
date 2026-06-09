import type { ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getComparisonFeatures, getPlanIncludedFeatures, sortPlansByPrice } from '@/lib/plan-display';
import { cn } from '@/lib/utils';
import type { Plan } from '@/types/domain';

export interface PlanComparisonColumn {
  plan: Plan;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  action?: ReactNode;
  topBadge?: ReactNode;
  showPopularBadge?: boolean;
}

interface PlanComparisonGridProps {
  /** Catálogo visible: define las filas compartidas entre columnas. */
  comparePlans: Plan[];
  columns: PlanComparisonColumn[];
  className?: string;
}

interface PlanColumnCardProps extends PlanComparisonColumn {
  features: string[];
  included: Set<string>;
  featureCount: number;
  subgrid?: boolean;
  stacked?: boolean;
  totalRows?: number;
  colIndex?: number;
}

function PlanColumnCard({
  plan,
  selected,
  disabled,
  onSelect,
  action,
  topBadge,
  showPopularBadge = true,
  features,
  included,
  featureCount,
  subgrid,
  stacked,
  totalRows,
  colIndex,
}: PlanColumnCardProps) {
  const interactive = !!onSelect && !disabled;
  const floatingBadge =
    topBadge ??
    (showPopularBadge && plan.is_popular ? (
      <Badge className="border-0 bg-accent text-accent-foreground">Más popular</Badge>
    ) : null);
  const needsStackedBadgeSpacing =
    stacked && floatingBadge && (plan.id === 'pro' || plan.id === 'premium');

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
      style={
        subgrid && totalRows != null && colIndex != null
          ? {
              gridColumn: colIndex + 1,
              gridRow: `1 / span ${totalRows}`,
            }
          : undefined
      }
      className={cn(
        'relative rounded-2xl border bg-card p-4 sm:p-6',
        needsStackedBadgeSpacing && 'mt-2',
        subgrid ? 'grid grid-rows-subgrid gap-0' : 'flex flex-col',
        'transition-[box-shadow,border-color,transform] duration-300 ease-in-out',
        selected && 'border-primary shadow-md ring-2 ring-primary/20',
        interactive && !selected && 'cursor-pointer hover:border-muted-foreground/20 hover:shadow-md',
        interactive && 'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        disabled && 'pointer-events-none opacity-70',
      )}
    >
      <div className="relative flex flex-col items-center text-center">
        {floatingBadge && (
          <div className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2">
            {floatingBadge}
          </div>
        )}
        <h3 className="text-lg font-bold text-foreground sm:text-xl">{plan.name}</h3>
        <div className="mt-2 flex items-baseline justify-center gap-0.5 sm:mt-3">
          <span className="text-2xl font-extrabold text-foreground sm:text-3xl">
            {plan.price}{plan.currency}
          </span>
          {plan.price > 0 && (
            <span className="text-sm text-muted-foreground">/{plan.interval.toLowerCase()}</span>
          )}
        </div>
      </div>

      <ul className={cn(subgrid ? 'contents' : 'mt-4 space-y-0')}>
        {features.map((feature, featureIndex) => {
          const hasFeature = included.has(feature);
          return (
            <li
              key={feature}
              className={cn(
                'flex min-h-11 items-center gap-2 text-sm',
                featureIndex < featureCount - 1 && 'border-b border-border/50',
                !subgrid && featureIndex === 0 && 'border-t border-border/50 pt-1',
              )}
            >
              {hasFeature ? (
                <Check className="h-4 w-4 shrink-0 text-accent" strokeWidth={2.5} />
              ) : (
                <X className="h-4 w-4 shrink-0 text-destructive" strokeWidth={2.5} />
              )}
              <span className={cn(!hasFeature && 'text-muted-foreground')}>{feature}</span>
            </li>
          );
        })}
      </ul>

      <div className={cn(subgrid ? 'flex items-end' : 'mt-4')}>{action ?? null}</div>
    </div>
  );
}

function getComparisonGridClasses(colCount: number): string {
  if (colCount === 1) return 'grid-cols-1';
  if (colCount === 2) return 'grid-cols-2';
  if (colCount === 3) return 'grid-cols-3';
  return 'grid-cols-4';
}

function getStackedHiddenClass(colCount: number): string {
  if (colCount === 1) return 'hidden';
  if (colCount === 2) return 'sm:hidden';
  if (colCount === 3) return 'lg:hidden';
  return 'xl:hidden';
}

function getComparisonHiddenClass(colCount: number): string {
  if (colCount === 1) return '';
  if (colCount === 2) return 'hidden sm:grid';
  if (colCount === 3) return 'hidden lg:grid';
  return 'hidden xl:grid';
}

export default function PlanComparisonGrid({ comparePlans, columns, className }: PlanComparisonGridProps) {
  const sortedColumns = sortPlansByPrice(columns.map(c => c.plan)).map(
    plan => columns.find(c => c.plan.id === plan.id)!,
  );
  const features = getComparisonFeatures(comparePlans);
  const colCount = sortedColumns.length;
  const featureCount = features.length;
  const totalRows = featureCount + 2;
  const useStackedLayout = colCount > 1;
  const hasFloatingBadge = sortedColumns.some(
    column => column.topBadge || (column.showPopularBadge !== false && column.plan.is_popular),
  );

  const columnCards = sortedColumns.map((column, colIndex) => {
    const included = getPlanIncludedFeatures(comparePlans, column.plan.id);
    return (
      <PlanColumnCard
        key={column.plan.id}
        {...column}
        features={features}
        included={included}
        featureCount={featureCount}
        subgrid
        totalRows={totalRows}
        colIndex={colIndex}
      />
    );
  });

  const stackedCards = sortedColumns.map(column => {
    const included = getPlanIncludedFeatures(comparePlans, column.plan.id);
    return (
      <PlanColumnCard
        key={column.plan.id}
        {...column}
        features={features}
        included={included}
        featureCount={featureCount}
        stacked
      />
    );
  });

  return (
    <>
      {useStackedLayout && (
        <div
          className={cn(
            'flex flex-col gap-4',
            hasFloatingBadge && 'pt-5',
            getStackedHiddenClass(colCount),
            className,
          )}
        >
          {stackedCards}
        </div>
      )}

      <div
        className={cn(
          'grid gap-4',
          hasFloatingBadge && 'pt-5',
          getComparisonGridClasses(colCount),
          getComparisonHiddenClass(colCount),
          className,
        )}
        style={{
          gridTemplateRows: [
            'auto',
            ...Array(featureCount).fill('minmax(2.75rem, auto)'),
            'auto',
          ].join(' '),
        }}
      >
        {columnCards}
      </div>
    </>
  );
}
