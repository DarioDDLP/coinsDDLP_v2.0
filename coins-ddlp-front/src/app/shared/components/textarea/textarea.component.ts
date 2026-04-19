import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-textarea',
  templateUrl: './textarea.component.html',
  styleUrl: './textarea.component.scss',
})
export class TextareaComponent {
  label       = input<string>('');
  value       = input<string>('');
  placeholder = input<string>('');
  rows        = input<number>(3);
  disabled    = input<boolean>(false);

  valueChange = output<string>();

  onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLTextAreaElement).value);
  }
}
