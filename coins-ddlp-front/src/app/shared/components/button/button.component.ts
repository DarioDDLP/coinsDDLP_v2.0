import { Component, computed, input, output } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';

/**
 * primary   → relleno oro: la acción principal de la vista
 * secondary → neutro con borde: cancelar, volver
 * tertiary  → solo contorno: acciones auxiliares (exportar)
 * ghost     → sin fondo: iconos en filas de tabla
 * danger    → rojo; relleno con texto, solo color si es un icono
 */
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';

@Component({
  selector: 'app-button',
  imports: [TooltipModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  host: {
    '[class.block]': 'block()',
  },
})
export class ButtonComponent {
  label = input<string>('');
  variant = input<ButtonVariant>('primary');
  icon = input<string>('');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  type = input<'button' | 'submit'>('button');
  tooltip = input<string>('');
  /** Ocupa todo el ancho disponible (p. ej. CTA fijo en móvil). */
  block = input<boolean>(false);

  clicked = output<void>();

  readonly iconOnly = computed(() => !this.label());
  /** Un botón solo-icono necesita nombre accesible: se usa el tooltip. */
  readonly ariaLabel = computed(() => (this.iconOnly() ? this.tooltip() || null : null));

  onClick(): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit();
    }
  }
}
