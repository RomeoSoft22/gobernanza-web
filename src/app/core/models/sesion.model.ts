export type EstadoSesion = 'programada' | 'realizada' | 'reprogramada' | 'suspendida';
export type Modalidad = 'presencial' | 'virtual' | 'mixta';
export type TipoDocumento = 'acta' | 'asistencia' | 'presentacion' | 'adjunto';

export interface TipoReunion {
  id: number;
  codigo: string;
  nombre: string;
  base_legal: string | null;
  periodicidad: string;
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
}

export interface Sesion {
  id: number;
  tipo_reunion_id: number;
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
  tipo_reunion?: TipoReunion;
  documentos?: SesionDocumento[];
  acta_count?: number;
  asistencia_count?: number;
  presentacion_count?: number;
  adjuntos_count?: number;
}

export type SesionPayload = Omit<Sesion, 'id' | 'anio' | 'tipo_reunion' | 'documentos'>;

export interface AnioSesiones {
  anio: number;
  total: number;
  desde: number;
  hasta: number;
}

export interface Resumen {
  total: number;
  por_estado: Partial<Record<EstadoSesion, number>>;
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

export const TIPOS_DOCUMENTO: { valor: TipoDocumento; etiqueta: string; unico: boolean; ayuda: string }[] = [
  { valor: 'acta', etiqueta: 'Acta de la reunión', unico: true, ayuda: 'Acta firmada de la sesión' },
  { valor: 'asistencia', etiqueta: 'Lista de asistencia', unico: true, ayuda: 'Registro de participantes' },
  { valor: 'presentacion', etiqueta: 'Presentación', unico: true, ayuda: 'Diapositivas expuestas' },
  { valor: 'adjunto', etiqueta: 'Adjuntos adicionales', unico: false, ayuda: 'Informes, anexos u otros' },
];

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
