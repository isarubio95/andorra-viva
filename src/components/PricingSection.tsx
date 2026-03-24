import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Plan } from '@/data/mockData';

interface PricingSectionProps {
  plans: Plan[];
}

export default function PricingSection({ plans }: PricingSectionProps) {
  return (
    <section id="precios" className="bg-muted/50 py-16">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold">Planes para tu negocio</h2>
          <p className="mt-2 text-muted-foreground">
            Elige el plan que mejor se adapte a las necesidades de tu empresa.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border bg-card p-8 transition-shadow hover:shadow-xl ${
                plan.is_popular ? 'ring-2 ring-accent' : ''
              }`}
            >
              {plan.is_popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground border-0">
                  Más popular
                </Badge>
              )}

              <h3 className="text-xl font-bold">{plan.name}</h3>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">
                  {plan.price === 0 ? 'Gratis' : `${plan.price}${plan.currency}`}
                </span>
                {plan.price > 0 && (
                  <span className="text-sm text-muted-foreground">/{plan.interval}</span>
                )}
              </div>

              <ul className="mt-8 flex flex-1 flex-col gap-3">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`mt-8 w-full ${plan.is_popular ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}`}
                variant={plan.is_popular ? 'default' : 'outline'}
              >
                {plan.price === 0 ? 'Empezar gratis' : 'Elegir plan'}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
