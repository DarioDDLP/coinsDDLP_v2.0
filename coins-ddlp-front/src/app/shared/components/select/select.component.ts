import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';

export interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-select',
  imports: [Select, FormsModule],
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss',
})
export class SelectComponent {
  label       = input<string>('');
  value       = input<string>('');
  options     = input<SelectOption[]>([]);
  placeholder = input<string>('');
  disabled    = input<boolean>(false);

  valueChange = output<string>();
}
