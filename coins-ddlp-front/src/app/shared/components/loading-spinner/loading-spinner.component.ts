import { Component, input } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { LITERALS } from '../../constants/literals';

@Component({
  selector: 'app-loading-spinner',
  imports: [ProgressSpinnerModule],
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.scss',
})
export class LoadingSpinnerComponent {
  readonly message = input<string>(LITERALS.shared.loading);
}
