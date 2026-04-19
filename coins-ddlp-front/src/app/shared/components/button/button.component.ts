import { Component, input, output } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';

@Component({
  selector: 'app-button',
  imports: [TooltipModule],
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
  tooltip  = input<string>('');

  clicked = output<void>();

  onClick(): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit();
    }
  }
}
