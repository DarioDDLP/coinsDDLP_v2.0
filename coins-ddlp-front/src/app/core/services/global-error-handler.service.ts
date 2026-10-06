import { ErrorHandler, inject, Injectable, Injector } from '@angular/core';
import { MessageService } from 'primeng/api';
import { I18nService } from '../../shared/services/i18n.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private injector = inject(Injector);

  handleError(error: unknown): void {
    console.error('[Error]', error);
    try {
      this.injector.get(MessageService).add({
        severity: 'error',
        summary: this.text('shared.toastError'),
        detail: this.extractMessage(error),
        life: 5000,
      });
    } catch {
      // MessageService no disponible en bootstrap
    }
  }

  /** Texto en el idioma activo en el momento del error. */
  private text(key: string): string {
    return this.injector.get(I18nService).translate(key);
  }

  private extractMessage(error: unknown): string {
    if (error == null) return this.text('shared.error');
    if (typeof error === 'string') return error;
    if (typeof error === 'object') {
      const e = error as Record<string, unknown>;
      // Status 0: la petición no llegó al servidor (red cortada, CORS, bloqueada)
      if (e['status'] === 0) return this.text('shared.errorLoadMessage');
      if (e['error'] != null) {
        // HttpErrorResponse: body JSON como objeto — buscar 'message' y luego 'error'
        if (typeof e['error'] === 'object' && !(e['error'] instanceof Event)) {
          const body = e['error'] as Record<string, unknown>;
          if (typeof body['message'] === 'string') return body['message'];
          if (typeof body['error'] === 'string') return body['error'];
        }
        // Body como string plano
        if (typeof e['error'] === 'string') return e['error'];
      }
      // Error estándar de JS o PostgrestError de Supabase
      if (typeof e['message'] === 'string') return e['message'];
    }
    return this.text('shared.error');
  }
}
