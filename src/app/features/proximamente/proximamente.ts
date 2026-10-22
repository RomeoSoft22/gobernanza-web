import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Página de reserva para módulos del menú aún no implementados. */
@Component({
  selector: 'app-proximamente',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card vacio">
      <h1>{{ titulo() }}</h1>
      <p>Este módulo estará disponible próximamente.</p>
      <a class="btn" routerLink="/inicio">Ir al inicio</a>
    </div>
  `,
  styles: `.vacio { max-width: 520px; margin: 40px auto; } p { color: var(--texto-2); }`,
})
export class Proximamente {
  /** Viene de la propiedad data de la ruta. */
  titulo = input('Módulo en construcción');
}
