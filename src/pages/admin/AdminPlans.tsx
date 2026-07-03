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
};

function toForm(plan: Plan): PlanFormState {
  return {
    name: plan.name,
    price: String(plan.price),
    featuresText: (plan.features ?? []).join('\n'),
    is_popular: plan.is_popular,
  };
}

function isPlanDirty(plan: Plan, form: PlanFormState | undefined) {
  if (!form) return false;
  const original = toForm(plan);
  return (
    form.name !== original.name ||
    form.price !== original.price ||
    form.featuresText !== original.featuresText ||
    form.is_popular !== original.is_popular
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
    setForms(prev => ({ ...prev, [planId]: { ...prev[planId], ...patch } }));
  };

  const handleSave = async (planId: string) => {
    const form = forms[planId];
    if (!form) return;

    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      toast({ title: 'Precio inválido', variant: 'destructive' });
      return;
    }

    const features = form.featuresText
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);

    setSavingId(planId);
    const res = await adminUpdatePlan(planId, {
      name: form.name.trim(),
      price,
      features,
      is_popular: form.is_popular,
    });
    setSavingId(null);

    if (!res.ok) {
      toast({ title: 'Error al guardar', description: res.error, variant: 'destructive' });
      return;
    }

    toast({ title: 'Plan actualizado', description: form.name });
    void load();
  };

  const renderPlanCard = (plan: Plan) => {
    const form = forms[plan.id];
    if (!form) return null;

    return (
      <Card key={plan.id}>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg">{plan.id}</CardTitle>
            {plan.is_popular ? <Badge>Popular</Badge> : null}
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
                step={1}
                value={form.price}
                onChange={e => updateForm(plan.id, { price: e.target.value })}
              />
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
            Edita precios, nombres y características de los planes de suscripción.
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
