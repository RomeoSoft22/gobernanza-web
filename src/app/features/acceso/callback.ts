import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AccesoService } from '../../core/acceso.service';
import { mensajeError } from '../../shared/errores';

/** Destino de la redirección de identidad: canjea el código y vuelve a la página que se quería abrir. */
@Component({
  selector: 'app-callback',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './acceso.scss',
  template: `
    <main class="acceso">
      <div class="tarjeta">
        @if (error()) {
          <h1>No se pudo iniciar sesión</h1>
          <div class="alerta-error">{{ error() }}</div>
          <a class="btn primario bloque" routerLink="/acceso">Volver a ingresar</a>
        } @else {
          <div class="spinner" aria-hidden="true"></div>
          <p class="ayuda" role="status">Validando tu sesión…</p>
        }
      </div>
    </main>
  `,
})
export class Callback implements OnInit {
  private readonly acceso = inject(AccesoService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const params = this.ruta.snapshot.queryParamMap;
    const code = params.get('code');
    const state = params.get('state');

    if (params.get('error')) {
      this.error.set('Identidad no permitió el ingreso. Verifica que tu cuenta tenga acceso a Gobernanza.');
      return;
    }
    if (!code || !state) {
      this.error.set('El enlace de ingreso está incompleto. Vuelve a intentarlo.');
      return;
    }
    try {
      const volver = await this.acceso.completar(code, state);
      await this.router.navigateByUrl(volver, { replaceUrl: true });
    } catch (e) {
      this.error.set(e instanceof Error && !('status' in e) ? e.message : mensajeError(e, 'No se pudo validar tu sesión.'));
    }
  }
}
