import { Component, input, output } from '@angular/core';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-empty-panel',
  imports: [ButtonComponent],
  templateUrl: './empty-panel.component.html',
  styleUrl: './empty-panel.component.scss',
})
export class EmptyPanelComponent {
  readonly icon = input<string>('pi-inbox');
  readonly title = input.required<string>();
  readonly message = input<string>('');
  readonly retryLabel = input<string>('');

  readonly retry = output<void>();
}
