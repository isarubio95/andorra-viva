import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mountain, Store, MapPin, Phone, Globe, DollarSign, Clock, ImagePlus, X, ArrowLeft, ArrowRight, Check, Users, FileText, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = [
  'Restaurante',
  'Hotel',
  'SPA & Wellness',
  'Actividades',
  'Ocio Nocturno',
  'Tienda',
  'Transporte',
  'Servicios',
];

const LOCATIONS = [
  'Andorra la Vella',
  'Escaldes-Engordany',
  'Encamp',
  'La Massana',
  'Ordino',
  'Canillo',
  'Soldeu',
  'El Tarter',
  'Pas de la Casa',
  'Sant Julià de Lòria',
  'Arinsal',
];

const SERVICES_OPTIONS = [
  'Wifi', 'Terraza', 'Parking', 'Piscina', 'Sauna', 'Gimnasio',
  'Restaurante', 'Bar', 'Spa', 'Ski-in', 'Bodega', 'Tienda',
  'Masajes', 'Menú del día', 'Reservas online', 'Delivery',
  'Accesible', 'Pet-friendly', 'Niños', 'Eventos',
];

type Step = 'info' | 'details' | 'images' | 'review';

export default function RegisterBusiness() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('info');
  const [loading, setLoading] = useState(false);

  // Step 1: Basic info
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  // Step 2: Details
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [priceRange, setPriceRange] = useState('2');
  const [minAge, setMinAge] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [latitude, setLatitude] = useState('42.5063');
  const [longitude, setLongitude] = useState('1.5218');

  // Step 3: Images
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const steps: { key: Step; label: string; icon: React.ElementType }[] = [
    { key: 'info', label: 'Información', icon: FileText },
    { key: 'details', label: 'Detalles', icon: Store },
    { key: 'images', label: 'Imágenes', icon: ImagePlus },
    { key: 'review', label: 'Revisión', icon: Check },
  ];

  const currentIndex = steps.findIndex(s => s.key === step);

  const toggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 10) {
      toast({ title: 'Máximo 10 imágenes', variant: 'destructive' });
      return;
    }
    const newImages = [...images, ...files];
    setImages(newImages);
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep = (s: Step): boolean => {
    if (s === 'info') {
      if (!name.trim() || !category || !location || !description.trim()) {
        toast({ title: 'Completa todos los campos obligatorios', variant: 'destructive' });
        return false;
      }
    }
    if (s === 'details') {
      if (!latitude || !longitude) {
        toast({ title: 'Las coordenadas son obligatorias', variant: 'destructive' });
        return false;
      }
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    const next = steps[currentIndex + 1];
    if (next) setStep(next.key);
  };

  const goBack = () => {
    const prev = steps[currentIndex - 1];
    if (prev) setStep(prev.key);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: 'Debes iniciar sesión', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      // Upload images
      const imageUrls: string[] = [];
      for (const file of images) {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('business-images')
          .upload(path, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('business-images')
          .getPublicUrl(path);

        imageUrls.push(urlData.publicUrl);
      }

      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      if (Number.isNaN(lat) || Number.isNaN(lon)) {
        toast({ title: 'Coordenadas no válidas', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // Insert business (sin enviar gallery vacío: algunos esquemas/PostgREST lo rechazan con 400)
      const row: Record<string, unknown> = {
        name: name.trim(),
        category,
        location,
        description: description.trim(),
        phone: phone.trim() || null,
        website: website.trim() || null,
        price_range: parseInt(priceRange, 10),
        min_age: minAge !== '' && minAge != null ? parseInt(minAge, 10) : null,
        services: selectedServices,
        latitude: lat,
        longitude: lon,
        image_url: imageUrls[0] || '',
        owner_id: user.id,
        rating: 0,
        review_count: 0,
        is_premium: false,
      };
      if (imageUrls.length > 0) {
        row.gallery = imageUrls;
      }

      const { error } = await supabase.from('businesses').insert(row);

      if (error) {
        const detail = [error.message, error.details, error.hint].filter(Boolean).join(' · ');
        toast({ title: 'Error al registrar', description: detail, variant: 'destructive' });
      } else {
        toast({ title: '¡Negocio registrado!', description: 'Tu negocio aparecerá en el directorio.' });
        navigate('/mi-cuenta');
      }
    } catch (err) {
      toast({ title: 'Error inesperado', variant: 'destructive' });
    }

    setLoading(false);
  };

  const priceLabels: Record<string, string> = {
    '1': '€ — Económico',
    '2': '€€ — Moderado',
    '3': '€€€ — Premium',
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-background px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Mountain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Andorra <span className="text-accent">Viva</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Registra tu negocio</h1>
          <p className="text-sm text-muted-foreground">
            Completa la información para aparecer en el directorio
          </p>

          {/* Steps */}
          <div className="flex items-center gap-1 sm:gap-2 mt-2">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.key;
              const isDone = currentIndex > i;
              return (
                <div key={s.key} className="flex items-center gap-1 sm:gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      isActive ? 'bg-primary text-primary-foreground' :
                      isDone ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span className={`text-[10px] sm:text-xs font-medium ${
                      isActive ? 'text-primary' : isDone ? 'text-accent' : 'text-muted-foreground'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`h-0.5 w-4 sm:w-8 rounded mb-4 ${isDone ? 'bg-accent' : 'bg-muted'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1: Basic Info */}
        {step === 'info' && (
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Información básica
              </CardTitle>
              <CardDescription>Datos principales de tu negocio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="biz-name">Nombre del negocio *</Label>
                <Input id="biz-name" placeholder="Ej: Restaurante La Borda" value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Categoría *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ubicación *</Label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger><SelectValue placeholder="Selecciona parroquia" /></SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map(l => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="biz-desc">Descripción *</Label>
                <Textarea
                  id="biz-desc"
                  placeholder="Describe tu negocio, qué ofreces, qué lo hace especial…"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">{description.length}/500</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Details */}
        {step === 'details' && (
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Store className="h-5 w-5 text-primary" />
                Detalles del negocio
              </CardTitle>
              <CardDescription>Información adicional y servicios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="biz-phone">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="biz-phone" placeholder="+376 800 000" value={phone} onChange={e => setPhone(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="biz-web">Sitio web</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="biz-web" placeholder="https://tu-web.com" value={website} onChange={e => setWebsite(e.target.value)} className="pl-10" />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Rango de precio</Label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">€ — Económico</SelectItem>
                      <SelectItem value="2">€€ — Moderado</SelectItem>
                      <SelectItem value="3">€€€ — Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="biz-age">Edad mínima</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="biz-age" type="number" placeholder="Ej: 16 (vacío = todas)" value={minAge} onChange={e => setMinAge(e.target.value)} className="pl-10" min={0} max={99} />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="biz-lat">Latitud *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="biz-lat" type="number" step="any" placeholder="42.5063" value={latitude} onChange={e => setLatitude(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="biz-lng">Longitud *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="biz-lng" type="number" step="any" placeholder="1.5218" value={longitude} onChange={e => setLongitude(e.target.value)} className="pl-10" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Servicios disponibles</Label>
                <div className="flex flex-wrap gap-2">
                  {SERVICES_OPTIONS.map(service => {
                    const isSelected = selectedServices.includes(service);
                    return (
                      <button
                        key={service}
                        type="button"
                        onClick={() => toggleService(service)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-muted-foreground/50'
                        }`}
                      >
                        {service}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Images */}
        {step === 'images' && (
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ImagePlus className="h-5 w-5 text-primary" />
                Imágenes del negocio
              </CardTitle>
              <CardDescription>Sube hasta 10 fotos. La primera será la imagen principal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />

              {previews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {previews.map((src, i) => (
                    <div key={i} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border">
                      <img src={src} alt={`Preview ${i + 1}`} className="h-full w-full object-cover" />
                      {i === 0 && (
                        <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px]">
                          Principal
                        </Badge>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border p-8 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <ImagePlus className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">Haz clic para subir imágenes</p>
                  <p className="text-xs">JPG, PNG o WebP · máx. 5MB por imagen</p>
                </div>
              </button>

              <p className="text-xs text-muted-foreground text-center">
                {images.length}/10 imágenes seleccionadas
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review */}
        {step === 'review' && (
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-accent" />
                Revisión final
              </CardTitle>
              <CardDescription>Comprueba que todo está correcto antes de publicar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Preview card */}
              {previews[0] && (
                <div className="overflow-hidden rounded-xl border border-border">
                  <img src={previews[0]} alt="Preview" className="h-40 w-full object-cover" />
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-foreground">{name}</h3>
                  <Badge variant="secondary">{category}</Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {location}
                </div>

                <p className="text-sm text-foreground/80">{description}</p>

                <div className="grid gap-2 sm:grid-cols-2 text-sm">
                  {phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" /> {phone}
                    </div>
                  )}
                  {website && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-3.5 w-3.5" /> {website}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5" /> {priceLabels[priceRange]}
                  </div>
                  {minAge && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" /> Edad mínima: {minAge} años
                    </div>
                  )}
                </div>

                {selectedServices.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedServices.map(s => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                )}

                {images.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    📸 {images.length} {images.length === 1 ? 'imagen' : 'imágenes'} adjuntadas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center gap-3">
          {currentIndex > 0 && (
            <Button variant="outline" onClick={goBack} className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Atrás
            </Button>
          )}

          <div className="flex-1" />

          <Button
            variant="ghost"
            onClick={() => navigate('/mi-cuenta')}
            className="text-muted-foreground"
          >
            Saltar por ahora
          </Button>

          {step !== 'review' ? (
            <Button onClick={goNext} className="gap-1">
              Siguiente <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="gap-1">
              {loading ? 'Publicando…' : (
                <>
                  <Check className="h-4 w-4" /> Publicar Negocio
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
