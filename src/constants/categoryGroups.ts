/**
 * Claves = etiquetas de la home (`CategoryBar`) y valor del query `?grupo=`.
 * Valores = categorías del directorio; el filtro comprueba si `business.category` las contiene (substring).
 */
export const CATEGORY_GROUP_MAP: Record<string, string[]> = {
  Gastronomía: ['Restaurante'],
  Wellness: ['SPA & Wellness'],
  Noche: ['Bar', 'Discoteca'],
  Shopping: ['Tienda'],
  Montaña: ['Hotel', 'Actividades'],
  Cultura: ['Museo'],
};
