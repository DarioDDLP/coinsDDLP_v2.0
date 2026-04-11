import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-search-input',
  standalone: true,
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss',
})
export class SearchInputComponent {
  placeholder = input<string>('Buscar...');
  value = input<string>('');

  valueChange = output<string>();

  onInput(query: string): void {
    this.valueChange.emit(query);
  }
}
