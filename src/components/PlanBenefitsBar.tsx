import { BarChart3, Crown, MapPin, Users } from 'lucide-react';
import { getPlanTheme } from '@/lib/plan-display';
import { cn } from '@/lib/utils';

const BENEFIT_ITEMS = [
  {
    planId: 'free',
    icon: MapPin,
    text: ['Más visibilidad', 'para tu negocio'],
  },
  {
    planId: 'basic',
    icon: Users,
    text: ['Conecta con', 'más clientes'],
  },
  {
    planId: 'pro',
    icon: Crown,
    text: ['Impulsa tu imagen', 'y reputación'],
  },
  {
    planId: 'premium',
    icon: BarChart3,
    text: ['Haz crecer', 'tu negocio'],
  },
] as const;

interface PlanBenefitsBarProps {
  className?: string;
}

export default function PlanBenefitsBar({ className }: PlanBenefitsBarProps) {
  return (
    <div
      className={cn(
        'hidden rounded-2xl border border-border/60 bg-linear-to-b from-white to-muted/60 py-4 shadow-sm lg:grid lg:grid-cols-4 lg:divide-x lg:divide-muted-foreground/35',
        className,
      )}
    >
      {BENEFIT_ITEMS.map(item => {
        const theme = getPlanTheme(item.planId);
        const Icon = item.icon;
        return (
          <div
            key={item.planId}
            className="flex items-center justify-center gap-3 px-4 py-3 text-center"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${theme.iconWrapClass}`}
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
            <p className="text-sm font-medium leading-tight text-foreground">
              {item.text[0]}
              <br />
              {item.text[1]}
            </p>
          </div>
        );
      })}
    </div>
  );
}
