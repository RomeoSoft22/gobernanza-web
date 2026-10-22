import { IconName } from '../shared/icon/icon';

export interface MenuItem {
  etiqueta: string;
  icono: IconName;
  ruta?: string;
  hijos?: MenuItem[];
  /** Muestra la opción deshabilitada con la etiqueta "Próximamente". */
  proximamente?: boolean;
}

export interface MenuSeccion {
  titulo: string;
  items: MenuItem[];
}

/**
 * Menú principal del sistema. Para agregar una opción nueva basta con
 * añadirla aquí y registrar su ruta en app.routes.ts.
 */
export const MENU: MenuSeccion[] = [
  {
    titulo: 'General',
    items: [{ etiqueta: 'Inicio', icono: 'home', ruta: '/inicio' }],
  },
  {
    titulo: 'Gobernanza',
    items: [
      {
        etiqueta: 'Seguimiento Operativo',
        icono: 'calendar',
        hijos: [
          { etiqueta: 'Sesiones', icono: 'list', ruta: '/seguimiento-operativo/sesiones' },
          { etiqueta: 'Nueva sesión', icono: 'plus', ruta: '/seguimiento-operativo/sesiones/nueva' },
        ],
      },
      { etiqueta: 'Documentos clave', icono: 'folder', ruta: '/documentos-clave', proximamente: true },
    ],
  },
];
