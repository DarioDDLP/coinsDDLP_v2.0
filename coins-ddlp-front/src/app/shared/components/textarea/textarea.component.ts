import { Component, input, output } from '@angular/core';
import { uniqueId } from '../../helpers/unique-id.helper';

@Component({
  selector: 'app-textarea',
  templateUrl: './textarea.component.html',
  styleUrl: './textarea.component.scss',
})
export class TextareaComponent {
  label = input<string>('');
  value = input<string>('');
  placeholder = input<string>('');
  rows = input<number>(3);
  disabled = input<boolean>(false);

  valueChange = output<string>();

  readonly id = uniqueId('textarea');

  onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLTextAreaElement).value);
  }
}
