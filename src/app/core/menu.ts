import { IconName } from '../shared/icon/icon';

export interface MenuItem {
  etiqueta: string;
  icono: IconName;
  ruta?: string;
  hijos?: MenuItem[];
  /** Muestra la opción deshabilitada con la etiqueta "Próximamente". */
  proximamente?: boolean;
  /** Solo visible para el perfil administrador. */
  soloAdmin?: boolean;
}

export interface MenuSeccion {
  titulo: string;
  items: MenuItem[];
}

/** Submenú estándar de una reunión de gobernanza (el slug viene de tipos_reunion). */
const reunion = (etiqueta: string, slug: string, icono: IconName): MenuItem => ({
  etiqueta,
  icono,
  hijos: [
    { etiqueta: 'Sesiones', icono: 'list', ruta: `/reuniones/${slug}/sesiones` },
    { etiqueta: 'Nueva sesión', icono: 'plus', ruta: `/reuniones/${slug}/sesiones/nueva` },
  ],
});

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
      reunion('Seguimiento Operativo', 'operativo', 'calendar'),
      reunion('Seguimiento Táctico', 'tactico', 'target'),
      { etiqueta: 'Documentos clave', icono: 'folder', ruta: '/documentos-clave', proximamente: true },
    ],
  },
  {
    titulo: 'Administración',
    items: [
      { etiqueta: 'Google Drive', icono: 'cloud', ruta: '/configuracion/drive', soloAdmin: true },
      { etiqueta: 'Auditoría', icono: 'shield', ruta: '/auditoria', soloAdmin: true },
    ],
  },
];
