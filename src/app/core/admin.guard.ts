import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AccesoService } from './acceso.service';

/** Configuración de Google Drive y Auditoría: solo el perfil administrador. */
export const adminGuard: CanActivateFn = async () => {
  const acceso = inject(AccesoService);
  const router = inject(Router);
  if ((await acceso.asegurar()) && acceso.esAdmin()) return true;
  return router.createUrlTree(['/inicio']);
};
