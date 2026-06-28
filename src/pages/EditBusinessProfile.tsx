import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Eye,
  ImagePlus,
  Lock,
  Phone,
  Globe,
  MapPin,
  Save,
  Sparkles,
  Store,
  X,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BusinessProfileView from '@/components/BusinessProfileView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getBusinessById, updateMyBusiness } from '@/services/api';
import type { Business } from '@/types/domain';
import { isOwnBusiness } from '@/lib/business-access';
import { BUSINESS_CATEGORIES } from '@/constants/businessCategories';
import { getSubcategoriesForCategory } from '@/constants/businessSubcategories';
import BusinessServicesPicker from '@/components/BusinessServicesPicker';
import BusinessHoursEditor from '@/components/BusinessHoursEditor';
import SortablePhotoGrid from '@/components/SortablePhotoGrid';
import { BUSINESS_LOCATIONS } from '@/constants/businessForm';
import {
  getMaxPhotosForTier,
  getMaxServicesForTier,
  getNextPlanTier,
  isProfileGroupAvailable,
  planLabelForTier,
  requiredPlanForGroup,
  resolveProfilePlanTier,
  type ProfileFieldGroup,
} from '@/lib/business-profile-plan';
import { supabase } from '@/lib/supabase';
import {
  BUSINESS_IMAGE_FALLBACK,
  resolveBusinessImageUrl,
  rewriteSupabaseStorageUrl,
} from '@/lib/business-image';
import { cn } from '@/lib/utils';
import { accountDashboardPath, navigateAccountDashboardTab } from '@/lib/account-dashboard';
import {
  createDefaultOpeningHours,
  openingHoursEqual,
  type BusinessOpeningHours,
} from '@/lib/business-hours';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from '@/components/ui/drawer';

type EditablePhoto =
  | { id: string; kind: 'existing'; url: string }
  | { id: string; kind: 'new'; file: File; preview: string };

function createPhotoId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeImageList(urls: string[]): string[] {
  return urls.map(url => rewriteSupabaseStorageUrl(url) ?? url);
}

