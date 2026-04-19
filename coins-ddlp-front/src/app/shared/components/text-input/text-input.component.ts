import { Component, input, output } from '@angular/core';

export type TextInputType = 'text' | 'email' | 'password' | 'number';

@Component({
  selector: 'app-text-input',
  templateUrl: './text-input.component.html',
  styleUrl: './text-input.component.scss',
})
export class TextInputComponent {
  label        = input<string>('');
  value        = input<string>('');
  type         = input<TextInputType>('text');
  placeholder  = input<string>('');
  autocomplete = input<string>('off');
  disabled     = input<boolean>(false);
  min          = input<number | null>(null);
  max          = input<number | null>(null);

  valueChange  = output<string>();
  enterPressed = output<void>();

  onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }

  onEnter(): void {
    this.enterPressed.emit();
  }
}
