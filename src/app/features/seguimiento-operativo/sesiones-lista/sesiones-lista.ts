import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { catchError, combineLatest, debounceTime, distinctUntilChanged, filter, map, of, switchMap, tap } from 'rxjs';
import {
  AnioSesiones, CLASES, Clase, DOCUMENTACION, ESTADOS, FiltrosSesion, MESES, MODALIDADES, Paginado, Resumen, Sesion,
  TipoReunion,
} from '../../../core/models/sesion.model';
import { SesionesService } from '../../../core/services/sesiones.service';
import { mensajeError } from '../../../shared/errores';
import { Icon } from '../../../shared/icon/icon';
import { FechaLargaPipe, HoraPipe } from '../../../shared/pipes';

const CAMPOS_FILTRO = ['buscar', 'numero', 'mes', 'fecha_desde', 'fecha_hasta', 'estado', 'modalidad', 'documentacion'] as const;

@Component({
  selector: 'app-sesiones-lista',
  imports: [ReactiveFormsModule, RouterLink, Icon, FechaLargaPipe, HoraPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sesiones-lista.html',
  styleUrl: './sesiones-lista.scss',
})
export class SesionesLista {
  private api = inject(SesionesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  protected readonly estados = ESTADOS;
  protected readonly modalidades = MODALIDADES;
  protected readonly documentacion = DOCUMENTACION;
  protected readonly meses = MESES;
  protected readonly clases = CLASES;

  protected tipo = signal<TipoReunion | null>(null);
  protected anios = signal<AnioSesiones[]>([]);
  protected resumen = signal<Resumen | null>(null);
  protected pagina = signal<Paginado<Sesion> | null>(null);
  protected cargando = signal(true);
  protected error = signal<string | null>(null);
  protected aviso = signal<string | null>(null);
  protected creandoAnio = signal(false);

  /** Panel de filtros avanzados: cerrado por defecto, abierto si llegan filtros en la URL. */
  protected mostrarFiltros = signal(
    CAMPOS_FILTRO.some(c => c !== 'buscar' && !!this.route.snapshot.queryParamMap.get(c)),
  );

  protected form = this.fb.group({
    buscar: [''], numero: [''], mes: [''], fecha_desde: [''], fecha_hasta: [''],
    estado: [''], modalidad: [''], documentacion: [''],
  });

  /** Filtros vigentes, tomados siempre de la URL (así se pueden compartir/guardar). */
  protected filtros = toSignal(this.route.queryParamMap.pipe(map(q => this.leerFiltros(q))), {
    initialValue: {} as FiltrosSesion,
  });

  protected anioActivo = computed(() => this.filtros().anio ?? null);
  protected claseActiva = computed(() => this.filtros().clase ?? null);
  protected filtrosActivos = computed(() => CAMPOS_FILTRO.filter(c => !!(this.filtros() as any)[c]).length);
  protected paginas = computed(() => {
    const p = this.pagina();
    if (!p) return [];
    const inicio = Math.max(1, p.current_page - 2);
    const fin = Math.min(p.last_page, inicio + 4);
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  });

  constructor() {
    const tipo$ = this.route.paramMap.pipe(
      switchMap(p => this.api.tipoPorSlug(p.get('reunion') ?? '')),
      tap(t => {
        this.tipo.set(t ?? null);
        if (!t) this.error.set('La reunión solicitada no existe.');
      }),
      filter((t): t is TipoReunion => !!t),
      distinctUntilChanged((a, b) => a.id === b.id),
      tap(t => this.cargarAnios(t.id)),
    );

    combineLatest([tipo$, this.route.queryParamMap.pipe(map(q => this.leerFiltros(q)))]).pipe(
      tap(([t, f]) => {
        this.form.patchValue(
          Object.fromEntries(CAMPOS_FILTRO.map(c => [c, (f as any)[c] ?? ''])),
          { emitEvent: false },
        );
        this.cargando.set(true);
        this.error.set(null);
        this.api.resumen({ tipo_reunion_id: t.id, anio: f.anio, clase: f.clase }).subscribe(r => this.resumen.set(r));
      }),
      switchMap(([t, f]) => this.api.listar({ ...f, tipo_reunion_id: t.id }).pipe(catchError(err => {
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
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.navegar({ ...this.form.getRawValue(), page: null }));
  }

  protected base() {
    return `/reuniones/${this.tipo()?.slug ?? ''}/sesiones`;
  }

  protected seleccionarAnio(anio: number | null) {
    this.navegar({ anio, page: null, fecha_desde: null, fecha_hasta: null, mes: null });
  }

  protected seleccionarClase(clase: Clase | null) {
    this.navegar({ clase, page: null, numero: null });
  }

  /** Crea el año: en Drive se generan las carpetas de ordinarias y extraordinarias. */
  protected nuevoAnio() {
    const t = this.tipo();
    if (!t) return;
    const sugerido = Math.max(new Date().getFullYear(), ...this.anios().map(a => a.anio + 1));
    const valor = prompt(`Año a crear para ${t.nombre}.\nSe crearán sus carpetas de reuniones ordinarias y extraordinarias en Google Drive.`, String(sugerido));
    const anio = Number(valor);
    if (!valor || !Number.isInteger(anio) || anio < 2000 || anio > 2100) return;

    this.creandoAnio.set(true);
    this.aviso.set(null);
    this.api.crearAnio(t.id, anio).subscribe({
      next: carpetas => {
        this.creandoAnio.set(false);
        this.aviso.set(`Año ${anio} creado en Drive (${Object.keys(carpetas).map(c => c + 's').join(' y ')}).`);
        this.cargarAnios(t.id);
        this.seleccionarAnio(anio);
      },
      error: err => {
        this.creandoAnio.set(false);
        this.error.set(mensajeError(err, 'No se pudo crear el año.'));
      },
    });
  }

  protected ordenarPor(campo: 'numero' | 'fecha') {
    const f = this.filtros();
    const direccion = (f.orden ?? 'fecha') === campo && (f.direccion ?? 'desc') === 'desc' ? 'asc' : 'desc';
    this.navegar({ orden: campo, direccion });
  }

  protected icono(campo: string) {
    const f = this.filtros();
    if ((f.orden ?? 'fecha') !== campo) return '';
    return (f.direccion ?? 'desc') === 'desc' ? '↓' : '↑';
  }

  protected irAPagina(page: number) {
    this.navegar({ page });
  }

  protected limpiar() {
    this.navegar(Object.fromEntries(CAMPOS_FILTRO.map(c => [c, null])));
  }

  /** Atajo desde los indicadores: lista las sesiones realizadas con documentación pendiente. */
  protected verPendientes(documentacion: 'sin_acta' | 'incompleta') {
    this.mostrarFiltros.set(true);
    this.navegar({ estado: 'realizada', documentacion, page: null });
  }

  protected abrir(s: Sesion) {
    this.router.navigate([this.base(), s.id]);
  }

  private cargarAnios(tipoId: number) {
    this.api.anios(tipoId).subscribe(a => this.anios.set(a));
  }

  private navegar(cambios: Params) {
    const limpio = Object.fromEntries(
      Object.entries(cambios).map(([k, v]) => [k, v === '' || v === undefined ? null : v]),
    );
    this.router.navigate([], { relativeTo: this.route, queryParams: limpio, queryParamsHandling: 'merge' });
  }

  private leerFiltros(q: { get(k: string): string | null }): FiltrosSesion {
    const num = (k: string) => (q.get(k) ? Number(q.get(k)) : null);
    return {
      clase: (q.get('clase') as Clase) ?? null,
      anio: num('anio'),
      numero: num('numero'),
      mes: num('mes'),
      fecha_desde: q.get('fecha_desde'),
      fecha_hasta: q.get('fecha_hasta'),
      estado: (q.get('estado') as FiltrosSesion['estado']) ?? null,
      modalidad: (q.get('modalidad') as FiltrosSesion['modalidad']) ?? null,
      documentacion: q.get('documentacion'),
      buscar: q.get('buscar'),
      orden: q.get('orden') ?? 'fecha',
      direccion: (q.get('direccion') as 'asc' | 'desc') ?? 'desc',
      page: num('page') ?? 1,
      por_pagina: 15,
    };
  }
}
