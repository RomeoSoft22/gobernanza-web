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
        path: 'seguimiento-operativo',
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'sesiones' },
          {
            path: 'sesiones',
            title: 'Sesiones | Seguimiento Operativo',
            loadComponent: () => import('./features/seguimiento-operativo/sesiones-lista/sesiones-lista').then(m => m.SesionesLista),
          },
          {
            path: 'sesiones/nueva',
            title: 'Nueva sesión | Seguimiento Operativo',
            loadComponent: () => import('./features/seguimiento-operativo/sesion-form/sesion-form').then(m => m.SesionForm),
          },
          {
            path: 'sesiones/:id',
            title: 'Detalle de sesión | Seguimiento Operativo',
            loadComponent: () => import('./features/seguimiento-operativo/sesion-detalle/sesion-detalle').then(m => m.SesionDetalle),
          },
          {
            path: 'sesiones/:id/editar',
            title: 'Editar sesión | Seguimiento Operativo',
            loadComponent: () => import('./features/seguimiento-operativo/sesion-form/sesion-form').then(m => m.SesionForm),
          },
        ],
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
