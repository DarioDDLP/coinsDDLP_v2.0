import { Component, input, output } from '@angular/core';

export type OwnershipFilter = 'all' | 'owned' | 'missing';

export interface FilterPillOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-filter-pills',
  templateUrl: './filter-pills.component.html',
  styleUrl: './filter-pills.component.scss',
})
export class FilterPillsComponent {
  readonly options = input.required<FilterPillOption[]>();
  readonly value = input<string>('');

  readonly valueChange = output<string>();
}
