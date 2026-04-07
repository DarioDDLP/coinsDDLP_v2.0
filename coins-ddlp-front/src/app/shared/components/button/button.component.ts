import { Component, input, output } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

@Component({
  selector: 'app-button',
  standalone: true,
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  label    = input<string>('');
  variant  = input<ButtonVariant>('primary');
  icon     = input<string>('');
  disabled = input<boolean>(false);
  loading  = input<boolean>(false);
  type     = input<'button' | 'submit'>('button');

  clicked = output<void>();

  onClick(): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit();
    }
  }
}
