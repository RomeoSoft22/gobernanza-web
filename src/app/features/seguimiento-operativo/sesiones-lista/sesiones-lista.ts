import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, map, switchMap, tap, catchError, of } from 'rxjs';
import {
  AnioSesiones, DOCUMENTACION, ESTADOS, FiltrosSesion, MESES, MODALIDADES, Paginado, Resumen, Sesion,
} from '../../../core/models/sesion.model';
import { SesionesService } from '../../../core/services/sesiones.service';
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

  protected tipos = toSignal(this.api.tiposReunion(), { initialValue: [] });
  protected tipo = computed(() => this.tipos()[0] ?? null);
  protected anios = signal<AnioSesiones[]>([]);
  protected resumen = signal<Resumen | null>(null);
  protected pagina = signal<Paginado<Sesion> | null>(null);
  protected cargando = signal(true);
  protected error = signal<string | null>(null);
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
  protected filtrosActivos = computed(() => CAMPOS_FILTRO.filter(c => !!(this.filtros() as any)[c]).length);
  protected paginas = computed(() => {
    const p = this.pagina();
    if (!p) return [];
    const inicio = Math.max(1, p.current_page - 2);
    const fin = Math.min(p.last_page, inicio + 4);
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  });

  constructor() {
    this.api.anios().subscribe(a => this.anios.set(a));

    this.route.queryParamMap.pipe(
      map(q => this.leerFiltros(q)),
      tap(f => {
        this.form.patchValue(
          Object.fromEntries(CAMPOS_FILTRO.map(c => [c, (f as any)[c] ?? ''])),
          { emitEvent: false },
        );
        this.cargando.set(true);
        this.error.set(null);
        this.api.resumen({ anio: f.anio }).subscribe(r => this.resumen.set(r));
      }),
      switchMap(f => this.api.listar(f).pipe(catchError(() => {
        this.error.set('No se pudo conectar con el servidor. Verifique que la API esté en ejecución.');
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

  protected seleccionarAnio(anio: number | null) {
    this.navegar({ anio, page: null, fecha_desde: null, fecha_hasta: null, mes: null });
  }

  protected ordenarPor(campo: 'numero' | 'fecha') {
    const f = this.filtros();
    const direccion = (f.orden ?? 'numero') === campo && (f.direccion ?? 'desc') === 'desc' ? 'asc' : 'desc';
    this.navegar({ orden: campo, direccion });
  }

  protected icono(campo: string) {
    const f = this.filtros();
    if ((f.orden ?? 'numero') !== campo) return '';
    return (f.direccion ?? 'desc') === 'desc' ? '↓' : '↑';
  }

  /** Atajo desde los indicadores: lista las sesiones realizadas con documentación pendiente. */
  protected verPendientes(documentacion: 'sin_acta' | 'incompleta') {
    this.mostrarFiltros.set(true);
    this.navegar({ estado: 'realizada', documentacion, page: null });
  }

  protected irAPagina(page: number) {
    this.navegar({ page });
  }

  protected limpiar() {
    this.navegar(Object.fromEntries(CAMPOS_FILTRO.map(c => [c, null])));
  }

  protected abrir(s: Sesion) {
    this.router.navigate(['/seguimiento-operativo/sesiones', s.id]);
  }

  protected documentosCompletos(s: Sesion) {
    return !!(s.acta_count && s.asistencia_count && s.presentacion_count);
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
      anio: num('anio'),
      numero: num('numero'),
      mes: num('mes'),
      fecha_desde: q.get('fecha_desde'),
      fecha_hasta: q.get('fecha_hasta'),
      estado: (q.get('estado') as FiltrosSesion['estado']) ?? null,
      modalidad: (q.get('modalidad') as FiltrosSesion['modalidad']) ?? null,
      documentacion: q.get('documentacion'),
      buscar: q.get('buscar'),
      orden: q.get('orden') ?? 'numero',
      direccion: (q.get('direccion') as 'asc' | 'desc') ?? 'desc',
      page: num('page') ?? 1,
      por_pagina: 15,
    };
  }
}
