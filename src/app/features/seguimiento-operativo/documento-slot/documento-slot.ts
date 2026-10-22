import { HttpEventType } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { SesionDocumento, TipoDocumento } from '../../../core/models/sesion.model';
import { SesionesService } from '../../../core/services/sesiones.service';
import { Icon, IconName } from '../../../shared/icon/icon';
import { FechaLargaPipe, TamanoPipe } from '../../../shared/pipes';

/** Tarjeta para ver / subir / reemplazar / eliminar documentos de un tipo. */
@Component({
  selector: 'app-documento-slot',
  imports: [Icon, TamanoPipe, FechaLargaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './documento-slot.html',
  styleUrl: './documento-slot.scss',
})
export class DocumentoSlot {
  private api = inject(SesionesService);

  sesionId = input.required<number>();
  tipo = input.required<TipoDocumento>();
  etiqueta = input.required<string>();
  ayuda = input('');
  unico = input(true);
  documentos = input<SesionDocumento[]>([]);
  cambio = output<void>();

  protected progreso = signal<number | null>(null);
  protected error = signal<string | null>(null);
  protected arrastrando = signal(false);
  protected icono = computed<IconName>(() =>
    ({ acta: 'file', asistencia: 'users', presentacion: 'slides', adjunto: 'clip' } as const)[this.tipo()]);
  protected vacio = computed(() => this.documentos().length === 0);

  protected urlVer = (d: SesionDocumento) => this.api.urlVer(d);
  protected urlDescargar = (d: SesionDocumento) => this.api.urlDescargar(d);

  protected seleccionar(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.subir(Array.from(input.files ?? []));
    input.value = '';
  }

  protected soltar(ev: DragEvent) {
    ev.preventDefault();
    this.arrastrando.set(false);
    this.subir(Array.from(ev.dataTransfer?.files ?? []));
  }

  protected sobre(ev: DragEvent, activo: boolean) {
    ev.preventDefault();
    this.arrastrando.set(activo);
  }

  protected eliminar(doc: SesionDocumento) {
    if (!confirm(`¿Eliminar "${doc.nombre_original}"? Esta acción no se puede deshacer.`)) return;
    this.api.eliminarDocumento(doc.id).subscribe(() => this.cambio.emit());
  }

  private subir(archivos: File[]) {
    if (!archivos.length) return;
    if (this.unico() && !this.vacio()
      && !confirm(`Ya existe un archivo de ${this.etiqueta().toLowerCase()}. ¿Desea reemplazarlo?`)) return;

    const lote = this.unico() ? archivos.slice(0, 1) : archivos;
    this.error.set(null);
    this.progreso.set(0);
    this.api.subirDocumentos(this.sesionId(), this.tipo(), lote).subscribe({
      next: ev => {
        if (ev.type === HttpEventType.UploadProgress && ev.total) {
          this.progreso.set(Math.round((ev.loaded / ev.total) * 100));
        } else if (ev.type === HttpEventType.Response) {
          this.progreso.set(null);
          this.cambio.emit();
        }
      },
      error: err => {
        this.progreso.set(null);
        const errores = err.error?.errors;
        this.error.set(errores ? (Object.values(errores)[0] as string[])[0] : 'No se pudo subir el archivo.');
      },
    });
  }
}
