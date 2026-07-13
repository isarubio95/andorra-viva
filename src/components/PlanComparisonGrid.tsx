import type { ReactNode } from 'react';
import PlanPricingCard from '@/components/PlanPricingCard';
import { getPlanTheme, getVisiblePlans, sortPlansByPrice } from '@/lib/plan-display';
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
  showPreview?: boolean;
}

interface PlanComparisonGridProps {
  /** Catálogo visible: define las filas compartidas entre columnas. */
  comparePlans: Plan[];
  columns: PlanComparisonColumn[];
  className?: string;
  showPreview?: boolean;
}

function getGridClasses(colCount: number): string {
  if (colCount === 1) return 'grid-cols-1';
  if (colCount === 2) return 'grid-cols-1 sm:grid-cols-2';
  if (colCount === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  return 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4';
}

export default function PlanComparisonGrid({
  comparePlans,
  columns,
  className,
  showPreview = true,
}: PlanComparisonGridProps) {
  const visibleComparePlans = getVisiblePlans(comparePlans);
  const sortedColumns = sortPlansByPrice(columns.map(c => c.plan))
    .map(plan => columns.find(c => c.plan.id === plan.id)!)
    .filter(column => visibleComparePlans.some(p => p.id === column.plan.id));
  const colCount = sortedColumns.length;
  const hasFloatingBadge = sortedColumns.some(column => {
    if (column.topBadge) return true;
    if (column.showPopularBadge === false) return false;
    return !!getPlanTheme(column.plan.id).defaultTopBadge;
  });

  return (
    <div
      className={cn(
        'grid auto-rows-auto items-start gap-4 sm:auto-rows-fr sm:items-stretch sm:gap-5',
        hasFloatingBadge && 'pt-5',
        getGridClasses(colCount),
        className,
      )}
    >
      {sortedColumns.map(column => (
        <div key={column.plan.id} className="flex min-h-0 flex-col sm:h-full">
          <PlanPricingCard
            plan={column.plan}
            plans={visibleComparePlans}
            selected={column.selected}
            disabled={column.disabled}
            onSelect={column.onSelect}
            action={column.action}
            topBadge={column.topBadge}
            showPopularBadge={column.showPopularBadge}
            showPreview={column.showPreview ?? showPreview}
            className="sm:flex-1"
          />
        </div>
      ))}
    </div>
  );
}
