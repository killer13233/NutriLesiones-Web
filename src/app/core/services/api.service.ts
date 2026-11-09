import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Catalogos, ErrorApi, IndicacionRequest, IndicacionResponse, PlanRequest, PlanResponse } from '../models/api.models';

/** Tiempo máximo de espera: el servidor gratuito puede tardar ~30 s en despertar. */
const ESPERA_MAXIMA_MS = 70_000;
/** La indicación es un complemento: si tarda, se deja el texto anterior. */
const ESPERA_INDICACION_MS = 15_000;

export type TipoError = 'conexion' | 'lento' | 'validacion' | 'servidor';
export interface ErrorAmigable { tipo: TipoError; mensaje: string; }

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  readonly apiUrl = environment.apiUrl.replace(/\/+$/, '');

  salud(): Observable<{ estado: string }> {
    return this.http.get<{ estado: string }>(`${this.apiUrl}/api/salud`).pipe(timeout(ESPERA_MAXIMA_MS));
  }

  catalogos(): Observable<Catalogos> {
    return this.http.get<Catalogos>(`${this.apiUrl}/api/catalogos`).pipe(timeout(ESPERA_MAXIMA_MS));
  }

  plan(cuerpo: PlanRequest): Observable<PlanResponse> {
    return this.http.post<PlanResponse>(`${this.apiUrl}/api/plan`, cuerpo).pipe(timeout(ESPERA_MAXIMA_MS));
  }

  indicacion(cuerpo: IndicacionRequest): Observable<IndicacionResponse> {
    return this.http.post<IndicacionResponse>(`${this.apiUrl}/api/indicacion`, cuerpo).pipe(timeout(ESPERA_INDICACION_MS));
  }

  /** La foto viene como ruta relativa ("imagenes/arroz.jpg"). */
  fotoUrl(ruta: string): string {
    return `${this.apiUrl}/${ruta.replace(/^\/+/, '')}`;
  }
}

/** Traduce cualquier fallo a un mensaje en español claro. Nunca muestra JSON ni textos técnicos. */
export function traducirError(err: unknown): ErrorAmigable {
  const nombre = (err as { name?: string })?.name;
  if (nombre === 'TimeoutError') {
    return {
      tipo: 'lento',
      mensaje: 'El servidor está tardando más de lo normal. El servidor gratuito puede tardar unos 30 segundos en despertar. Pulsa Reintentar.',
    };
  }
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return { tipo: 'conexion', mensaje: 'No pudimos comunicarnos con el servidor. Revisa tu conexión a internet y vuelve a intentarlo.' };
    }
    if (err.status === 400) {
      const cuerpo = err.error as Partial<ErrorApi> | null;
      const texto = typeof cuerpo?.error === 'string' ? cuerpo.error : null;
      return { tipo: 'validacion', mensaje: texto ?? 'Hay un dato que el servidor no aceptó. Revisa el peso y la fase e inténtalo de nuevo.' };
    }
    if (err.status === 502 || err.status === 503 || err.status === 504) {
      return {
        tipo: 'lento',
        mensaje: 'El servidor se está despertando. El servidor gratuito puede tardar unos 30 segundos. Pulsa Reintentar.',
      };
    }
  }
  return { tipo: 'servidor', mensaje: 'Ocurrió un problema al generar el menú. Inténtalo de nuevo en unos segundos.' };
}