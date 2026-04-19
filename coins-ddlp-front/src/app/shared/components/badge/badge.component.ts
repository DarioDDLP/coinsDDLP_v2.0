import { Component, input } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { Severity } from '../../interfaces/severity.interface';

export type BadgeSize = 'sm' | 'md';

@Component({
  selector: 'app-badge',
  imports: [TooltipModule],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
})
export class BadgeComponent {
  readonly label = input.required<string>();
  readonly severity = input<Severity>('secondary');
  readonly size = input<BadgeSize>('sm');
  readonly tooltip = input<string | undefined>(undefined);
}
