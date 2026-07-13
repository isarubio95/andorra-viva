import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import PlanComparisonGrid from '@/components/PlanComparisonGrid';
import PlanBenefitsBar from '@/components/PlanBenefitsBar';
import { getPlanTheme, getVisiblePlans } from '@/lib/plan-display';
import type { Plan } from '@/types/domain';

interface PricingSectionProps {
  plans: Plan[];
}

export default function PricingSection({ plans }: PricingSectionProps) {
  const visiblePlans = getVisiblePlans(plans);

  return (
    <section id="precios" className="bg-muted/50 py-16">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold">Planes para tu negocio</h2>
          <p className="mt-2 text-muted-foreground">
            Elige el plan que mejor se adapte a las necesidades de tu empresa.
          </p>
        </div>

        <PlanComparisonGrid
          className="mx-auto max-w-7xl"
          comparePlans={visiblePlans}
          columns={visiblePlans.map(plan => {
            const theme = getPlanTheme(plan.id);
            return {
              plan,
              action:
                plan.price === 0 ? undefined : (
                  <Button className={cnButton(theme.buttonClass)} variant="default" asChild>
                    <Link to={`/signup?plan=${encodeURIComponent(plan.id)}`}>
                      Elegir {plan.name}
                    </Link>
                  </Button>
                ),
            };
          })}
        />

        <PlanBenefitsBar className="mx-auto mt-10 max-w-5xl" />
      </div>
    </section>
  );
}

function cnButton(buttonClass: string): string {
  return `w-full rounded-full ${buttonClass}`;
}
