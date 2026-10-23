import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Sesion, TIPOS_DOCUMENTO, TipoDocumento } from '../../../core/models/sesion.model';
import { SesionesService } from '../../../core/services/sesiones.service';
import { mensajeError } from '../../../shared/errores';
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

  /** Parámetros de ruta :reunion y :id (withComponentInputBinding). */
  reunion = input.required<string>();
  id = input.required<string>();

  protected sesion = signal<Sesion | null>(null);
  protected error = signal<string | null>(null);
  protected readonly tipos = TIPOS_DOCUMENTO;

  /** Lectura en vivo de la carpeta de Drive. */
  protected leyendoDrive = signal(false);
  protected driveError = signal<string | null>(null);
  protected driveMensaje = signal<string | null>(null);

  protected avance = computed(() => {
    const docs = this.sesion()?.documentos ?? [];
    const requeridos = TIPOS_DOCUMENTO.filter(t => t.requerido).map(t => t.valor);
    return requeridos.filter(t => docs.some(d => d.tipo === t)).length;
  });

  constructor() {
    effect(() => this.cargar(Number(this.id())));
  }

  protected base() {
    return `/reuniones/${this.reunion()}/sesiones`;
  }

  protected docsDe(tipo: TipoDocumento) {
    return (this.sesion()?.documentos ?? []).filter(d => d.tipo === tipo);
  }

  /** Tras subir, mover o quitar un documento se vuelve a leer Drive. */
  protected recargar() {
    this.leerDrive();
  }

  protected eliminar() {
    const s = this.sesion();
    if (!s || !confirm(`¿Eliminar la sesión N° ${s.numero} del sistema? Su carpeta y archivos en Drive se conservan.`)) return;
    this.api.eliminar(s.id).subscribe(() =>
      this.router.navigate([this.base()], { queryParams: { anio: s.anio } }));
  }

  /**
   * Lee la carpeta de la sesión directamente desde Google Drive.
   * Con crear = true (botón "Vincular") busca o crea la carpeta si aún no existe.
   */
  protected leerDrive(crear = false, avisar = false) {
    const s = this.sesion();
    if (!s || (!s.drive_folder_id && !crear)) return;

    this.leyendoDrive.set(true);
    this.driveError.set(null);
    this.api.sincronizarDrive(s.id, crear).subscribe({
      next: ({ resultado, sesion }) => {
        this.leyendoDrive.set(false);
        this.sesion.set(sesion);
        if (avisar || resultado.agregados || resultado.desvinculados) {
          const partes = [`${resultado.total} archivo(s) en Drive`];
          if (resultado.agregados) partes.push(`${resultado.agregados} nuevo(s)`);
          if (resultado.desvinculados) partes.push(`${resultado.desvinculados} ya no está(n) en la carpeta`);
          this.driveMensaje.set(partes.join(' · '));
        }
      },
      error: err => {
        this.leyendoDrive.set(false);
        this.driveError.set(mensajeError(err, 'No se pudo leer la carpeta de Google Drive.'));
      },
    });
  }

  private cargar(id: number) {
    this.driveMensaje.set(null);
    this.api.obtener(id).subscribe({
      next: s => {
        this.sesion.set(s);
        this.leerDrive();
      },
      error: () => this.error.set('No se encontró la sesión solicitada.'),
    });
  }
}
