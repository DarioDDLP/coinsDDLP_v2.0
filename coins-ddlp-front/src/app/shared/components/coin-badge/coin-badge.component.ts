import { Component, computed, input } from '@angular/core';
import { CONSERVATION_MAP } from '../../constants/conservation-states.const';

@Component({
  selector: 'app-coin-badge',
  standalone: true,
  templateUrl: './coin-badge.component.html',
  styleUrl: './coin-badge.component.scss',
})
export class CoinBadgeComponent {
  readonly code = input.required<string>();

  readonly state = computed(() => CONSERVATION_MAP.get(this.code()) ?? CONSERVATION_MAP.get('ND')!);
}
