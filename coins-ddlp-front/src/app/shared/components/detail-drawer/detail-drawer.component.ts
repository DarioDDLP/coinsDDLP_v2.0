import {
  Component,
  DestroyRef,
  DOCUMENT,
  inject,
  input,
  output,
  Renderer2,
  signal,
} from '@angular/core';
import { Drawer } from 'primeng/drawer';
import { ButtonComponent } from '../button/button.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { LITERALS } from '../../constants/literals';

/** Duración aproximada de la animación de salida del drawer. */
const CLOSE_ANIMATION_MS = 220;

/**
 * Panel lateral de ficha (detalle de moneda). Pensado para montarse en una ruta hija:
 * se abre al crearse y emite `closed` cuando termina de cerrarse, para que la página navegue.
 *
 * Usa un fondo y un bloqueo de scroll propios en lugar de la máscara modal de PrimeNG,
 * que se queda huérfana (y bloquea la app) si el drawer se destruye durante su animación.
 *
 * Slots: [drawer-overline] (icono/bandera junto a la línea superior), contenido por
 * defecto (cuerpo) y [drawer-footer] (acciones fijas abajo).
 */
@Component({
  selector: 'app-detail-drawer',
  imports: [Drawer, SkeletonComponent, ButtonComponent],
  templateUrl: './detail-drawer.component.html',
  styleUrl: './detail-drawer.component.scss',
})
export class DetailDrawerComponent {
  readonly overline = input<string>('');
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  /** Nombre accesible del panel. */
  readonly ariaLabel = input<string>('');
  /** Mientras es true el cuerpo muestra el skeleton de ficha (badges, imágenes y características). */
  readonly loading = input(false);

  /** Se emite una sola vez, cuando el panel ha terminado de cerrarse. */
  readonly closed = output<void>();

  readonly closeLabel = LITERALS.shared.close;
  readonly open = signal(true);
  private closing = false;

  constructor() {
    const body = inject(DOCUMENT).body;
    const renderer = inject(Renderer2);
    renderer.setStyle(body, 'overflow', 'hidden');
    inject(DestroyRef).onDestroy(() => renderer.removeStyle(body, 'overflow'));
  }

  /** Único punto de cierre (botón, fondo, Esc vía onHide o la propia página). */
  requestClose(): void {
    if (this.closing) return;
    this.closing = true;
    this.open.set(false);
    setTimeout(() => this.closed.emit(), CLOSE_ANIMATION_MS);
  }
}
