import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { CLASES, CarpetaDrive, Clase, EstadoDrive, EstadoImportacion, TipoReunion } from '../../core/models/sesion.model';
import { SesionesService } from '../../core/services/sesiones.service';
import { mensajeError } from '../../shared/errores';
import { Icon } from '../../shared/icon/icon';

type Clave = `${number}-${Clase}`;

@Component({
  selector: 'app-drive-config',
  imports: [FormsModule, RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './drive-config.html',
  styleUrl: './drive-config.scss',
})
export class DriveConfig {
  private api = inject(SesionesService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private sondeo: ReturnType<typeof setInterval> | null = null;

  protected readonly clases = CLASES;
  protected estado = signal<EstadoDrive | null>(null);
  protected tipos = signal<TipoReunion[]>([]);
  protected mensaje = signal<string | null>(null);
  protected error = signal<string | null>(null);
  protected enlaces = signal<Partial<Record<string, string>>>({});
  protected ocupado = signal<string | null>(null);
  /** Importación en segundo plano (la API sigue respondiendo mientras avanza). */
  protected importacion = signal<EstadoImportacion | null>(null);
  protected importando = computed(() => this.importacion()?.estado === 'en_curso');

  protected raices = computed(() => {
    const mapa: Record<string, CarpetaDrive> = {};
    for (const c of this.estado()?.carpetas ?? []) if (c.anio === null) mapa[this.claveDe(c.tipo_reunion_id, c.clase)] = c;
    return mapa;
  });

  constructor() {
    const q = this.route.snapshot.queryParamMap;
    if (q.get('conectado')) this.mensaje.set('Google Drive se conectó correctamente.');
    if (q.get('error')) this.error.set(`No se pudo conectar Google Drive: ${q.get('error')}`);

    this.api.tiposReunion().subscribe(t => this.tipos.set(t));
    this.cargar();
    this.destroyRef.onDestroy(() => this.detenerSondeo());
  }

  protected claseDe(i: EstadoImportacion) {
    return this.claveDe(i.tipo_reunion_id, i.clase);
  }

  protected claveDe(tipoId: number, clase: Clase): Clave {
    return `${tipoId}-${clase}`;
  }

  protected aniosDe(tipoId: number, clase: Clase) {
    return (this.estado()?.carpetas ?? []).filter(c => c.tipo_reunion_id === tipoId && c.clase === clase && c.anio !== null);
  }

  protected conectar() {
    this.ocupado.set('conectar');
    this.api.urlAutorizacionDrive().subscribe({
      next: r => (window.location.href = r.url),
      error: err => {
        this.ocupado.set(null);
        this.error.set(mensajeError(err));
      },
    });
  }

  protected desconectar() {
    if (!confirm('¿Desconectar Google Drive? Los documentos ya sincronizados se conservan.')) return;
    this.api.desconectarDrive().subscribe(() => {
      this.mensaje.set('Google Drive se desconectó.');
      this.cargar();
    });
  }

  protected setEnlace(clave: string, valor: string) {
    this.enlaces.update(e => ({ ...e, [clave]: valor }));
  }

  protected guardarCarpeta(tipo: TipoReunion, clase: Clase) {
    const clave = this.claveDe(tipo.id, clase);
    const enlace = (this.enlaces()[clave] ?? '').trim();
    if (!enlace) return;
    this.ejecutar(clave, () => this.api.definirCarpetaDrive(tipo.id, clase, enlace), c => {
      this.mensaje.set(`Carpeta "${c.nombre}" asignada a ${tipo.nombre} (${clase}s).`);
      this.setEnlace(clave, '');
    });
  }

  protected quitarCarpeta(tipo: TipoReunion, clase: Clase) {
    const raiz = this.raices()[this.claveDe(tipo.id, clase)];
    if (!raiz || !confirm(`¿Quitar la carpeta de ${tipo.nombre} (${clase}s)? No se borra nada en Drive.`)) return;
    this.ejecutar(this.claveDe(tipo.id, clase), () => this.api.quitarCarpetaDrive(raiz.id), () => undefined);
  }

  protected importar(tipo: TipoReunion, clase: Clase) {
    if (!confirm(`Se leerán todas las carpetas de año y de sesión de ${tipo.nombre} (${clase}s) y se vincularán sus documentos.
Se ejecuta en segundo plano: puede seguir usando el sistema. ¿Continuar?`)) return;
    this.ejecutar(this.claveDe(tipo.id, clase), () => this.api.importarHistorial(tipo.id, clase), i => {
      this.importacion.set(i);
      this.iniciarSondeo();
    });
  }

  /** Consulta el avance cada 3 s mientras la importación esté en curso. */
  private iniciarSondeo() {
    if (this.sondeo) return;
    this.sondeo = setInterval(() => {
      this.api.estadoImportacion().subscribe(i => {
        this.importacion.set(i);
        if (i?.estado !== 'en_curso') {
          this.detenerSondeo();
          this.cargar();
        }
      });
    }, 3000);
  }

  private detenerSondeo() {
    if (this.sondeo) clearInterval(this.sondeo);
    this.sondeo = null;
  }

  private ejecutar<T>(clave: string, accion: () => Observable<T>, ok: (r: T) => void) {
    this.ocupado.set(clave);
    this.error.set(null);
    this.mensaje.set(null);
    accion().subscribe({
      next: r => {
        this.ocupado.set(null);
        ok(r);
        this.cargar();
      },
      error: err => {
        this.ocupado.set(null);
        this.error.set(mensajeError(err));
      },
    });
  }

  private cargar() {
    this.api.estadoDrive().subscribe({
      next: e => {
        this.estado.set(e);
        this.importacion.set(e.importacion);
        if (e.importacion?.estado === 'en_curso') this.iniciarSondeo();
      },
      error: err => this.error.set(mensajeError(err)),
    });
  }
}
