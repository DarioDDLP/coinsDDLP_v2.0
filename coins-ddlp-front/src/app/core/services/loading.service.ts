import { Injectable, signal } from '@angular/core';
import { defer, finalize, MonoTypeOperatorFunction } from 'rxjs';

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

  // defer: showLoading corre al suscribirse, no al construir el pipe
  withLoading<T>(): MonoTypeOperatorFunction<T> {
    return (source) => defer(() => {
      this.showLoading();
      return source.pipe(finalize(() => this.hideLoading()));
    });
  }
}
