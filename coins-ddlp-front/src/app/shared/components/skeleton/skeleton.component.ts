import { Component, computed, input } from '@angular/core';
import { Skeleton } from 'primeng/skeleton';
import { injectLiterals } from '../../services/i18n.service';

export type SkeletonRadius = 'sm' | 'md' | 'lg' | 'full';
export type SkeletonShape = 'rect' | 'circle';
export type SkeletonLayout = 'stack' | 'inline';

/**
 * Único marcador de carga de la app: repite N bloques y anuncia "Cargando…" a lectores de pantalla.
 * - `stack`: columna propia (filas de tabla, listas, formularios).
 * - `inline`: los bloques fluyen en el contenedor del padre (fila de chips, grid de tarjetas).
 * - `circle`: círculo que ocupa el ancho indicado (100% por defecto) con proporción 1:1.
 * Si una vista pinta varios, solo el principal anuncia; el resto lleva `[announce]="false"`.
 */
@Component({
  selector: 'app-skeleton',
  imports: [Skeleton],
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.scss',
  host: {
    '[class]': "'layout-' + layout()",
    '[attr.aria-busy]': 'announce() || null',
  },
})
export class SkeletonComponent {
  readonly count = input(1);
  readonly height = input('3rem');
  readonly width = input('100%');
  readonly radius = input<SkeletonRadius>('md');
  readonly shape = input<SkeletonShape>('rect');
  readonly layout = input<SkeletonLayout>('stack');
  readonly announce = input(true);

  readonly literals = injectLiterals('shared');
  readonly items = computed(() => Array.from({ length: this.count() }));
  readonly isCircle = computed(() => this.shape() === 'circle');
  readonly blockHeight = computed(() => (this.isCircle() ? 'auto' : this.height()));
  readonly borderRadius = computed(() =>
    this.isCircle() ? undefined : `var(--radius-${this.radius()})`,
  );
}
