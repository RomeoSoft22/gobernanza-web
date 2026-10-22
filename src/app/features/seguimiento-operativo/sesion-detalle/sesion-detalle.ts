import { ChangeDetectionStrategy, Component, computed, inject, input, signal, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Sesion, TIPOS_DOCUMENTO, TipoDocumento } from '../../../core/models/sesion.model';
import { SesionesService } from '../../../core/services/sesiones.service';
import { Icon } from '../../../shared/icon/icon';
import { FechaLargaPipe, HoraPipe } from '../../../shared/pipes';
import { DocumentoSlot } from '../documento-slot/documento-slot';

@Component({
  selector: 'app-sesion-detalle',
  imports: [RouterLink, Icon, FechaLargaPipe, HoraPipe, DocumentoSlot],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sesion-detalle.html',
  styleUrl: './sesion-detalle.scss',
})
export class SesionDetalle {
  private api = inject(SesionesService);
  private router = inject(Router);

  /** Parámetro de ruta :id (withComponentInputBinding). */
  id = input.required<string>();

  protected sesion = signal<Sesion | null>(null);
  protected error = signal<string | null>(null);
  protected readonly tipos = TIPOS_DOCUMENTO;

  protected avance = computed(() => {
    const docs = this.sesion()?.documentos ?? [];
    const requeridos: TipoDocumento[] = ['acta', 'asistencia', 'presentacion'];
    return requeridos.filter(t => docs.some(d => d.tipo === t)).length;
  });

  constructor() {
    effect(() => this.cargar(Number(this.id())));
  }

  protected docsDe(tipo: TipoDocumento) {
    return (this.sesion()?.documentos ?? []).filter(d => d.tipo === tipo);
  }

  protected recargar() {
    this.cargar(Number(this.id()));
  }

  protected eliminar() {
    const s = this.sesion();
    if (!s || !confirm(`¿Eliminar la sesión N° ${s.numero}? También se eliminarán sus documentos.`)) return;
    this.api.eliminar(s.id).subscribe(() =>
      this.router.navigate(['/seguimiento-operativo/sesiones'], { queryParams: { anio: s.anio } }));
  }

  private cargar(id: number) {
    this.api.obtener(id).subscribe({
      next: s => this.sesion.set(s),
      error: () => this.error.set('No se encontró la sesión solicitada.'),
    });
  }
}
