export type EstadoSesion = 'programada' | 'realizada' | 'reprogramada' | 'suspendida';
export type Modalidad = 'presencial' | 'virtual' | 'mixta';
export type TipoDocumento = 'acta' | 'asistencia' | 'presentacion' | 'adjunto';
export type Clase = 'ordinaria' | 'extraordinaria';

export interface TipoReunion {
  id: number;
  codigo: string;
  slug: string;
  nombre: string;
  base_legal: string | null;
  periodicidad: string | null;
  descripcion: string | null;
}

export interface SesionDocumento {
  id: number;
  sesion_id: number;
  tipo: TipoDocumento;
  nombre_original: string;
  mime: string | null;
  tamano: number;
  descripcion: string | null;
  created_at: string;
  drive_file_id: string | null;
  drive_url: string | null;
  drive_modificado_at: string | null;
}

export interface Sesion {
  id: number;
  tipo_reunion_id: number;
  clase: Clase;
  numero: number;
  anio: number;
  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  modalidad: Modalidad;
  lugar: string | null;
  estado: EstadoSesion;
  agenda: string | null;
  acuerdos: string | null;
  observaciones: string | null;
  drive_folder_id: string | null;
  drive_folder_url: string | null;
  drive_sincronizado_at: string | null;
  aviso_drive?: string | null;
  tipo_reunion?: TipoReunion;
  documentos?: SesionDocumento[];
  acta_count?: number;
  asistencia_count?: number;
  presentacion_count?: number;
  adjuntos_count?: number;
}

export type SesionPayload = Pick<Sesion,
  'tipo_reunion_id' | 'clase' | 'numero' | 'fecha' | 'hora_inicio' | 'hora_fin' | 'modalidad'
  | 'lugar' | 'estado' | 'agenda' | 'acuerdos' | 'observaciones'>;

export interface AnioSesiones {
  anio: number;
  total: number;
  ordinarias: number;
  extraordinarias: number;
}

export interface Resumen {
  total: number;
  por_estado: Partial<Record<EstadoSesion, number>>;
  por_clase: Partial<Record<Clase, number>>;
  realizadas_sin_acta: number;
  realizadas_incompletas: number;
  ultima: Sesion | null;
  proxima: Sesion | null;
}

export interface Paginado<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface FiltrosSesion {
  tipo_reunion_id?: number | null;
  clase?: Clase | null;
  anio?: number | null;
  numero?: number | null;
  fecha_desde?: string | null;
  fecha_hasta?: string | null;
  mes?: number | null;
  estado?: EstadoSesion | '' | null;
  modalidad?: Modalidad | '' | null;
  documentacion?: string | null;
  buscar?: string | null;
  orden?: string;
  direccion?: 'asc' | 'desc';
  page?: number;
  por_pagina?: number;
}

export const ESTADOS: { valor: EstadoSesion; etiqueta: string }[] = [
  { valor: 'realizada', etiqueta: 'Realizada' },
  { valor: 'programada', etiqueta: 'Programada' },
  { valor: 'reprogramada', etiqueta: 'Reprogramada' },
  { valor: 'suspendida', etiqueta: 'Suspendida' },
];

export const CLASES: { valor: Clase; etiqueta: string; plural: string }[] = [
  { valor: 'ordinaria', etiqueta: 'Ordinaria', plural: 'Ordinarias' },
  { valor: 'extraordinaria', etiqueta: 'Extraordinaria', plural: 'Extraordinarias' },
];

export const MODALIDADES: { valor: Modalidad; etiqueta: string }[] = [
  { valor: 'presencial', etiqueta: 'Presencial' },
  { valor: 'virtual', etiqueta: 'Virtual' },
  { valor: 'mixta', etiqueta: 'Mixta' },
];

export const DOCUMENTACION: { valor: string; etiqueta: string }[] = [
  { valor: 'completa', etiqueta: 'Documentación completa' },
  { valor: 'incompleta', etiqueta: 'Documentación incompleta' },
  { valor: 'sin_acta', etiqueta: 'Sin acta' },
  { valor: 'sin_asistencia', etiqueta: 'Sin lista de asistencia' },
  { valor: 'sin_presentacion', etiqueta: 'Sin presentación' },
  { valor: 'con_adjuntos', etiqueta: 'Con adjuntos adicionales' },
];

/** "requerido" = cuenta para la documentación obligatoria. Todos admiten varios archivos (p. ej. acta en PDF y Word). */
export const TIPOS_DOCUMENTO: { valor: TipoDocumento; etiqueta: string; requerido: boolean; ayuda: string }[] = [
  { valor: 'acta', etiqueta: 'Acta de la reunión', requerido: true, ayuda: 'Acta firmada (PDF) y/o versión Word' },
  { valor: 'asistencia', etiqueta: 'Lista de asistencia', requerido: true, ayuda: 'Registro de participantes' },
  { valor: 'presentacion', etiqueta: 'Presentación', requerido: true, ayuda: 'Diapositivas expuestas' },
  { valor: 'adjunto', etiqueta: 'Adjuntos adicionales', requerido: false, ayuda: 'Informes, anexos u otros' },
];

export interface ResultadoSincronizacion {
  agregados: number;
  desvinculados: number;
  total: number;
}

export interface CarpetaDrive {
  id: number;
  tipo_reunion_id: number;
  clase: Clase;
  anio: number | null;
  folder_id: string;
  nombre: string;
  url: string;
}

export interface EstadoImportacion {
  estado: 'en_curso' | 'terminado' | 'error' | 'interrumpido';
  tipo_reunion_id: number;
  reunion: string;
  clase: Clase;
  inicio: string;
  actualizado: string;
  linea: string;
  sesiones: number;
  resultado: ResultadoImportacion | null;
  mensaje: string | null;
}

export interface EstadoDrive {
  configurado: boolean;
  conectado: boolean;
  email: string | null;
  redirect_uri: string;
  carpetas: CarpetaDrive[];
  importacion: EstadoImportacion | null;
}

export interface ResultadoImportacion {
  anios: number;
  sesiones: number;
  documentos: number;
  desvinculados: number;
  omitidas: string[];
}

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
