/**
 * Producción (https://juarezcampos.net/gobernanza): la API se sirve en el mismo dominio,
 * en /gobernanza-api/api, así el navegador no necesita CORS y la cookie HttpOnly de la
 * sesión de identidad viaja sin problemas.
 */
export const environment = {
  produccion: true,
  apiUrl: '/gobernanza-api/api',
};
