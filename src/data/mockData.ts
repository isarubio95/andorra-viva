import bizRestaurant from '@/assets/biz-restaurant.jpg';
import bizHotel from '@/assets/biz-hotel.jpg';
import bizSpa from '@/assets/biz-spa.jpg';

export interface Business {
  id: string;
  name: string;
  category: string;
  location: string;
  rating: number;
  review_count: number;
  image_url: string;
  description: string;
  latitude: number;
  longitude: number;
  is_premium: boolean;
  services: string[];
  price_range: number; // 1=económico, 2=moderado, 3=premium
  min_age: number | null; // null = todas las edades
}

export interface Review {
  id: string;
  business_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  is_popular: boolean;
}

export const mockBusinesses: Business[] = [
  {
    id: '1',
    name: "Borda de l'Avi",
    category: 'Restaurante',
    location: 'La Massana',
    rating: 4.9,
    review_count: 152,
    image_url: bizRestaurant,
    description: 'Alta cocina en un entorno rústico y exclusivo. Especialidad en carnes a la brasa.',
    latitude: 42.5457,
    longitude: 1.5147,
    is_premium: true,
    services: ['Wifi', 'Terraza', 'Parking', 'Bodega'],
    price_range: 3,
    min_age: null,
  },
  {
    id: '2',
    name: 'Sport Wellness Mountain Spa',
    category: 'SPA & Wellness',
    location: 'Soldeu',
    rating: 4.7,
    review_count: 89,
    image_url: bizSpa,
    description: 'Spa de lujo con vistas a la montaña. Tratamientos exclusivos y piscina climatizada.',
    latitude: 42.5774,
    longitude: 1.6678,
    is_premium: true,
    services: ['Piscina', 'Sauna', 'Masajes', 'Gimnasio'],
    price_range: 3,
    min_age: 16,
  },
  {
    id: '3',
    name: 'Hotel Himalaia Soldeu',
    category: 'Hotel',
    location: 'Soldeu',
    rating: 4.5,
    review_count: 210,
    image_url: bizHotel,
    description: 'Hotel de montaña con acceso directo a pistas. Servicio premium y gastronomía de autor.',
    latitude: 42.5756,
    longitude: 1.6654,
    is_premium: true,
    services: ['Ski-in', 'Restaurante', 'Spa', 'Bar'],
    price_range: 3,
    min_age: null,
  },
  {
    id: '4',
    name: 'La Cabana',
    category: 'Restaurante',
    location: 'Andorra la Vella',
    rating: 4.2,
    review_count: 67,
    image_url: bizRestaurant,
    description: 'Cocina tradicional andorrana en un ambiente familiar y acogedor.',
    latitude: 42.5063,
    longitude: 1.5218,
    is_premium: false,
    services: ['Wifi', 'Terraza'],
    price_range: 1,
    min_age: null,
  },
  {
    id: '5',
    name: 'Cal Manel',
    category: 'Restaurante',
    location: 'Encamp',
    rating: 4.3,
    review_count: 43,
    image_url: bizRestaurant,
    description: 'Restaurante de cocina de montaña con productos de proximidad.',
    latitude: 42.5348,
    longitude: 1.5806,
    is_premium: false,
    services: ['Parking', 'Menú del día'],
    price_range: 1,
    min_age: null,
  },
  {
    id: '6',
    name: 'Caldea',
    category: 'SPA & Wellness',
    location: 'Escaldes-Engordany',
    rating: 4.6,
    review_count: 340,
    image_url: bizSpa,
    description: 'El centro termolúdico más grande del sur de Europa. Una experiencia única de bienestar.',
    latitude: 42.5103,
    longitude: 1.5393,
    is_premium: false,
    services: ['Termas', 'Spa', 'Restaurante', 'Tienda'],
    price_range: 2,
    min_age: null,
  },
];

export const mockReviews: Review[] = [
  { id: '1', business_id: '1', user_name: 'María G.', rating: 5, comment: 'Una experiencia gastronómica increíble. Las carnes a la brasa son espectaculares.', created_at: '2024-12-15' },
  { id: '2', business_id: '1', user_name: 'Pierre L.', rating: 5, comment: 'Meilleur restaurant en Andorre ! Ambiance chaleureuse et plats excellents.', created_at: '2024-11-20' },
  { id: '3', business_id: '1', user_name: 'Joan T.', rating: 4, comment: 'Muy buena cocina, aunque los precios son un poco elevados. Vale la pena.', created_at: '2024-10-05' },
  { id: '4', business_id: '2', user_name: 'Ana R.', rating: 5, comment: 'El mejor spa de Andorra. Las vistas son impresionantes.', created_at: '2024-12-01' },
  { id: '5', business_id: '2', user_name: 'Carlos M.', rating: 4, comment: 'Muy relajante, instalaciones impecables.', created_at: '2024-11-10' },
  { id: '6', business_id: '3', user_name: 'Laura S.', rating: 5, comment: 'Hotel fantástico, acceso directo a pistas y personal muy amable.', created_at: '2024-12-20' },
];

export const mockPlans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: '€',
    interval: 'mes',
    features: [
      'Perfil básico del negocio',
      'Hasta 3 fotos',
      'Aparición en el directorio',
      'Estadísticas básicas',
    ],
    is_popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    currency: '€',
    interval: 'mes',
    features: [
      'Todo del plan Free',
      'Fotos ilimitadas',
      'Insignia "Premium"',
      'Posición destacada',
      'Estadísticas avanzadas',
      'Responder a reseñas',
    ],
    is_popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 79,
    currency: '€',
    interval: 'mes',
    features: [
      'Todo del plan Pro',
      'Reserva WhatsApp integrada',
      'Widget de mapa propio',
      'API de integración',
      'Soporte prioritario 24/7',
      'Análisis de competencia',
      'Campañas promocionales',
    ],
    is_popular: false,
  },
];
