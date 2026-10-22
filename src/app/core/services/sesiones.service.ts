import { HttpClient, HttpEvent, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AnioSesiones, FiltrosSesion, Paginado, Resumen, Sesion, SesionDocumento,
  SesionPayload, TipoDocumento, TipoReunion,
} from '../models/sesion.model';

@Injectable({ providedIn: 'root' })
export class SesionesService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  tiposReunion(): Observable<TipoReunion[]> {
    return this.http.get<TipoReunion[]>(`${this.api}/tipos-reunion`);
  }

  listar(filtros: FiltrosSesion): Observable<Paginado<Sesion>> {
    return this.http.get<Paginado<Sesion>>(`${this.api}/sesiones`, { params: this.params(filtros) });
  }

  anios(tipoReunionId?: number | null): Observable<AnioSesiones[]> {
    return this.http.get<AnioSesiones[]>(`${this.api}/sesiones/anios`, {
      params: this.params({ tipo_reunion_id: tipoReunionId }),
    });
  }

  resumen(filtros: { tipo_reunion_id?: number | null; anio?: number | null } = {}): Observable<Resumen> {
    return this.http.get<Resumen>(`${this.api}/sesiones/resumen`, { params: this.params(filtros) });
  }

  siguienteNumero(tipoReunionId: number): Observable<{ numero: number }> {
    return this.http.get<{ numero: number }>(`${this.api}/sesiones/siguiente-numero`, {
      params: { tipo_reunion_id: tipoReunionId },
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
