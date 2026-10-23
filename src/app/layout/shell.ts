import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AccesoService } from '../core/acceso.service';
import { MENU, MenuItem } from '../core/menu';
import { Icon } from '../shared/icon/icon';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private router = inject(Router);
  protected acceso = inject(AccesoService);
  /** Menú según el perfil: las opciones de administración solo aparecen al administrador. */
  protected menu = computed(() => MENU
    .map(seccion => ({ ...seccion, items: seccion.items.filter(i => !i.soloAdmin || this.acceso.esAdmin()) }))
    .filter(seccion => seccion.items.length > 0));
  protected abiertos = signal<Set<string>>(new Set(['Seguimiento Operativo', 'Seguimiento Táctico']));
  protected menuMovil = signal(false);

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.menuMovil.set(false));
  }

  /** Cierra la sesión aquí y en identidad, sin pedir confirmación. */
  protected salir() {
    this.acceso.salir();
  }

  protected alternar(item: MenuItem) {
    const s = new Set(this.abiertos());
    s.has(item.etiqueta) ? s.delete(item.etiqueta) : s.add(item.etiqueta);
    this.abiertos.set(s);
  }
}