function sameOrderedList(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function sameStringList(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

function resolveStoredOpeningHours(
  hours: BusinessOpeningHours | null | undefined,
): BusinessOpeningHours {
  return hours ?? createDefaultOpeningHours();
}

function coordsMatch(formValue: string, stored: number | null | undefined): boolean {
  const parsed = parseFloat(formValue);
  if (stored == null || Number.isNaN(parsed)) {
    return formValue === String(stored);
  }
  return parsed === stored;
}

function LockedSection({
  group,
  tier,
  children,
}: {
  group: ProfileFieldGroup;
  tier: ReturnType<typeof resolveProfilePlanTier>;
  children: React.ReactNode;
}) {
  const available = isProfileGroupAvailable(tier, group);
  const required = requiredPlanForGroup(group);

  if (available) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-40 blur-[0.3px]">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 bg-background/85 p-4 text-center backdrop-blur-[1px]">
        <Lock className="h-5 w-5 text-primary" />
        <p className="text-sm font-medium text-foreground">
          Disponible con plan {planLabelForTier(required)}
        </p>
        <Button size="sm" variant="outline" asChild className="pointer-events-auto">
          <Link to={accountDashboardPath('plan')}>
            Ver planes
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function EditBusinessProfile() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { user, hasProAccess, planId, role, subscriptionStatus, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [priceRange, setPriceRange] = useState('2');
  const [minAge, setMinAge] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [latitude, setLatitude] = useState('42.5063');
  const [longitude, setLongitude] = useState('1.5218');
  const [photos, setPhotos] = useState<EditablePhoto[]>([]);
  const [openingHours, setOpeningHours] = useState<BusinessOpeningHours>(createDefaultOpeningHours);
  const [previewOpen, setPreviewOpen] = useState(false);

  const planTier = resolveProfilePlanTier(planId, role);
  const maxServices = getMaxServicesForTier(planTier);
  const maxPhotos = getMaxPhotosForTier(planTier);
  const upgradePlanTier = getNextPlanTier(planTier);
  const upgradeMaxServices = upgradePlanTier ? getMaxServicesForTier(upgradePlanTier) : null;
  const upgradeMaxPhotos = upgradePlanTier ? getMaxPhotosForTier(upgradePlanTier) : null;
  const totalPhotos = photos.length;
  const showPremiumPreview =
    planTier === 'premium' &&
    (subscriptionStatus === 'active' || subscriptionStatus === 'trialing' || role === 'admin');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!hasProAccess) {
      navigate('/mi-cuenta', { replace: true });
    }
  }, [user, authLoading, hasProAccess, navigate]);

  useEffect(() => {
    if (!businessId || !user?.id) return;

    setLoading(true);
    getBusinessById(businessId)
      .then(row => {
        if (!row || !isOwnBusiness(user.id, row)) {
          toast({ title: 'Negocio no encontrado', variant: 'destructive' });
          navigate('/mi-cuenta', { replace: true });
          return;
        }
        setBusiness(row);
        setName(row.name);
        setCategory(row.category);
        setSubcategory(row.subcategory ?? '');
        setLocation(row.location);
        setDescription(row.description);
        setPhone(row.phone ?? '');
        setWebsite(row.website ?? '');
        setPriceRange(String(row.price_range || 2));
        setMinAge(row.min_age != null ? String(row.min_age) : '');
        setSelectedServices(row.services ?? []);
        setLatitude(String(row.latitude));
        setLongitude(String(row.longitude));
        const gallery = row.gallery?.length ? row.gallery : row.image_url ? [row.image_url] : [];
        setPhotos(gallery.map(url => ({ id: createPhotoId(), kind: 'existing', url })));
        setOpeningHours(resolveStoredOpeningHours(row.opening_hours));
      })
      .finally(() => setLoading(false));
  }, [businessId, user?.id, navigate, toast]);

  const previewImages = useMemo(
    () => photos.map(photo => (photo.kind === 'existing' ? photo.url : photo.preview)).slice(0, maxPhotos),
    [photos, maxPhotos],
  );

  const sortablePhotoItems = useMemo(
    () =>
      photos.map(photo => ({
        id: photo.id,
        src: photo.kind === 'existing' ? resolveBusinessImageUrl(photo.url) : photo.preview,
        isNew: photo.kind === 'new',
      })),
    [photos],
  );

  const previewBusiness = useMemo<Business>(() => {
    const mainImage = previewImages[0] ?? business?.image_url ?? '';
    const gallery =
      previewImages.length > 0
        ? previewImages
        : business?.gallery?.slice(0, maxPhotos);
    return {
      id: business?.id ?? businessId ?? '',
      name,
      category,
      subcategory: subcategory || null,
      location,
      description,
      phone: isProfileGroupAvailable(planTier, 'contact') ? phone.trim() || null : null,
      website: isProfileGroupAvailable(planTier, 'contact') ? website.trim() || null : null,
      services: selectedServices.slice(0, maxServices),
      price_range: isProfileGroupAvailable(planTier, 'details') ? parseInt(priceRange, 10) : business?.price_range ?? 2,
      min_age:
        isProfileGroupAvailable(planTier, 'details') && minAge !== ''
          ? parseInt(minAge, 10)
          : null,
      latitude: parseFloat(latitude) || business?.latitude || 42.5063,
      longitude: parseFloat(longitude) || business?.longitude || 1.5218,
      image_url: mainImage,
      gallery,
      rating: business?.rating ?? 0,
      review_count: business?.review_count ?? 0,
      is_recommended: business?.is_recommended ?? false,
      is_premium: showPremiumPreview,
      opening_hours: openingHours,
    };
  }, [
    business,
    businessId,
    name,
    category,
    subcategory,
    location,
    description,
    phone,
    website,
    selectedServices,
    priceRange,
    minAge,
    latitude,
    longitude,
    previewImages,
    planTier,
    showPremiumPreview,
    maxPhotos,
    maxServices,
    openingHours,
  ]);

  const hasChanges = useMemo(() => {
    if (!business) return false;
    if (photos.some(photo => photo.kind === 'new')) return true;

    const originalGallery = normalizeImageList(
      business.gallery?.length
        ? business.gallery
        : business.image_url
          ? [business.image_url]
          : [],
    );
    const currentGallery = normalizeImageList(
      photos.filter((photo): photo is Extract<EditablePhoto, { kind: 'existing' }> => photo.kind === 'existing').map(
        photo => photo.url,
      ),
    );
    if (!sameOrderedList(currentGallery, originalGallery)) return true;

    if (name.trim() !== business.name.trim()) return true;
    if (category !== business.category) return true;
    if ((subcategory || null) !== (business.subcategory ?? null)) return true;
    if (location !== business.location) return true;
    if (description.trim() !== business.description.trim()) return true;
    if (!coordsMatch(latitude, business.latitude)) return true;
    if (!coordsMatch(longitude, business.longitude)) return true;
    if (!openingHoursEqual(openingHours, resolveStoredOpeningHours(business.opening_hours))) return true;

    if (isProfileGroupAvailable(planTier, 'contact')) {
      if ((phone.trim() || null) !== (business.phone?.trim() || null)) return true;
      if ((website.trim() || null) !== (business.website?.trim() || null)) return true;
    }

    if (!sameStringList(selectedServices, business.services ?? [])) return true;

    if (isProfileGroupAvailable(planTier, 'details')) {
      if (parseInt(priceRange, 10) !== business.price_range) return true;
      const currentMinAge = minAge !== '' ? parseInt(minAge, 10) : null;
      if (currentMinAge !== business.min_age) return true;
    }

    return false;
  }, [
    business,
    photos,
    name,
    category,
    subcategory,
    location,
    description,
    latitude,
    longitude,
    phone,
    website,
    selectedServices,
    priceRange,
    minAge,
    planTier,
    openingHours,
  ]);

  const leaveGuard = useUnsavedChangesGuard({ enabled: hasChanges && !saving });

  const toggleService = (service: string) => {
    setSelectedServices(prev => {
      if (prev.includes(service)) return prev.filter(s => s !== service);
      if (prev.length >= maxServices) {
        toast({
          title: `Máximo ${maxServices} servicios`,
          description: `Tu plan ${planLabelForTier(planTier)} permite seleccionar hasta ${maxServices}.`,
          variant: 'destructive',
        });
        return prev;
      }
      return [...prev, service];
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const remaining = maxPhotos - photos.length;
    if (remaining <= 0) {
      toast({
        title: `Máximo ${maxPhotos} fotos`,
        description: `Tu plan ${planLabelForTier(planTier)} permite subir hasta ${maxPhotos} imágenes.`,
        variant: 'destructive',
      });
      return;
    }

    const picked = files.slice(0, remaining);
    setPhotos(prev => [
      ...prev,
      ...picked.map(file => ({
        id: createPhotoId(),
        kind: 'new' as const,
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
    e.target.value = '';
  };

  const reorderPhotos = (from: number, to: number) => {
    setPhotos(prev => {
      if (from < 0 || from >= prev.length || to < 0 || to >= prev.length || from === to) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const photo = prev[index];
      if (!photo) return prev;
      if (photo.kind === 'new') URL.revokeObjectURL(photo.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadPhotoFile = async (file: File): Promise<string | null> => {
    if (!user?.id) return null;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('business-images').upload(path, file);
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    const { data } = supabase.storage.from('business-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const syncBusinessBaseline = (allImages: string[], lat: number, lon: number) => {
    if (!business) return;
    setBusiness({
      ...business,
      name: name.trim(),
      category,
      subcategory: subcategory || null,
      location,
      description: description.trim(),
      phone: isProfileGroupAvailable(planTier, 'contact') ? phone.trim() || null : business.phone,
      website: isProfileGroupAvailable(planTier, 'contact') ? website.trim() || null : business.website,
      services: selectedServices.slice(0, maxServices),
      price_range: isProfileGroupAvailable(planTier, 'details')
        ? parseInt(priceRange, 10)
        : business.price_range,
      min_age:
        isProfileGroupAvailable(planTier, 'details') && minAge !== ''
          ? parseInt(minAge, 10)
          : null,
      latitude: lat,
      longitude: lon,
      image_url: allImages[0] || business.image_url,
      gallery: allImages.length > 0 ? allImages : business.gallery,
      opening_hours: openingHours,
    });
    photos.filter(photo => photo.kind === 'new').forEach(photo => URL.revokeObjectURL(photo.preview));
    setPhotos(allImages.map(url => ({ id: createPhotoId(), kind: 'existing', url })));
  };

  const handleSave = async (options?: { navigateAfterSave?: boolean }): Promise<boolean> => {
    const navigateAfterSave = options?.navigateAfterSave ?? true;
    if (!businessId || !business) return false;
    if (!name.trim() || !category || !location || !description.trim()) {
      toast({ title: 'Completa los campos obligatorios', variant: 'destructive' });
      return false;
    }

    if (selectedServices.length > maxServices) {
      toast({
        title: `Máximo ${maxServices} servicios`,
        description: `Tu plan ${planLabelForTier(planTier)} permite ${maxServices}. Quita ${selectedServices.length - maxServices} para guardar.`,
        variant: 'destructive',
      });
      return false;
    }

    if (totalPhotos > maxPhotos) {
      toast({
        title: `Máximo ${maxPhotos} fotos`,
        description: `Tu plan ${planLabelForTier(planTier)} permite ${maxPhotos}. Quita ${totalPhotos - maxPhotos} para guardar.`,
        variant: 'destructive',
      });
      return false;
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      toast({ title: 'Coordenadas no válidas', variant: 'destructive' });
      return false;
    }

    setSaving(true);
    try {
      const allImages: string[] = [];
      for (const photo of photos.slice(0, maxPhotos)) {
        if (photo.kind === 'existing') {
          const url = rewriteSupabaseStorageUrl(photo.url) ?? photo.url;
          if (url) allImages.push(url);
          continue;
        }
        const url = await uploadPhotoFile(photo.file);
        if (url) allImages.push(url);
      }

      const payload: Record<string, unknown> = {
        name: name.trim(),
        category,
        subcategory: subcategory || null,
        location,
        description: description.trim(),
        latitude: lat,
        longitude: lon,
        image_url: allImages[0] || business.image_url,
      };

      if (allImages.length > 0) {
        payload.gallery = allImages;
      }

      if (isProfileGroupAvailable(planTier, 'contact')) {
        payload.phone = phone.trim() || null;
        payload.website = website.trim() || null;
      }

      payload.services = selectedServices.slice(0, maxServices);

      if (isProfileGroupAvailable(planTier, 'details')) {
        payload.price_range = parseInt(priceRange, 10);
        payload.min_age = minAge !== '' ? parseInt(minAge, 10) : null;
      }

      payload.opening_hours = openingHours;

      const result = await updateMyBusiness(businessId, payload);
      if (!result.ok) {
        toast({ title: 'No se pudo guardar', description: result.error, variant: 'destructive' });
        return false;
      }

      syncBusinessBaseline(allImages, lat, lon);
      toast({ title: 'Perfil actualizado', description: 'Los cambios ya son visibles en el directorio.' });
      if (navigateAfterSave) {
        leaveGuard.allowNextNavigation();
        navigateAccountDashboardTab(navigate, 'negocios');
      }
      return true;
    } finally {
      setSaving(false);
    }
  };

  const handleLeaveSave = async () => {
    const saved = await handleSave({ navigateAfterSave: false });
    if (saved) {
      leaveGuard.proceedPendingNavigation();
    }
  };

  const handleLeaveDiscard = () => {
    leaveGuard.proceedPendingNavigation();
  };

  if (authLoading || loading || !user) {
    return (
      <div className="flex min-h-screen flex-col bg-transparent">
        <Header />
        <main className="container mx-auto flex-1 px-4 py-8">
          <Skeleton className="mb-6 h-8 w-64" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[600px] rounded-xl" />
            <Skeleton className="h-[600px] rounded-xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-8 pb-24 lg:pb-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2"
                onClick={() => {
                  const target = { pathname: '/mi-cuenta', search: '?tab=negocios' };
                  if (hasChanges) {
                    leaveGuard.requestLeave(target);
                    return;
                  }
                  leaveGuard.allowNextNavigation();
                  navigateAccountDashboardTab(navigate, 'negocios');
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a mis negocios
              </Button>
              <h1 className="text-2xl font-bold text-foreground">Editar perfil del negocio</h1>
              <p className="text-sm text-muted-foreground">
                Personaliza cómo se ve tu negocio en el directorio. Plan actual:{' '}
                <span className="font-medium text-foreground">{planLabelForTier(planTier)}</span>
              </p>
            </div>
            <Button
              onClick={() => void handleSave()}
              disabled={
                !hasChanges ||
                saving ||
                selectedServices.length > maxServices ||
                totalPhotos > maxPhotos
              }
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            {/* Editor */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Store className="h-5 w-5 text-primary" />
                    Información básica
                  </CardTitle>
                  <CardDescription>Incluida en todos los planes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nombre *</Label>
                    <Input id="edit-name" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Categoría *</Label>
                      <Select
                        value={category}
                        onValueChange={v => {
                          setCategory(v);
                          setSubcategory('');
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
                        <SelectContent>
                          {BUSINESS_CATEGORIES.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Subcategoría</Label>
                      <Select value={subcategory} onValueChange={setSubcategory} disabled={!category}>
                        <SelectTrigger>
                          <SelectValue placeholder={category ? 'Subcategoría' : 'Elige categoría'} />
                        </SelectTrigger>
                        <SelectContent>
                          {getSubcategoriesForCategory(category).map(sub => (
                            <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Ubicación *</Label>
                    <Select value={location} onValueChange={setLocation}>
                      <SelectTrigger><SelectValue placeholder="Parroquia" /></SelectTrigger>
                      <SelectContent>
                        {BUSINESS_LOCATIONS.map(l => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-desc">Descripción *</Label>
                    <Textarea
                      id="edit-desc"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-right text-xs text-muted-foreground">{description.length}/500</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-lat">Latitud</Label>
                      <Input id="edit-lat" type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-lng">Longitud</Label>
                      <Input id="edit-lng" type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ImagePlus className="h-5 w-5 text-primary" />
                    Imágenes
                  </CardTitle>
                  <CardDescription>
                    Imágenes según tu plan (máx. {maxPhotos}).
                    {upgradePlanTier && upgradeMaxPhotos && (
                      <>
                        {' '}
                        <Link to={accountDashboardPath('plan')} className="font-medium text-primary hover:underline">
                          Amplía a {planLabelForTier(upgradePlanTier)}
                        </Link>
                        {' '}para añadir hasta {upgradeMaxPhotos}.
                      </>
                    )}
                    {' '}Mantén pulsado el icono ≡ y arrastra para reordenar.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">Fotos subidas</span>
                    <span className="font-medium text-foreground">
                      {totalPhotos} / {maxPhotos}
                    </span>
                  </div>
                  <SortablePhotoGrid
                    items={sortablePhotoItems}
                    onReorder={reorderPhotos}
                    onRemove={removePhoto}
                    onImageError={event => {
                      event.currentTarget.src = BUSINESS_IMAGE_FALLBACK;
                    }}
                  />
                  {totalPhotos > maxPhotos && (
                    <p className="text-xs text-destructive">
                      Tu plan permite {maxPhotos} fotos. Quita {totalPhotos - maxPhotos} para guardar.
                    </p>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={totalPhotos >= maxPhotos}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-muted-foreground transition-colors',
                      totalPhotos < maxPhotos
                        ? 'hover:border-primary/50 hover:bg-primary/5'
                        : 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <ImagePlus className="h-6 w-6" />
                    <span className="text-sm font-medium text-foreground">
                      {totalPhotos >= maxPhotos ? 'Límite de fotos alcanzado' : 'Añadir imágenes'}
                    </span>
                  </button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-primary" />
                    Horario
                  </CardTitle>
                  <CardDescription>
                    Define el horario de apertura por días, como en Google Maps.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BusinessHoursEditor value={openingHours} onChange={setOpeningHours} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Phone className="h-5 w-5 text-primary" />
                    Contacto
                  </CardTitle>
                  <CardDescription>Teléfono y sitio web de contacto</CardDescription>
                </CardHeader>
                <CardContent>
                  <LockedSection group="contact" tier={planTier}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="edit-phone">Teléfono</Label>
                        <Input id="edit-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+376 800 000" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-web">Sitio web</Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="edit-web"
                            value={website}
                            onChange={e => setWebsite(e.target.value)}
                            placeholder="https://tu-web.com"
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  </LockedSection>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                    Servicios y detalles
                  </CardTitle>
                  <CardDescription>
                    Servicios según tu plan (máx. {maxServices}).
                    {upgradePlanTier && upgradeMaxServices && (
                      <>
                        {' '}
                        <Link to={accountDashboardPath('plan')} className="font-medium text-primary hover:underline">
                          Amplía a {planLabelForTier(upgradePlanTier)}
                        </Link>
                        {' '}para añadir hasta {upgradeMaxServices}.
                      </>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <BusinessServicesPicker
                    selectedServices={selectedServices}
                    maxServices={maxServices}
                    onToggle={toggleService}
                    showOverLimitWarning={selectedServices.length > maxServices}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Rango de precio</Label>
                      <Select value={priceRange} onValueChange={setPriceRange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">€ — Económico</SelectItem>
                          <SelectItem value="2">€€ — Moderado</SelectItem>
                          <SelectItem value="3">€€€ — Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-age">Edad mínima</Label>
                      <Input
                        id="edit-age"
                        type="number"
                        min={0}
                        max={99}
                        value={minAge}
                        onChange={e => setMinAge(e.target.value)}
                        placeholder="Vacío = todas"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {planTier !== 'premium' && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                    <div className="flex gap-3">
                      <Sparkles className="h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">¿Quieres más visibilidad?</p>
                        <p className="text-sm text-muted-foreground">
                          Con Premium obtienes insignia destacada y más opciones de perfil.
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" asChild>
                      <Link to={accountDashboardPath('plan')}>Ver planes</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Preview — solo escritorio */}
            <div className="hidden lg:sticky lg:top-24 lg:block">
              <Card className="overflow-hidden">
                <CardHeader className="border-b bg-muted/30 py-3">
                  <CardTitle className="text-base">Vista previa del drawer</CardTitle>
                  <CardDescription>Así verán tu negocio los usuarios del directorio</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[min(80vh,720px)] overflow-hidden rounded-b-lg border-t">
                    <BusinessProfileView
                      business={previewBusiness}
                      showReviews={false}
                      planTier={planTier}
                      previewPremium={showPremiumPreview}
                      className="flex h-full flex-col bg-card"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className="fixed bottom-6 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 lg:hidden"
        aria-label="Vista previa del perfil"
      >
        <Eye className="h-6 w-6" />
      </button>

      <Drawer
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        direction="right"
        shouldScaleBackground={false}
      >
        <DrawerContent
          side="right"
          hideCloseButton
          className="flex w-full flex-col gap-0 bg-card p-0 lg:hidden"
        >
          <DrawerTitle className="sr-only">Vista previa de {previewBusiness.name || 'negocio'}</DrawerTitle>
          <DrawerDescription className="sr-only">
            Así verán tu negocio los usuarios del directorio
          </DrawerDescription>

          <div className="relative flex h-full flex-col">
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="absolute right-4 top-4 z-10 rounded-full bg-card/80 p-2 hover:bg-card"
              aria-label="Cerrar vista previa"
            >
              <X className="h-5 w-5" />
            </button>
            <BusinessProfileView
              business={previewBusiness}
              showReviews={false}
              planTier={planTier}
              previewPremium={showPremiumPreview}
              className="flex h-full flex-col bg-card"
            />
          </div>
        </DrawerContent>
      </Drawer>

      <AlertDialog
        open={leaveGuard.dialogOpen}
        onOpenChange={open => {
          if (!open) leaveGuard.closeLeaveDialog();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Salir sin guardar?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar en el perfil de tu negocio. Puedes guardarlos ahora o salir
              y perderlos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel disabled={saving}>Seguir editando</AlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLeaveDiscard}
            >
              Descartar cambios
            </Button>
            <Button type="button" disabled={saving} onClick={() => void handleLeaveSave()}>
              {saving ? 'Guardando…' : 'Guardar y salir'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
