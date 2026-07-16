import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  Tags,
  Store,
  MessageSquare,
  Newspaper,
  Package,
  Scale,
  Map,
  type LucideIcon,
} from 'lucide-react';

export type AdminNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    title: 'Resumen',
    href: '/admin',
    icon: LayoutDashboard,
    description: 'Estadísticas generales',
  },
  {
    title: 'Usuarios',
    href: '/admin/usuarios',
    icon: Users,
    description: 'Roles y cuentas',
  },
  {
    title: 'Pagos',
    href: '/admin/pagos',
    icon: CreditCard,
    description: 'Stripe y suscripciones',
  },
  {
    title: 'Planes',
    href: '/admin/planes',
    icon: Package,
    description: 'Precios y características',
  },
  {
    title: 'Reseñas',
    href: '/admin/resenas',
    icon: MessageSquare,
    description: 'Moderación de reseñas',
  },
  {
    title: 'Noticias',
    href: '/admin/noticias',
    icon: Newspaper,
    description: 'Moderación de noticias',
  },
  {
    title: 'Textos web',
    href: '/admin/textos',
    icon: FileText,
    description: 'Contenido de la página',
  },
  {
    title: 'Mapa',
    href: '/admin/mapa',
    icon: Map,
    description: 'Estilo del mapa principal',
  },
  {
    title: 'Páginas legales',
    href: '/admin/legal',
    icon: Scale,
    description: 'Aviso legal, privacidad y condiciones',
  },
  {
    title: 'Categorías',
    href: '/admin/categorias',
    icon: Tags,
    description: 'Nombres de categorías',
  },
  {
    title: 'Negocios',
    href: '/admin/negocios',
    icon: Store,
    description: 'Moderación de negocios',
  },
];
