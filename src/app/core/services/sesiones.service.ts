import { HttpClient, HttpEvent, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AnioSesiones, CarpetaDrive, Clase, EstadoDrive, EstadoImportacion, FiltrosSesion, Paginado, Resumen,
  ResultadoSincronizacion, Sesion, SesionDocumento, SesionPayload, TipoDocumento, TipoReunion,
} from '../models/sesion.model';

@Injectable({ providedIn: 'root' })
export class SesionesService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  /** Catálogo de reuniones (se pide una sola vez y se comparte). */
  private tipos$ = this.http.get<TipoReunion[]>(`${this.api}/tipos-reunion`).pipe(shareReplay(1));

  tiposReunion(): Observable<TipoReunion[]> {
    return this.tipos$;
  }

  tipoPorSlug(slug: string): Observable<TipoReunion | undefined> {
    return this.tipos$.pipe(map(tipos => tipos.find(t => t.slug === slug)));
  }

  listar(filtros: FiltrosSesion): Observable<Paginado<Sesion>> {
    return this.http.get<Paginado<Sesion>>(`${this.api}/sesiones`, { params: this.params(filtros) });
  }

  anios(tipoReunionId?: number | null): Observable<AnioSesiones[]> {
    return this.http.get<AnioSesiones[]>(`${this.api}/sesiones/anios`, {
      params: this.params({ tipo_reunion_id: tipoReunionId }),
    });
  }

  crearAnio(tipoReunionId: number, anio: number): Observable<Record<Clase, CarpetaDrive>> {
    return this.http.post<Record<Clase, CarpetaDrive>>(`${this.api}/sesiones/anios`, { tipo_reunion_id: tipoReunionId, anio });
  }

  resumen(filtros: { tipo_reunion_id?: number | null; anio?: number | null; clase?: Clase | null } = {}): Observable<Resumen> {
    return this.http.get<Resumen>(`${this.api}/sesiones/resumen`, { params: this.params(filtros) });
  }

  /** Ordinarias: correlativo continuo. Extraordinarias: reinician cada año (se envía el año). */
  siguienteNumero(tipoReunionId: number, clase: Clase, anio: number): Observable<{ numero: number }> {
    return this.http.get<{ numero: number }>(`${this.api}/sesiones/siguiente-numero`, {
      params: { tipo_reunion_id: tipoReunionId, clase, anio },
    });
  }

  obtener(id: number): Observable<Sesion> {
    return this.http.get<Sesion>(`${this.api}/sesiones/${id}`);
  }

  crear(data: SesionPayload): Observable<Sesion> {
    return this.http.post<Sesion>(`${this.api}/sesiones`, data);
  }

  actualizar(id: number, data: SesionPayload): Observable<Sesion> {
    return this.http.put<Sesion>(`${this.api}/sesiones/${id}`, data);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/sesiones/${id}`);
  }

  subirDocumentos(sesionId: number, tipo: TipoDocumento, archivos: File[], descripcion?: string)
    : Observable<HttpEvent<SesionDocumento[]>> {
    const form = new FormData();
    form.append('tipo', tipo);
    if (descripcion) form.append('descripcion', descripcion);
    archivos.forEach(a => form.append('archivos[]', a, a.name));
    return this.http.post<SesionDocumento[]>(`${this.api}/sesiones/${sesionId}/documentos`, form, {
      reportProgress: true,
      observe: 'events',
    });
  }

  eliminarDocumento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/documentos/${id}`);
  }

  cambiarTipoDocumento(id: number, tipo: TipoDocumento): Observable<SesionDocumento> {
    return this.http.patch<SesionDocumento>(`${this.api}/documentos/${id}`, { tipo });
  }

  // ---------------------------------------------------------------- Google Drive

  estadoDrive(): Observable<EstadoDrive> {
    return this.http.get<EstadoDrive>(`${this.api}/drive/estado`);
  }

  urlAutorizacionDrive(): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.api}/drive/autorizar`);
  }

  desconectarDrive(): Observable<void> {
    return this.http.delete<void>(`${this.api}/drive/conexion`);
  }

  definirCarpetaDrive(tipoReunionId: number, clase: Clase, enlace: string): Observable<CarpetaDrive> {
    return this.http.put<CarpetaDrive>(`${this.api}/drive/carpetas`, { tipo_reunion_id: tipoReunionId, clase, enlace });
  }

  quitarCarpetaDrive(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/drive/carpetas/${id}`);
  }

  /** Lanza la importación en segundo plano; el avance se consulta con estadoImportacion(). */
  importarHistorial(tipoReunionId: number, clase: Clase): Observable<EstadoImportacion> {
    return this.http.post<EstadoImportacion>(`${this.api}/drive/importar-historial`, { tipo_reunion_id: tipoReunionId, clase });
  }

  estadoImportacion(): Observable<EstadoImportacion | null> {
    return this.http.get<EstadoImportacion | null>(`${this.api}/drive/importacion`);
  }

  /**
   * Lee en vivo la carpeta de la sesión en Drive y devuelve la sesión con sus documentos actualizados.
   * Con crear = true busca o crea la carpeta si la sesión aún no la tiene.
   */
  sincronizarDrive(sesionId: number, crear = false): Observable<{ resultado: ResultadoSincronizacion; sesion: Sesion }> {
    return this.http.post<{ resultado: ResultadoSincronizacion; sesion: Sesion }>(
      `${this.api}/sesiones/${sesionId}/drive/sincronizar`, {}, { params: { crear: crear ? 1 : 0 } },
    );
  }

  urlVer(doc: SesionDocumento): string {
    return `${this.api}/documentos/${doc.id}/ver`;
  }

  urlDescargar(doc: SesionDocumento): string {
    return `${this.api}/documentos/${doc.id}/descargar`;
  }

  private params(obj: object): HttpParams {
    let p = new HttpParams();
    Object.entries(obj).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') p = p.set(k, String(v));
    });
    return p;
  }
}
