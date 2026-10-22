import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
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
  protected menu = MENU;
  protected abiertos = signal<Set<string>>(new Set(['Seguimiento Operativo']));
  protected menuMovil = signal(false);

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.menuMovil.set(false));
  }

  protected alternar(item: MenuItem) {
    const s = new Set(this.abiertos());
    s.has(item.etiqueta) ? s.delete(item.etiqueta) : s.add(item.etiqueta);
    this.abiertos.set(s);
  }
}
