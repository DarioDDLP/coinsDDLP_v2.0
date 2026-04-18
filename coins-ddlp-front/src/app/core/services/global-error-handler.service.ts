import { ErrorHandler, inject, Injectable, Injector } from '@angular/core';
import { MessageService } from 'primeng/api';
import { LITERALS } from '../../shared/constants/literals';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private injector = inject(Injector);

  handleError(error: unknown): void {
    console.error('[Error]', error);
    try {
      this.injector.get(MessageService).add({
        severity: 'error',
        summary: LITERALS.shared.toastError,
        detail: this.extractMessage(error),
        life: 5000,
      });
    } catch {
      // MessageService no disponible en bootstrap
    }
  }

  private extractMessage(error: unknown): string {
    if (error == null) return LITERALS.shared.error;
    if (typeof error === 'string') return error;
    if (typeof error === 'object') {
      const e = error as Record<string, unknown>;
      // Status 0: la petición no llegó al servidor (red cortada, CORS, bloqueada)
      if (e['status'] === 0) return LITERALS.shared.errorLoadMessage;
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
    return LITERALS.shared.error;
  }
}
