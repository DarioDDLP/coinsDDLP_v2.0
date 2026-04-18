import { Component, input } from '@angular/core';
import { Severity } from '../../interfaces/severity.interface';

export type BadgeSize = 'sm' | 'md';

@Component({
  selector: 'app-badge',
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
})
export class BadgeComponent {
  readonly label = input.required<string>();
  readonly severity = input<Severity>('secondary');
  readonly size = input<BadgeSize>('sm');
  readonly tooltip = input<string | undefined>(undefined);
}
