import { Component, input } from '@angular/core';

/**
 * Monograma «Placa» DDLP (marca personal del autor). Trazos propios, sin fuente: las letras
 * toman `currentColor` y la placa `--accent`, así cada web lo pinta con su paleta.
 * Sin `label` es decorativo (`aria-hidden`); el alto se fija desde fuera (`height` del host).
 */
@Component({
  selector: 'app-ddlp-logo',
  templateUrl: './ddlp-logo.component.html',
  styleUrl: './ddlp-logo.component.scss',
})
export class DdlpLogoComponent {
  readonly label = input<string>();
}
