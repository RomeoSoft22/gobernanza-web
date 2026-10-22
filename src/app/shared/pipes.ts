import { Pipe, PipeTransform } from '@angular/core';

/** '2026-10-20' -> 'mar. 20 oct. 2026' sin desfase de zona horaria. */
@Pipe({ name: 'fechaLarga' })
export class FechaLargaPipe implements PipeTransform {
  transform(valor: string | null | undefined, conDia = true): string {
    if (!valor) return '—';
    const [y, m, d] = valor.substring(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-PE', {
      weekday: conDia ? 'short' : undefined, day: '2-digit', month: 'short', year: 'numeric',
    });
  }
}

/** '09:00:00' -> '09:00' */
@Pipe({ name: 'hora' })
export class HoraPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    return valor ? valor.substring(0, 5) : '';
  }
}

@Pipe({ name: 'tamano' })
export class TamanoPipe implements PipeTransform {
  transform(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}
