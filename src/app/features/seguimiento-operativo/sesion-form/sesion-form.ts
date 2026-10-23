import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CLASES, Clase, ESTADOS, MODALIDADES, SesionPayload, TipoReunion } from '../../../core/models/sesion.model';
import { SesionesService } from '../../../core/services/sesiones.service';
import { mensajeError } from '../../../shared/errores';
import { Icon } from '../../../shared/icon/icon';

@Component({
  selector: 'app-sesion-form',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sesion-form.html',
  styleUrl: './sesion-form.scss',
})
export class SesionForm implements OnInit {
  private api = inject(SesionesService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  /** Slug de la reunión (:reunion) y, al editar, el :id de la sesión. */
  reunion = input.required<string>();
  id = input<string>();

  protected readonly estados = ESTADOS;
  protected readonly modalidades = MODALIDADES;
  protected readonly clases = CLASES;
  protected tipo = signal<TipoReunion | null>(null);
  protected guardando = signal(false);
  protected erroresServidor = signal<Record<string, string[]>>({});
  protected errorGeneral = signal<string | null>(null);

  protected form = this.fb.nonNullable.group({
    tipo_reunion_id: [0, Validators.required],
    clase: ['ordinaria' as Clase, Validators.required],
    numero: [0, [Validators.required, Validators.min(1)]],
    fecha: [new Date().toISOString().substring(0, 10), Validators.required],
    hora_inicio: [''],
    hora_fin: [''],
    modalidad: ['presencial', Validators.required],
    lugar: [''],
    estado: ['realizada', Validators.required],
    agenda: [''],
    acuerdos: [''],
    observaciones: [''],
  });

  get editando() {
    return !!this.id();
  }

  protected base() {
    return `/reuniones/${this.reunion()}/sesiones`;
  }

  ngOnInit() {
    this.api.tipoPorSlug(this.reunion()).subscribe(tipo => {
      if (!tipo) {
        this.errorGeneral.set('La reunión solicitada no existe.');
        return;
      }
      this.tipo.set(tipo);
      if (this.editando) return;

      const clase = this.route.snapshot.queryParamMap.get('clase') as Clase | null;
      this.form.patchValue({ tipo_reunion_id: tipo.id, clase: clase === 'extraordinaria' ? clase : 'ordinaria' });
      this.sugerirNumero();
    });

    if (this.editando) {
      this.api.obtener(Number(this.id())).subscribe(s => this.form.patchValue({
        ...s,
        hora_inicio: s.hora_inicio?.substring(0, 5) ?? '',
        hora_fin: s.hora_fin?.substring(0, 5) ?? '',
        lugar: s.lugar ?? '', agenda: s.agenda ?? '', acuerdos: s.acuerdos ?? '', observaciones: s.observaciones ?? '',
      }));
    }
  }

  protected cambiarClase() {
    if (!this.editando) this.sugerirNumero();
  }

  protected error(campo: string): string | null {
    const srv = this.erroresServidor()[campo];
    if (srv?.length) return srv[0];
    const c = this.form.get(campo);
    if (c && c.invalid && c.touched) return 'Campo obligatorio o inválido.';
    return null;
  }

  protected guardar() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const payload = {
      ...v,
      numero: Number(v.numero),
      hora_inicio: v.hora_inicio || null,
      hora_fin: v.hora_fin || null,
    } as SesionPayload;

    this.guardando.set(true);
    this.erroresServidor.set({});
    this.errorGeneral.set(null);

    const peticion = this.editando
      ? this.api.actualizar(Number(this.id()), payload)
      : this.api.crear(payload);

    peticion.subscribe({
      next: s => {
        if (s.aviso_drive) alert(s.aviso_drive);
        this.router.navigate([this.base(), s.id]);
      },
      error: err => {
        this.guardando.set(false);
        if (err.status === 422 && err.error?.errors) this.erroresServidor.set(err.error.errors);
        else this.errorGeneral.set(mensajeError(err, 'No se pudo guardar la sesión. Intente nuevamente.'));
      },
    });
  }

  /** Las extraordinarias reinician su numeración cada año: al cambiar la fecha se recalcula. */
  protected cambiarFecha() {
    if (!this.editando && this.form.controls.clase.value === 'extraordinaria') this.sugerirNumero();
  }

  private sugerirNumero() {
    const { tipo_reunion_id, clase, fecha } = this.form.getRawValue();
    if (!tipo_reunion_id) return;
    const anio = Number(fecha?.substring(0, 4)) || new Date().getFullYear();
    this.api.siguienteNumero(tipo_reunion_id, clase, anio).subscribe(r => this.form.patchValue({ numero: r.numero }));
  }
}
