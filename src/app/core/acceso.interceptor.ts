import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AccesoService, RUTAS_ACCESO } from './acceso.service';

/**
 * Añade el JWT de identidad a las llamadas a la API propia. Ante un 401 intenta renovar
 * el token una vez; si no se puede, pide ingresar de nuevo.
 */
export const accesoInterceptor: HttpInterceptorFn = (req, next) => {
  const acceso = inject(AccesoService);
  const router = inject(Router);

  const esApi = req.url.startsWith(environment.apiUrl);
  if (!esApi || RUTAS_ACCESO.some(r => req.url.endsWith(r))) return next(req);

  const conToken = (r: HttpRequest<unknown>) => {
    const token = acceso.token();
    return token ? r.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : r;
  };

  return next(conToken(req)).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) return throwError(() => error);
      return from(acceso.renovar()).pipe(
        switchMap(ok => {
          if (ok) return next(conToken(req));
          const actual = router.url;
          if (!actual.startsWith('/acceso') && !actual.startsWith('/callback')) {
            router.navigate(['/acceso'], { queryParams: { volver: actual } });
          }
          return throwError(() => error);
        }),
      );
    }),
  );
};
