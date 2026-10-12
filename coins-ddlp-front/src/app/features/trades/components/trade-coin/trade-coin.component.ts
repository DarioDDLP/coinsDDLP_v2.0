import { Component, input } from '@angular/core';
import { CountryFlagComponent } from '../../../../shared/components/country-flag/country-flag.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { FaceValuePipe } from '../../../../shared/pipes/face-value.pipe';
import { CountryNamePipe } from '../../../../shared/pipes/country-name.pipe';
import { TradeCoinInfo } from '../../../../shared/interfaces/trade.interface';

/** Una moneda en la cesta o en una solicitud: bandera, valor, año, país y descripción. */
@Component({
  selector: 'app-trade-coin',
  imports: [CountryFlagComponent, BadgeComponent, FaceValuePipe, CountryNamePipe],
  templateUrl: './trade-coin.component.html',
  styleUrl: './trade-coin.component.scss',
})
export class TradeCoinComponent {
  readonly coin = input.required<TradeCoinInfo>();
}
