import { Injectable, signal } from '@angular/core';

export interface PageHeader {
  title: string;
  /** Ruta a la que vuelve el botón atrás de la barra superior (móvil). */
  backLink?: unknown[] | null;
  backQueryParams?: Record<string, unknown> | null;
  /** Bandera opcional junto al título (nombre de país). */
  country?: string | null;
}

/**
 * Cabecera de la página activa. La rellena `page-layout` y la consume la barra
 * superior de móvil, que no tiene acceso directo a la página.
 */
@Injectable({ providedIn: 'root' })
export class PageHeaderService {
  readonly header = signal<PageHeader | null>(null);

  set(header: PageHeader): void {
    this.header.set(header);
  }

  clear(): void {
    this.header.set(null);
  }
}
