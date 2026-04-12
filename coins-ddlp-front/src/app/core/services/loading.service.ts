import { Injectable, signal } from '@angular/core';

/**
 * Servicio global para gestionar el estado de carga de la aplicación.
 * Usado por componentes para mostrar/ocultar spinner mientras hay peticiones.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  readonly isLoading = signal(false);
  private loadingCount = 0;

  showLoading(): void {
    this.loadingCount++;
    this.isLoading.set(true);
  }

  hideLoading(): void {
    this.loadingCount = Math.max(0, this.loadingCount - 1);
    if (this.loadingCount === 0) {
      this.isLoading.set(false);
    }
  }
}
