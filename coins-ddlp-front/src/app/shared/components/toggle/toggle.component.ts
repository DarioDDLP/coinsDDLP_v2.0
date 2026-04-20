import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToggleSwitch } from 'primeng/toggleswitch';

@Component({
  selector: 'app-toggle',
  imports: [ToggleSwitch, FormsModule],
  templateUrl: './toggle.component.html',
  styleUrl: './toggle.component.scss',
})
export class ToggleComponent {
  label    = input<string>('');
  value    = input<boolean>(false);
  disabled = input<boolean>(false);

  valueChange = output<boolean>();
}
