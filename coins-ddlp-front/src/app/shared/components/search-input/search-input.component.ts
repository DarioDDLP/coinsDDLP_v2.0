import { Component, input, output, computed } from '@angular/core';
import { injectLiterals } from '../../services/i18n.service';

@Component({
  selector: 'app-search-input',
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss',
})
export class SearchInputComponent {
  /** Por defecto, "Buscar" en el idioma activo. */
  placeholder = input<string>('');
  value = input<string>('');

  valueChange = output<string>();

  readonly literals = injectLiterals('shared');
  readonly placeholderText = computed(() => this.placeholder() || this.literals().search);

  onInput(query: string): void {
    this.valueChange.emit(query);
  }
}
