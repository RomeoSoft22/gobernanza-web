import { Routes } from '@angular/router';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        title: 'Inicio | Gobernanza',
        loadComponent: () => import('./features/inicio/inicio').then(m => m.Inicio),
      },
      {
        // :reunion = slug de tipos_reunion (operativo, tactico)
        path: 'reuniones/:reunion',
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'sesiones' },
          {
            path: 'sesiones',
            title: 'Sesiones | Gobernanza',
            loadComponent: () => import('./features/seguimiento-operativo/sesiones-lista/sesiones-lista').then(m => m.SesionesLista),
          },
          {
            path: 'sesiones/nueva',
            title: 'Nueva sesión | Gobernanza',
            loadComponent: () => import('./features/seguimiento-operativo/sesion-form/sesion-form').then(m => m.SesionForm),
          },
          {
            path: 'sesiones/:id',
            title: 'Detalle de sesión | Gobernanza',
            loadComponent: () => import('./features/seguimiento-operativo/sesion-detalle/sesion-detalle').then(m => m.SesionDetalle),
          },
          {
            path: 'sesiones/:id/editar',
            title: 'Editar sesión | Gobernanza',
            loadComponent: () => import('./features/seguimiento-operativo/sesion-form/sesion-form').then(m => m.SesionForm),
          },
        ],
      },
      // Compatibilidad con los enlaces anteriores
      { path: 'seguimiento-operativo', redirectTo: 'reuniones/operativo/sesiones' },
      { path: 'seguimiento-operativo/sesiones', redirectTo: 'reuniones/operativo/sesiones' },
      {
        path: 'configuracion/drive',
        title: 'Google Drive | Configuración',
        loadComponent: () => import('./features/configuracion/drive-config').then(m => m.DriveConfig),
      },
      {
        path: 'documentos-clave',
        title: 'Documentos clave | Gobernanza',
        data: { titulo: 'Documentos clave' },
        loadComponent: () => import('./features/proximamente/proximamente').then(m => m.Proximamente),
      },
      { path: '**', redirectTo: 'inicio' },
    ],
  },
];
