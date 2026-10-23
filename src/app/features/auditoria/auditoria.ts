import { DatePipe, KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { EventoAuditoria, FiltrosAuditoria, Paginado } from '../../core/models/sesion.model';
import { SesionesService } from '../../core/services/sesiones.service';
import { mensajeError } from '../../shared/errores';
import { Icon } from '../../shared/icon/icon';

const CAMPOS = ['desde', 'hasta', 'modulo', 'accion', 'usuario', 'buscar'] as const;

/** Nombres legibles de los campos de una sesión (para el "antes / después"). */
const CAMPOS_SESION: Record<string, string> = {
  clase: 'Clase', numero: 'N° de sesión', fecha: 'Fecha', hora_inicio: 'Hora de inicio', hora_fin: 'Hora de fin',
  modalidad: 'Modalidad', lugar: 'Lugar', estado: 'Estado', agenda: 'Agenda', acuerdos: 'Acuerdos', observaciones: 'Observaciones',
};

/** Auditoría de la gobernanza (solo perfil administrador). */
@Component({
  selector: 'app-auditoria',
  imports: [ReactiveFormsModule, DatePipe, KeyValuePipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auditoria.html',
  styleUrl: './auditoria.scss',
})
export class AuditoriaPagina {
  private api = inject(SesionesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  protected catalogos = toSignal(this.api.catalogosAuditoria());
  protected etiquetas = computed(() =>
    Object.fromEntries((this.catalogos()?.acciones ?? []).map(a => [a.valor, a.etiqueta])) as Partial<Record<string, string>>);

  protected pagina = signal<Paginado<EventoAuditoria> | null>(null);
  protected cargando = signal(true);
  protected exportando = signal(false);
  protected error = signal<string | null>(null);
  protected abierto = signal<number | null>(null);

  protected form = this.fb.group({ desde: [''], hasta: [''], modulo: [''], accion: [''], usuario: [''], buscar: [''] });

  private filtros = toSignal(this.route.queryParamMap.pipe(map(q => this.leer(q))), { initialValue: {} as FiltrosAuditoria });
  protected hayFiltros = computed(() => CAMPOS.some(c => !!(this.filtros() as Record<string, unknown>)[c]));

  constructor() {
    this.route.queryParamMap.pipe(
      map(q => this.leer(q)),
      tap(f => {
        this.form.patchValue(Object.fromEntries(CAMPOS.map(c => [c, (f as Record<string, unknown>)[c] ?? ''])), { emitEvent: false });
        this.cargando.set(true);
        this.error.set(null);
      }),
      switchMap(f => this.api.auditoria(f).pipe(catchError(err => {
        this.error.set(mensajeError(err));
        return of(null);
      }))),
      takeUntilDestroyed(),
    ).subscribe(p => {
      this.pagina.set(p);
      this.cargando.set(false);
    });

    this.form.valueChanges.pipe(
      debounceTime(350),
      map(v => JSON.stringify(v)),
      distinctUntilChanged(),
      takeUntilDestroyed(),
    ).subscribe(() => this.navegar({ ...this.form.getRawValue(), page: null }));
  }

  protected limpiar() {
    this.navegar(Object.fromEntries(CAMPOS.map(c => [c, null])));
  }

  protected irAPagina(page: number) {
    this.navegar({ page });
  }

  protected alternar(e: EventoAuditoria) {
    this.abierto.set(this.abierto() === e.id ? null : e.id);
  }

  /** Color del distintivo según el tipo de acción. */
  protected tono(accion: string): string {
    if (/eliminad|quitad|desconectad|error/.test(accion)) return 'rojo';
    if (/creada|creado|subido|conectado|asignada|terminada/.test(accion)) return 'verde';
    if (/movido|actualizada|editado/.test(accion)) return 'ambar';
    return 'azul';
  }

  /** Cambios "antes / después" de una sesión editada, con nombres legibles. */
  protected cambios(e: EventoAuditoria): { campo: string; antes: unknown; despues: unknown }[] {
    const c = e.datos?.['cambios'] as Record<string, { antes: unknown; despues: unknown }> | undefined;
    return c ? Object.entries(c).map(([k, v]) => ({ campo: CAMPOS_SESION[k] ?? k, antes: v.antes, despues: v.despues })) : [];
  }

  /** Resto de datos del evento, sin los cambios (que se muestran aparte). */
  protected otrosDatos(e: EventoAuditoria): Record<string, unknown> {
    const { cambios, ...resto } = e.datos ?? {};
    return resto;
  }

  protected texto(v: unknown): string {
    if (v === null || v === undefined || v === '') return '—';
    if (Array.isArray(v)) {
      return v.length ? v.map(x => (typeof x === 'object' ? Object.values(x as object).filter(Boolean).join(' · ') : String(x))).join('\n') : '—';
    }
    if (typeof v === 'object') return Object.entries(v as object).map(([k, x]) => `${k}: ${x ?? '—'}`).join('\n');
    return String(v);
  }

  protected exportar() {
    this.exportando.set(true);
    this.api.exportarAuditoria(this.filtros()).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `auditoria-gobernanza-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.exportando.set(false);
      },
      error: err => {
        this.exportando.set(false);
        this.error.set(mensajeError(err, 'No se pudo exportar la auditoría.'));
      },
    });
  }

  private navegar(cambios: Params) {
    const limpio = Object.fromEntries(Object.entries(cambios).map(([k, v]) => [k, v === '' || v === undefined ? null : v]));
    this.router.navigate([], { relativeTo: this.route, queryParams: limpio, queryParamsHandling: 'merge' });
  }

  private leer(q: { get(k: string): string | null }): FiltrosAuditoria {
    return {
      desde: q.get('desde'), hasta: q.get('hasta'), modulo: q.get('modulo'), accion: q.get('accion'),
      usuario: q.get('usuario'), buscar: q.get('buscar'), page: Number(q.get('page')) || 1,
    };
  }
}
