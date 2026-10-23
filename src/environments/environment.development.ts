/**
 * Desarrollo local: la API se llama por /api en el mismo origen y el dev server la reenvía
 * (proxy.conf.json → `php artisan serve` en el puerto 8000). Así la cookie HttpOnly de la
 * sesión de identidad funciona igual que en producción.
 */
export const environment = {
  produccion: false,
  apiUrl: '/api',
};
