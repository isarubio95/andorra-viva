import { useEffect, useState } from 'react';
import AdminShell from '@/pages/admin/AdminShell';
import { adminListAllPlans, adminUpdatePlan } from '@/services/admin-api';
import type { Plan } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

type PlanFormState = {
  name: string;
  price: string;
  featuresText: string;
  is_popular: boolean;
  trial_months: string;
  promo_label: string;
};

function defaultPromoLabel(months: number): string {
  if (months <= 0) return '';
  return months === 1 ? '1 mes gratis' : `${months} meses gratis`;
}

function toForm(plan: Plan): PlanFormState {
  return {
    name: plan.name,
    price: String(plan.price),
    featuresText: (plan.features ?? []).join('\n'),
    is_popular: plan.is_popular,
    trial_months: String(plan.trial_months ?? 0),
    promo_label: plan.promo_label ?? '',
  };
}

function isPlanDirty(plan: Plan, form: PlanFormState | undefined) {
  if (!form) return false;
  const original = toForm(plan);
  return (
    form.name !== original.name ||
    form.price !== original.price ||
    form.featuresText !== original.featuresText ||
    form.is_popular !== original.is_popular ||
    form.trial_months !== original.trial_months ||
    form.promo_label !== original.promo_label
  );
}

export default function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [forms, setForms] = useState<Record<string, PlanFormState>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const rows = await adminListAllPlans();
    setPlans(rows);
    setForms(Object.fromEntries(rows.map(p => [p.id, toForm(p)])));
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const updateForm = (planId: string, patch: Partial<PlanFormState>) => {
    setForms(prev => {
      const current = prev[planId];
      if (!current) return prev;
      const next = { ...current, ...patch };

      if ('trial_months' in patch && !('promo_label' in patch)) {
        const months = Number(next.trial_months);
        if (Number.isFinite(months) && months > 0 && !current.promo_label.trim()) {
          next.promo_label = defaultPromoLabel(Math.floor(months));
        }
        if (Number.isFinite(months) && months <= 0) {
          next.promo_label = '';
        }
      }

      return { ...prev, [planId]: next };
    });
  };

  const handleSave = async (planId: string) => {
    const form = forms[planId];
    if (!form) return;

    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      toast({ title: 'Precio inválido', variant: 'destructive' });
      return;
    }

    const trialMonths = Number(form.trial_months);
    if (!Number.isFinite(trialMonths) || trialMonths < 0 || !Number.isInteger(trialMonths)) {
      toast({ title: 'Meses gratis inválidos', variant: 'destructive' });
      return;
    }

    const features = form.featuresText
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);

    const promoLabel =
      trialMonths > 0
        ? form.promo_label.trim() || defaultPromoLabel(trialMonths)
        : null;

    setSavingId(planId);
    const res = await adminUpdatePlan(planId, {
      name: form.name.trim(),
      price,
      features,
      is_popular: form.is_popular,
      trial_months: trialMonths,
      promo_label: promoLabel,
    });
    setSavingId(null);

    if (!res.ok) {
      toast({ title: 'Error al guardar', description: res.error, variant: 'destructive' });
      return;
    }

    toast({
      title: 'Plan actualizado',
      description: res.stripe_synced
        ? `${form.name} · precio sincronizado con Stripe`
        : form.name,
    });
    void load();
  };

  const renderPlanCard = (plan: Plan) => {
    const form = forms[plan.id];
    if (!form) return null;

    const trialMonths = Number(form.trial_months) || 0;
    const isPaidPlan = plan.price > 0 || Number(form.price) > 0;

    return (
      <Card key={plan.id}>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg">{plan.id}</CardTitle>
            <div className="flex gap-2">
              {trialMonths > 0 && isPaidPlan ? (
                <Badge variant="secondary">{trialMonths} mes(es) gratis</Badge>
              ) : null}
              {plan.is_popular ? <Badge>Popular</Badge> : null}
            </div>
          </div>
          <CardDescription>
            {plan.currency}/{plan.interval} — visible en signup y panel de cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`name-${plan.id}`}>Nombre</Label>
              <Input
                id={`name-${plan.id}`}
                value={form.name}
                onChange={e => updateForm(plan.id, { name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`price-${plan.id}`}>Precio (€)</Label>
              <Input
                id={`price-${plan.id}`}
                type="number"
                min={0}
                step={0.01}
                value={form.price}
                onChange={e => updateForm(plan.id, { price: e.target.value })}
              />
              {isPaidPlan ? (
                <p className="text-xs text-muted-foreground">
                  Al guardar se crea/actualiza el precio en Stripe (los Prices son inmutables: se
                  genera uno nuevo y se archiva el anterior).
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`features-${plan.id}`}>Características (una por línea)</Label>
            <Textarea
              id={`features-${plan.id}`}
              rows={5}
              value={form.featuresText}
              onChange={e => updateForm(plan.id, { featuresText: e.target.value })}
            />
          </div>

          {isPaidPlan ? (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
              <div>
                <p className="text-sm font-medium">Oferta promocional</p>
                <p className="text-xs text-muted-foreground">
                  Configura meses gratis para este plan. Se mostrará un badge en la página de
                  precios y se aplicará un periodo de prueba en Stripe al suscribirse (igual
                  que el precio del catálogo).
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`trial-${plan.id}`}>Meses gratis</Label>
                  <Input
                    id={`trial-${plan.id}`}
                    type="number"
                    min={0}
                    max={24}
                    step={1}
                    value={form.trial_months}
                    onChange={e => updateForm(plan.id, { trial_months: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`promo-${plan.id}`}>Texto del badge</Label>
                  <Input
                    id={`promo-${plan.id}`}
                    value={form.promo_label}
                    onChange={e => updateForm(plan.id, { promo_label: e.target.value })}
                    placeholder={trialMonths > 0 ? defaultPromoLabel(trialMonths) : 'Sin oferta'}
                    disabled={trialMonths <= 0}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <Switch
              id={`popular-${plan.id}`}
              checked={form.is_popular}
              onCheckedChange={v => updateForm(plan.id, { is_popular: v })}
            />
            <Label htmlFor={`popular-${plan.id}`}>Marcar como plan popular</Label>
          </div>

          <Button
            onClick={() => void handleSave(plan.id)}
            disabled={savingId === plan.id || !isPlanDirty(plan, form)}
          >
            {savingId === plan.id ? 'Guardando…' : 'Guardar plan'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Planes</h2>
          <p className="text-muted-foreground">
            Edita precios, características y ofertas (meses gratis). Los planes de pago se
            sincronizan automáticamente con Stripe al guardar.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">{plans.map(renderPlanCard)}</div>
        )}
      </div>
    </AdminShell>
  );
}
