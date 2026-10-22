import { ChangeDetectionStrategy, Component, inject, input, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ESTADOS, MODALIDADES, SesionPayload, TipoReunion } from '../../../core/models/sesion.model';
import { SesionesService } from '../../../core/services/sesiones.service';
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
  private fb = inject(FormBuilder);

  /** :id cuando se edita; ausente al crear. */
  id = input<string>();

  protected readonly estados = ESTADOS;
  protected readonly modalidades = MODALIDADES;
  protected tipos = signal<TipoReunion[]>([]);
  protected guardando = signal(false);
  protected erroresServidor = signal<Record<string, string[]>>({});
  protected errorGeneral = signal<string | null>(null);

  protected form = this.fb.nonNullable.group({
    tipo_reunion_id: [0, Validators.required],
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

  ngOnInit() {
    this.api.tiposReunion().subscribe(tipos => {
      this.tipos.set(tipos);
      if (this.editando) return;
      const tipo = tipos[0];
      if (!tipo) return;
      this.form.patchValue({ tipo_reunion_id: tipo.id });
      this.sugerirNumero(tipo.id);
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

  protected cambiarTipo() {
    if (!this.editando) this.sugerirNumero(this.form.controls.tipo_reunion_id.value);
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
      tipo_reunion_id: Number(v.tipo_reunion_id),
      numero: Number(v.numero),
      hora_inicio: v.hora_inicio || null,
      hora_fin: v.hora_fin || null,
    } as unknown as SesionPayload;

    this.guardando.set(true);
    this.erroresServidor.set({});
    this.errorGeneral.set(null);

    const peticion = this.editando
      ? this.api.actualizar(Number(this.id()), payload)
      : this.api.crear(payload);

    peticion.subscribe({
      next: s => this.router.navigate(['/seguimiento-operativo/sesiones', s.id]),
      error: err => {
        this.guardando.set(false);
        if (err.status === 422) this.erroresServidor.set(err.error.errors ?? {});
        else this.errorGeneral.set('No se pudo guardar la sesión. Intente nuevamente.');
      },
    });
  }

  private sugerirNumero(tipoId: number) {
    this.api.siguienteNumero(tipoId).subscribe(r => this.form.patchValue({ numero: r.numero }));
  }
}
