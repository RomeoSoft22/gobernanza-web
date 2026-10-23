import { DatePipe } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { SesionDocumento, TIPOS_DOCUMENTO, TipoDocumento } from '../../../core/models/sesion.model';
import { SesionesService } from '../../../core/services/sesiones.service';
import { Icon, IconName } from '../../../shared/icon/icon';
import { mensajeError } from '../../../shared/errores';
import { TamanoPipe } from '../../../shared/pipes';

/** Formato con el que se arrastra un documento ya cargado de una tarjeta a otra. */
const MIME_DOC = 'application/x-gobernanza-documento';

/** Color de la etiqueta del archivo según su extensión. */
const FORMATOS: { clase: string; ext: string[] }[] = [
  { clase: 'pdf', ext: ['pdf'] },
  { clase: 'word', ext: ['doc', 'docx', 'odt', 'rtf'] },
  { clase: 'excel', ext: ['xls', 'xlsx', 'csv', 'ods'] },
  { clase: 'ppt', ext: ['ppt', 'pptx', 'odp'] },
  { clase: 'img', ext: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
  { clase: 'video', ext: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4a', 'mp3'] },
];

/** Documentos nativos de Google (no tienen extensión en el nombre). */
const GOOGLE: Record<string, { etiqueta: string; clase: string }> = {
  'application/vnd.google-apps.document': { etiqueta: 'DOC', clase: 'word' },
  'application/vnd.google-apps.spreadsheet': { etiqueta: 'HOJA', clase: 'excel' },
  'application/vnd.google-apps.presentation': { etiqueta: 'PPT', clase: 'ppt' },
};

/** Tarjeta para ver / subir / mover / quitar los documentos de un tipo. */
@Component({
  selector: 'app-documento-slot',
  imports: [Icon, TamanoPipe, DatePipe],
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
  /** Cuenta para la documentación obligatoria (muestra "Cargado" / "Pendiente"). */
  requerido = input(true);
  documentos = input<SesionDocumento[]>([]);
  cambio = output<void>();

  protected progreso = signal<number | null>(null);
  protected error = signal<string | null>(null);
  protected arrastrando = signal(false);
  protected icono = computed<IconName>(() =>
    ({ acta: 'file', asistencia: 'users', presentacion: 'slides', adjunto: 'clip' } as const)[this.tipo()]);
  protected vacio = computed(() => this.documentos().length === 0);
  /** Documento cuyo menú "Mover a…" está abierto. */
  protected menuMover = signal<number | null>(null);
  protected destinos = computed(() => TIPOS_DOCUMENTO.filter(t => t.valor !== this.tipo()));

  protected urlVer = (d: SesionDocumento) => d.drive_url ?? this.api.urlVer(d);
  protected urlDescargar = (d: SesionDocumento) => this.api.urlDescargar(d);

  protected formato(d: SesionDocumento): { etiqueta: string; clase: string } {
    if (d.mime && GOOGLE[d.mime]) return GOOGLE[d.mime];
    const partes = d.nombre_original.split('.');
    const ext = partes.length > 1 ? partes.pop()!.toLowerCase() : '';
    return {
      etiqueta: ext && ext.length <= 4 ? ext.toUpperCase() : 'ARCH',
      clase: FORMATOS.find(f => f.ext.includes(ext))?.clase ?? 'otro',
    };
  }

  protected seleccionar(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.subir(Array.from(input.files ?? []));
    input.value = '';
  }

  /** Acepta archivos del equipo (se suben a Drive) o un documento arrastrado desde otra tarjeta (se mueve). */
  protected soltar(ev: DragEvent) {
    ev.preventDefault();
    this.arrastrando.set(false);
    const doc = ev.dataTransfer?.getData(MIME_DOC);
    if (doc) {
      const { id, tipo } = JSON.parse(doc) as { id: number; tipo: TipoDocumento };
      if (tipo !== this.tipo()) this.mover(id, this.tipo());
      return;
    }
    this.subir(Array.from(ev.dataTransfer?.files ?? []));
  }

  protected iniciarArrastre(ev: DragEvent, doc: SesionDocumento) {
    ev.dataTransfer?.setData(MIME_DOC, JSON.stringify({ id: doc.id, tipo: doc.tipo }));
    if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move';
  }

  /** Cambia el documento de tarjeta (p. ej. de Acta a Lista de asistencia). */
  protected mover(id: number, destino: TipoDocumento) {
    this.menuMover.set(null);
    this.error.set(null);
    this.api.cambiarTipoDocumento(id, destino).subscribe({
      next: () => this.cambio.emit(),
      error: err => this.error.set(mensajeError(err, 'No se pudo mover el documento.')),
    });
  }

  protected sobre(ev: DragEvent, activo: boolean) {
    ev.preventDefault();
    this.arrastrando.set(activo);
  }

  /** Como la lista se lee de Drive, quitar un documento lo envía a la papelera de Drive. */
  protected eliminar(doc: SesionDocumento) {
    const destino = doc.drive_file_id
      ? ' Se enviará a la papelera de Google Drive (se puede recuperar durante 30 días).'
      : '';
    if (!confirm(`¿Quitar "${doc.nombre_original}" de la sesión?${destino}`)) return;
    this.api.eliminarDocumento(doc.id).subscribe({
      next: () => this.cambio.emit(),
      error: err => this.error.set(mensajeError(err, 'No se pudo quitar el documento.')),
    });
  }

  private subir(archivos: File[]) {
    if (!archivos.length) return;
    this.error.set(null);
    this.progreso.set(0);
    this.api.subirDocumentos(this.sesionId(), this.tipo(), archivos).subscribe({
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
        this.error.set(mensajeError(err, 'No se pudo subir el archivo a Google Drive.'));
      },
    });
  }
}
