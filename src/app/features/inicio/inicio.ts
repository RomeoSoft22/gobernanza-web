import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { SesionesService } from '../../core/services/sesiones.service';
import { Icon } from '../../shared/icon/icon';
import { FechaLargaPipe } from '../../shared/pipes';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, Icon, FechaLargaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>Bienvenido</h1>
        <p>Panel de control de las reuniones de gobernanza a su cargo.</p>
      </div>
    </div>

    <div class="modulos">
      <a class="card modulo" routerLink="/seguimiento-operativo/sesiones">
        <div class="icono"><app-icon name="calendar" [size]="22" /></div>
        <div class="cuerpo">
          <h2>Seguimiento Operativo</h2>
          <p>Reunión semanal · RA 315-2026</p>
          @if (resumen(); as r) {
            <div class="datos">
              <span><strong>{{ r.total }}</strong> sesiones</span>
              @if (r.ultima) {
                <span>Última: <strong>N° {{ r.ultima.numero }}</strong> ({{ r.ultima.fecha | fechaLarga: false }})</span>
              }
              @if (r.realizadas_sin_acta) {
                <span class="alerta"><app-icon name="alert" [size]="14" /> {{ r.realizadas_sin_acta }} sin acta</span>
              }
            </div>
          }
        </div>
        <app-icon name="chevron" class="ir" />
      </a>

      <div class="card modulo deshabilitado">
        <div class="icono gris"><app-icon name="folder" [size]="22" /></div>
        <div class="cuerpo">
          <h2>Documentos clave</h2>
          <p>Normativa, lineamientos y documentos de referencia.</p>
          <div class="datos"><span>Próximamente</span></div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .modulos { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
    .modulo {
      display: flex; gap: 14px; align-items: flex-start; text-decoration: none; color: inherit;
      transition: border-color .15s, box-shadow .15s;
    }
    a.modulo:hover { border-color: var(--primario); box-shadow: 0 4px 16px rgba(29, 78, 216, .1); }
    .icono {
      width: 46px; height: 46px; border-radius: 12px; display: grid; place-items: center;
      background: var(--primario-suave); color: var(--primario); flex-shrink: 0;
    }
    .icono.gris { background: #f1f5f9; color: var(--texto-3); }
    .cuerpo { flex: 1; }
    .cuerpo p { margin: 2px 0 10px; color: var(--texto-2); }
    .datos { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 13px; color: var(--texto-2); }
    .alerta { color: var(--alerta); display: inline-flex; align-items: center; gap: 4px; font-weight: 600; }
    .ir { color: var(--texto-3); align-self: center; }
    .deshabilitado { opacity: .65; }
  `,
})
export class Inicio {
  protected resumen = toSignal(inject(SesionesService).resumen());
}
