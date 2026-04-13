import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-unit-badge',
  standalone: true,
  templateUrl: './unit-badge.component.html',
  styleUrl: './unit-badge.component.scss',
})
export class UnitBadgeComponent {
  readonly uds = input.required<number>();

  readonly severity = computed(() => {
    const u = this.uds();
    if (u === 0) return 'danger';
    if (u === 1) return 'success';
    return 'info';
  });
}
