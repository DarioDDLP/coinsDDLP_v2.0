import { DOCUMENT, inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { NavigationEnd, Router } from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';
import { SUPABASE_CLIENT } from '../../app.config';
import { environment } from '../../../environments/environment';
import { AccessEventType } from '../../shared/interfaces/access-log.interface';
import { I18nService } from '../../shared/services/i18n.service';
import { APP_VERSION } from '../../shared/constants/app-version.const';

const VISIT_STORAGE_KEY = 'accessVisitId';

/**
 * Registro de accesos (Edge Function `access-log`): una visita por pestaña, sus páginas,
 * los inicios y cierres de sesión y los intentos fallidos. Lo ve el admin en /admin/registro.
 *
 * Dispara y olvida: los fallos se ignoran y nunca llegan al ErrorHandler, para no
 * mostrar al visitante un toast por algo que no ha pedido. Solo activo en producción.
 */
@Injectable({ providedIn: 'root' })
export class AccessLogService {
  private http = inject(HttpClient);
  private supabase = inject(SUPABASE_CLIENT);
  private router = inject(Router);
  private document = inject(DOCUMENT);
  private i18n = inject(I18nService);
  private readonly url = `${environment.supabase.url}/functions/v1/access-log`;

  private started = false;
  private lastPath: string | null = null;
  /** Visita en curso (o creándose): las peticiones simultáneas esperan a la misma. */
  private visit: Promise<string | null> | null = null;
  /** Copia síncrona del id para `sendBeacon` al ocultar la pestaña. */
  private visitId: string | null = null;

  /** Empieza a registrar páginas y la duración de la visita. Se llama una vez desde `App`. */
  start(): void {
    if (!environment.accessLog || this.started) return;
    this.started = true;

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        if (e.urlAfterRedirects === this.lastPath) return;
        this.lastPath = e.urlAfterRedirects;
        void this.track('page', { path: e.urlAfterRedirects });
      });

    // Al ocultar o cerrar la pestaña se marca la última actividad (duración de la visita)
    this.document.addEventListener('visibilitychange', () => {
      if (this.document.visibilityState === 'hidden') this.ping();
    });
  }

  /**
   * Registra un evento. Se resuelve en cuanto ha leído la sesión actual (el envío sigue
   * en segundo plano), así que `await track('logout')` antes de cerrar la sesión basta
   * para que el evento lleve el usuario.
   */
  async track(
    type: AccessEventType,
    extra: { path?: string; detail?: string } = {},
  ): Promise<void> {
    if (!environment.accessLog) return;
    try {
      const token = await this.token();
      void this.send(type, extra.path ?? this.router.url, extra.detail ?? null, token);
    } catch {
      // Registrar nunca debe molestar al visitante
    }
  }

  private async send(
    type: AccessEventType,
    path: string,
    detail: string | null,
    token: string | null,
    retry = true,
  ): Promise<void> {
    try {
      const visitId = await this.ensureVisit(token);
      if (!visitId) return;
      await firstValueFrom(
        this.http.post(
          `${this.url}/event`,
          { visitId, type, path, detail },
          { headers: this.headers(token) },
        ),
      );
    } catch (e) {
      // 410: la visita caducó (pestaña abierta más de 24 h): se empieza otra y se reintenta una vez
      if (retry && e instanceof HttpErrorResponse && e.status === 410) {
        this.resetVisit();
        await this.send(type, path, detail, token, false);
      }
    }
  }

  private ensureVisit(token: string | null): Promise<string | null> {
    if (!this.visit) {
      const stored = this.readStoredVisit();
      this.visitId = stored;
      this.visit = stored ? Promise.resolve(stored) : this.createVisit(token);
    }
    return this.visit;
  }

  private async createVisit(token: string | null): Promise<string | null> {
    const nav = this.document.defaultView?.navigator;
    const screen = this.document.defaultView?.screen;
    try {
      const { visitId } = await firstValueFrom(
        this.http.post<{ visitId: string }>(
          `${this.url}/visit`,
          {
            path: this.document.location.pathname + this.document.location.search,
            referrer: this.document.referrer,
            screen: screen ? `${screen.width}×${screen.height}` : null,
            language: nav?.language ?? null,
            appLang: this.i18n.lang(),
            appVersion: APP_VERSION,
            touch: (nav?.maxTouchPoints ?? 0) > 1,
          },
          { headers: this.headers(token) },
        ),
      );
      this.visitId = visitId;
      this.storeVisit(visitId);
      return visitId;
    } catch {
      // Sin visita no se registra nada más; se volverá a intentar en la próxima navegación
      this.visit = null;
      return null;
    }
  }

  private ping(): void {
    if (!this.visitId) return;
    // sendBeacon sobrevive al cierre de la pestaña; va como text/plain (sin preflight CORS)
    this.document.defaultView?.navigator.sendBeacon?.(
      `${this.url}/ping`,
      JSON.stringify({ visitId: this.visitId }),
    );
  }

  private resetVisit(): void {
    this.visit = null;
    this.visitId = null;
    try {
      sessionStorage.removeItem(VISIT_STORAGE_KEY);
    } catch {
      // sessionStorage no disponible
    }
  }

  private readStoredVisit(): string | null {
    try {
      return sessionStorage.getItem(VISIT_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private storeVisit(visitId: string): void {
    try {
      sessionStorage.setItem(VISIT_STORAGE_KEY, visitId);
    } catch {
      // sessionStorage no disponible: cada recarga contará como una visita nueva
    }
  }

  private async token(): Promise<string | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  private headers(token: string | null): HttpHeaders {
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
