# gobernanza-web

Front-end (Angular 20) del **Sistema de Control de Reuniones de Gobernanza**: sesiones de la reunión de
Seguimiento Operativo (RA 315-2026) separadas por año, con filtros de búsqueda y gestión de acta,
lista de asistencia, presentación y adjuntos.

La API está en [gobernanza-api](https://github.com/RomeoSoft22/gobernanza-api).

## Desarrollo

```bash
npm install
npm start          # http://localhost:4200
```

La URL de la API se configura en `src/environments/environment.ts` (por defecto `http://127.0.0.1:8000/api`).

## Estructura

```
src/app/
├── core/
│   ├── menu.ts                  # opciones del menú lateral
│   ├── models/sesion.model.ts   # tipos, estados, catálogos
│   └── services/sesiones.service.ts
├── layout/shell.*               # menú lateral + cabecera
├── shared/                      # iconos y pipes
└── features/
    ├── inicio/
    ├── proximamente/            # reserva para módulos futuros (Documentos clave)
    └── seguimiento-operativo/
        ├── sesiones-lista/      # pestañas por año, indicadores, filtros, tabla
        ├── sesion-detalle/      # datos de la sesión + documentos
        ├── sesion-form/         # crear / editar
        └── documento-slot/      # subir, ver, descargar, reemplazar, eliminar
```

## Agregar una opción al menú

1. Añadir el ítem en `src/app/core/menu.ts`.
2. Registrar su ruta en `src/app/app.routes.ts`.

## Build

```bash
npm run build      # dist/gobernanza-web
```
