import { Component, input, output } from '@angular/core';
import { LITERALS } from '../../constants/literals';

@Component({
  selector: 'app-search-input',
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss',
})
export class SearchInputComponent {
  placeholder = input<string>(LITERALS.shared.search);
  value = input<string>('');

  valueChange = output<string>();

  readonly clearLabel = LITERALS.shared.clearSearch;

  onInput(query: string): void {
    this.valueChange.emit(query);
  }
}
