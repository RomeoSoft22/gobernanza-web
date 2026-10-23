import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { AccesoService, rutaSegura } from '../../core/acceso.service';
import { mensajeError } from '../../shared/errores';

/**
 * El sistema se abre con la cuenta de Juarez Campos (identidad.juarezcampos.net).
 * Esta pantalla redirige sola al login de identidad; el botón queda por si la redirección falla.
 */
@Component({
  selector: 'app-acceso',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './acceso.scss',
  template: `
    <main class="acceso">
      <div class="tarjeta">
        <div class="logo">G</div>
        <h1>Gobernanza</h1>
        <p class="ayuda">Control de reuniones · Ingresa con tu cuenta de Juarez Campos.</p>
        @if (error()) {
          <div class="alerta-error">{{ error() }}</div>
        }
        <button class="btn primario bloque" type="button" (click)="ingresar()" [disabled]="redirigiendo()">
          {{ redirigiendo() ? 'Abriendo el inicio de sesión…' : 'Ingresar con mi cuenta' }}
        </button>
      </div>
    </main>
  `,
})
export class Acceso implements OnInit {
  private readonly acceso = inject(AccesoService);

  /** Ruta a la que volver tras ingresar (?volver=/reuniones/operativo/sesiones). */
  readonly volver = input<string>('/inicio');

  protected readonly redirigiendo = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.ingresar();
  }

  async ingresar(): Promise<void> {
    this.redirigiendo.set(true);
    this.error.set(null);
    try {
      await this.acceso.iniciar(rutaSegura(this.volver()));
    } catch (e) {
      this.error.set(e instanceof Error && !('status' in e) ? e.message : mensajeError(e, 'No se pudo abrir el inicio de sesión.'));
      this.redirigiendo.set(false);
    }
  }
}
