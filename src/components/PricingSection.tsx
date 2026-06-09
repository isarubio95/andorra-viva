import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import PlanComparisonGrid from '@/components/PlanComparisonGrid';
import { sortPlansByPrice } from '@/lib/plan-display';
import type { Plan } from '@/types/domain';

interface PricingSectionProps {
  plans: Plan[];
}

export default function PricingSection({ plans }: PricingSectionProps) {
  const sortedPlans = sortPlansByPrice(plans);

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
          className="mx-auto max-w-6xl"
          comparePlans={sortedPlans}
          columns={sortedPlans.map(plan => ({
            plan,
            action: (
              <Button
                className={`w-full ${plan.is_popular ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}`}
                variant={plan.is_popular ? 'default' : 'outline'}
                asChild
              >
                <Link to={`/signup?plan=${encodeURIComponent(plan.id)}`}>
                  {plan.price === 0 ? 'Empezar gratis' : 'Elegir plan'}
                </Link>
              </Button>
            ),
          }))}
        />
      </div>
    </section>
  );
}
