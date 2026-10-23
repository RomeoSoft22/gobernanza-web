import { HttpErrorResponse } from '@angular/common/http';

/** Extrae un mensaje legible de una respuesta de error de la API. */
export function mensajeError(err: unknown, porDefecto = 'Ocurrió un error inesperado.'): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'No se pudo conectar con la API. Verifique que esté en ejecución.';
    const errores = err.error?.errors;
    if (errores) return (Object.values(errores)[0] as string[])[0];
    if (typeof err.error?.message === 'string' && err.error.message) return err.error.message;
  }
  return porDefecto;
}
