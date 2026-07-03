import { Link } from 'react-router-dom';
import { BarChart3, Crown, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PlanComparisonGrid from '@/components/PlanComparisonGrid';
import { getPlanTheme, getVisiblePlans } from '@/lib/plan-display';
import type { Plan } from '@/types/domain';

interface PricingSectionProps {
  plans: Plan[];
}

const FOOTER_ITEMS = [
  {
    planId: 'free',
    icon: MapPin,
    text: 'Más visibilidad para tu negocio',
  },
  {
    planId: 'basic',
    icon: Users,
    text: 'Conecta con más clientes',
  },
  {
    planId: 'pro',
    icon: Crown,
    text: 'Impulsa tu imagen y reputación',
  },
  {
    planId: 'premium',
    icon: BarChart3,
    text: 'Haz crecer tu negocio',
  },
] as const;

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

        <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {FOOTER_ITEMS.map(item => {
            const theme = getPlanTheme(item.planId);
            const Icon = item.icon;
            return (
              <div key={item.planId} className="flex flex-col items-center gap-2 text-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${theme.iconWrapClass}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <p className={`text-sm font-medium ${theme.nameClass}`}>{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function cnButton(buttonClass: string): string {
  return `w-full rounded-full ${buttonClass}`;
}
